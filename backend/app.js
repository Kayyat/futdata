require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const API_FOOTBALL_BASE_URL = process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY || "";
const rawUseLive = process.env.API_FOOTBALL_USE_LIVE;
const API_FOOTBALL_USE_LIVE = rawUseLive
  ? String(rawUseLive).toLowerCase() === "true"
  : Boolean(API_FOOTBALL_KEY);
const API_FOOTBALL_DEFAULT_LEAGUE = process.env.API_FOOTBALL_DEFAULT_LEAGUE || "71";
const API_FOOTBALL_DEFAULT_SEASON = process.env.API_FOOTBALL_DEFAULT_SEASON || String(new Date().getFullYear());

let lastApiFootballError = "";
const apiCache = new Map();

function setLastApiFootballError(message = "") {
  lastApiFootballError = message;
}

function getLastApiFootballError() {
  return lastApiFootballError;
}

function parseOrigins(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error(`CORS bloqueado para origem: ${origin}`), { statusCode: 403 }));
    },
    credentials: true,
  })
);

app.use(express.json());

const PLAYERS_PATH = path.join(__dirname, "data", "players.json");
const COACHES_PATH = path.join(__dirname, "data", "coaches.json");

function loadJsonArray(filePath, label) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (err) {
    console.error(`❌ Erro ao ler ${label}:`, err.message);
    return [];
  }
}

function getPlayersLocal() {
  return loadJsonArray(PLAYERS_PATH, "players.json");
}

function getCoachesLocal() {
  return loadJsonArray(COACHES_PATH, "coaches.json");
}

function normalize(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function percentile(value, arr) {
  const vals = arr.slice().sort((a, b) => a - b);
  if (!vals.length) return 0;
  const below = vals.filter((v) => v < value).length;
  const equal = vals.filter((v) => v === value).length;
  const rank = below + equal / 2;
  return Math.round((rank / vals.length) * 100);
}

function mockMetrics(player) {
  const base = {
    minutos: 900,
    gols: 0,
    assistencias: 0,
    chutes_no_alvo: 0,
    passes_chave: 0,
    desarmes: 0,
    defesas: 0,
  };

  if (player.posicao === "Atacante") return { ...base, gols: 8, assistencias: 2, chutes_no_alvo: 15, passes_chave: 4, desarmes: 4 };
  if (player.posicao === "Meia") return { ...base, gols: 2, assistencias: 6, chutes_no_alvo: 6, passes_chave: 20, desarmes: 10 };
  if (player.posicao === "Zagueiro") return { ...base, gols: 1, assistencias: 0, chutes_no_alvo: 1, passes_chave: 2, desarmes: 18 };
  if (player.posicao === "Lateral") return { ...base, gols: 1, assistencias: 3, chutes_no_alvo: 3, passes_chave: 8, desarmes: 16 };
  if (player.posicao === "Goleiro") return { ...base, defesas: 32 };
  return base;
}

function applyFilters(list, query) {
  const posicao = normalize(query.posicao);
  const time = normalize(query.time);
  const q = normalize(query.q);

  return list.filter((p) => {
    const okPosicao = posicao ? normalize(p.posicao) === posicao : true;
    const okTime = time ? normalize(p.time) === time : true;
    const okQ = q ? normalize(p.nome).includes(q) : true;
    return okPosicao && okTime && okQ;
  });
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function topByMetric(players, metricKey, limit = 5) {
  const withValue = players.map((p) => ({ player: p, metrics: p.metrics || mockMetrics(p) }));
  withValue.sort((a, b) => (b.metrics[metricKey] || 0) - (a.metrics[metricKey] || 0));
  return withValue.slice(0, limit).map((x) => ({
    id: x.player.id,
    nome: x.player.nome,
    posicao: x.player.posicao,
    time: x.player.time,
    value: x.metrics[metricKey] || 0,
  }));
}

function coachImpactHistory(coachId) {
  const seasons = [2023, 2024, 2025];
  function rnd(n) {
    const x = Math.sin(coachId * 999 + n * 123) * 10000;
    return x - Math.floor(x);
  }
  return seasons.map((year, idx) => {
    const jogos = 38 - idx * 2;
    const winRate = 0.45 + rnd(idx) * 0.25;
    const vitorias = Math.round(jogos * winRate);
    const empates = Math.round((jogos - vitorias) * (0.35 + rnd(idx + 10) * 0.2));
    const derrotas = Math.max(0, jogos - vitorias - empates);
    const aproveitamento = Math.round(((vitorias * 3 + empates) / (jogos * 3)) * 100);
    return { temporada: String(year), jogos, vitorias, empates, derrotas, aproveitamento_pct: aproveitamento };
  });
}

function parsePositiveInt(value, fieldLabel) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`${fieldLabel} inválido`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function parseOptionalPositiveInt(value, fieldLabel, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return parsePositiveInt(value, fieldLabel);
}

function resolveDataMode() {
  return API_FOOTBALL_USE_LIVE && Boolean(API_FOOTBALL_KEY) ? "api-football" : "local";
}

function resolveEffectiveDataMode() {
  if (resolveDataMode() !== "api-football") return "local";
  if (getLastApiFootballError()) return "local";
  return "api-football";
}

function resolveDataModeReason() {
  if (!API_FOOTBALL_USE_LIVE) return "API_FOOTBALL_USE_LIVE=false";
  if (!API_FOOTBALL_KEY) return "API_FOOTBALL_KEY ausente";
  if (getLastApiFootballError()) return `fallback local por erro de rede: ${getLastApiFootballError()}`;
  return "API-Football habilitada";
}

async function apiFootballGet(endpoint, params = {}) {
  const url = new URL(`${API_FOOTBALL_BASE_URL}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(payload?.errors?.message || `API-Football erro HTTP ${response.status}`);
    err.statusCode = 502;
    throw err;
  }

  const hasApiErrors = payload && payload.errors && typeof payload.errors === "object" && Object.keys(payload.errors).length > 0;
  if (hasApiErrors) {
    const firstError = Object.values(payload.errors).find(Boolean);
    const err = new Error(String(firstError || "API-Football retornou erro"));
    err.statusCode = 502;
    throw err;
  }

  return payload;
}

async function apiFootballGetCached(endpoint, params = {}, ttlMs = 60000) {
  const key = `${endpoint}?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString()}`;
  const now = Date.now();
  const cached = apiCache.get(key);
  if (cached && now - cached.time < ttlMs) return cached.payload;

  const payload = await apiFootballGet(endpoint, params);
  apiCache.set(key, { time: now, payload });
  return payload;
}

function mapApiFootballPlayer(item) {
  const player = item?.player || {};
  const stats = Array.isArray(item?.statistics) ? item.statistics[0] : null;
  const teamName = stats?.team?.name || "";
  const position = stats?.games?.position || "";

  return {
    id: player.id,
    nome: player.name || "",
    posicao: position || "",
    time: teamName || "",
    team_id: stats?.team?.id || null,
    idade: player.age || null,
    pe: player.birth?.place || "",
    metrics: {
      minutos: stats?.games?.minutes || 0,
      gols: stats?.goals?.total || 0,
      assistencias: stats?.goals?.assists || 0,
      chutes_no_alvo: stats?.shots?.on || 0,
      passes_chave: stats?.passes?.key || 0,
      desarmes: stats?.tackles?.total || 0,
      defesas: stats?.goals?.saves || 0,
    },
  };
}

function mapApiFootballCoach(item) {
  const teamName = Array.isArray(item?.career) && item.career.length > 0 ? item.career[0]?.team?.name : "";

  return {
    id: item.id,
    nome: item.name || "",
    nacionalidade: item.nationality || "",
    idade: item.age || null,
    ultimo_clube: teamName || "",
    perfil: "Perfil vindo da API-Football",
  };
}


function shouldFallbackToLocal(err) {
  const message = String(err?.message || "").toLowerCase();
  return message.includes("fetch failed") || message.includes("enetunreach") || message.includes("econnreset") || message.includes("etimedout");
}

async function getTeams(query) {
  const localTeams = () => {
    const map = new Map();
    for (const p of getPlayersLocal()) {
      const name = String(p.time || "").trim();
      if (name) map.set(name, (map.get(name) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  };

  if (resolveDataMode() !== "api-football") {
    return localTeams();
  }

  const league = parseOptionalPositiveInt(query.league, "league", Number(API_FOOTBALL_DEFAULT_LEAGUE));
  const season = parseOptionalPositiveInt(query.season, "season", Number(API_FOOTBALL_DEFAULT_SEASON));

  try {
    const payload = await apiFootballGetCached("/teams", { league, season }, 120000);
    setLastApiFootballError("");
    const items = Array.isArray(payload?.response) ? payload.response : [];
    return items
      .map((item) => ({ name: item?.team?.name || "", count: 1 }))
      .filter((item) => item.name);
  } catch (err) {
    if (shouldFallbackToLocal(err)) {
      setLastApiFootballError(err.message || "erro desconhecido");
      console.warn("⚠️ Falha de rede ao buscar teams na API-Football; usando fallback local.", err.message);
      return localTeams();
    }

    throw err;
  }
}

async function getApiTeamsDirectory(league, season) {
  const payload = await apiFootballGetCached("/teams", { league, season }, 120000);
  const items = Array.isArray(payload?.response) ? payload.response : [];
  const byName = new Map();

  for (const item of items) {
    const id = item?.team?.id;
    const name = String(item?.team?.name || "").trim();
    if (!id || !name) continue;
    byName.set(normalize(name), { id, name });
  }

  return byName;
}

async function getPlayers(query) {
  if (resolveDataMode() !== "api-football") {
    return getPlayersLocal();
  }

  const league = parseOptionalPositiveInt(query.league, "league", Number(API_FOOTBALL_DEFAULT_LEAGUE));
  const season = parseOptionalPositiveInt(query.season, "season", Number(API_FOOTBALL_DEFAULT_SEASON));
  const page = parseOptionalPositiveInt(query.page, "page", 1);
  const wantedTeam = normalize(query.time);

  try {
    const params = {
      league,
      season,
      search: query.q || undefined,
      page,
    };

    if (wantedTeam) {
      const teamsByName = await getApiTeamsDirectory(league, season);
      const team = teamsByName.get(wantedTeam);
      if (team?.id) {
        params.team = team.id;
      }
    }

    const payload = await apiFootballGetCached("/players", params, 60000);

    setLastApiFootballError("");
    const items = Array.isArray(payload?.response) ? payload.response : [];
    return items.map(mapApiFootballPlayer);
  } catch (err) {
    if (shouldFallbackToLocal(err)) {
      setLastApiFootballError(err.message || "erro desconhecido");
      console.warn("⚠️ Falha de rede ao buscar players na API-Football; usando fallback local.", err.message);
      return getPlayersLocal();
    }

    throw err;
  }
}

async function getCoaches(query) {
  if (resolveDataMode() !== "api-football") {
    return getCoachesLocal();
  }

  const q = String(query.q || "").trim();
  if (!q) {
    setLastApiFootballError("");
    return [];
  }

  try {
    const payload = await apiFootballGetCached("/coachs", { search: q }, 120000);
    setLastApiFootballError("");
    const items = Array.isArray(payload?.response) ? payload.response : [];
    return items.map(mapApiFootballCoach);
  } catch (err) {
    if (shouldFallbackToLocal(err)) {
      setLastApiFootballError(err.message || "erro desconhecido");
      console.warn("⚠️ Falha de rede ao buscar coaches na API-Football; usando fallback local.", err.message);
      return getCoachesLocal();
    }

    throw err;
  }
}

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fut-data-mvp-backend",
    time: new Date().toISOString(),
    dataset_players: "backend/data/players.json",
    dataset_coaches: "backend/data/coaches.json",
    cors_allowed: allowedOrigins,
    data_mode: resolveEffectiveDataMode(),
    api_football: {
      enabled: API_FOOTBALL_USE_LIVE,
      has_key: Boolean(API_FOOTBALL_KEY),
      base_url: API_FOOTBALL_BASE_URL,
      default_league: API_FOOTBALL_DEFAULT_LEAGUE,
      default_season: API_FOOTBALL_DEFAULT_SEASON,
      mode_reason: resolveDataModeReason(),
    },
  });
});

app.get("/api/players", async (req, res) => {
  const players = await getPlayers(req.query);
  const filtered = applyFilters(players, req.query);
  res.json({
    count: filtered.length,
    filters: {
      posicao: req.query.posicao || "",
      time: req.query.time || "",
      q: req.query.q || "",
      league: req.query.league || API_FOOTBALL_DEFAULT_LEAGUE,
      season: req.query.season || API_FOOTBALL_DEFAULT_SEASON,
      page: req.query.page || "1",
    },
    source: resolveEffectiveDataMode(),
    players: filtered,
  });
});

app.get("/api/teams", async (req, res) => {
  const teams = (await getTeams(req.query)).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  res.json({ count: teams.length, teams, source: resolveEffectiveDataMode() });
});

app.get("/api/positions", async (req, res) => {
  const map = new Map();
  for (const p of await getPlayers(req.query)) {
    const name = String(p.posicao || "").trim();
    if (name) map.set(name, (map.get(name) || 0) + 1);
  }
  const positions = Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  res.json({ count: positions.length, positions, source: resolveEffectiveDataMode() });
});

app.get("/api/rankings", async (req, res) => {
  const players = await getPlayers(req.query);
  const pos = normalize(req.query.posicao);
  const pool = pos ? players.filter((p) => normalize(p.posicao) === pos) : players;
  res.json({
    filters: { posicao: req.query.posicao || "" },
    rankings: {
      gols: topByMetric(pool, "gols", 5),
      assistencias: topByMetric(pool, "assistencias", 5),
      passes_chave: topByMetric(pool, "passes_chave", 5),
      chutes_no_alvo: topByMetric(pool, "chutes_no_alvo", 5),
      desarmes: topByMetric(pool, "desarmes", 5),
      defesas: topByMetric(pool, "defesas", 5),
    },
    count_pool: pool.length,
    source: resolveEffectiveDataMode(),
  });
});

app.get("/api/players.csv", async (req, res) => {
  const filtered = applyFilters(await getPlayers(req.query), req.query);
  const header = ["id", "nome", "posicao", "time", "idade", "pe"];
  const rows = filtered.map((p) => [p.id, p.nome, p.posicao, p.time, p.idade, p.pe]);
  const csv = [header.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="players_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

app.get("/api/players/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id, "ID do jogador");
  const players = await getPlayers(req.query);
  const player = players.find((p) => p.id === id);
  if (!player) return res.status(404).json({ error: "Player não encontrado" });
  const metrics = player.metrics || mockMetrics(player);
  const samePos = players.filter((p) => p.posicao === player.posicao).map((p) => p.metrics || mockMetrics(p));
  const percentis = {
    minutos: percentile(metrics.minutos, samePos.map((m) => m.minutos)),
    gols: percentile(metrics.gols, samePos.map((m) => m.gols)),
    assistencias: percentile(metrics.assistencias, samePos.map((m) => m.assistencias)),
    chutes_no_alvo: percentile(metrics.chutes_no_alvo, samePos.map((m) => m.chutes_no_alvo)),
    passes_chave: percentile(metrics.passes_chave, samePos.map((m) => m.passes_chave)),
    desarmes: percentile(metrics.desarmes, samePos.map((m) => m.desarmes)),
    defesas: percentile(metrics.defesas, samePos.map((m) => m.defesas)),
  };
  res.json({ player, metrics, percentis, context: { comparacao: `Percentis dentro da posição (${player.posicao})`, amostra: samePos.length }, source: resolveEffectiveDataMode() });
});

app.get("/api/coaches", async (req, res) => {
  const q = normalize(req.query.q);
  const coaches = await getCoaches(req.query);
  const filtered = q ? coaches.filter((c) => normalize(c.nome).includes(q)) : coaches;
  res.json({ count: filtered.length, coaches: filtered, filters: { q: req.query.q || "" }, source: resolveEffectiveDataMode(), note: req.query.q ? undefined : "Informe um nome para buscar treinadores na API-Football" });
});

app.get("/api/coaches/:id", async (req, res) => {
  const id = parsePositiveInt(req.params.id, "ID do treinador");

  let coach = null;
  if (resolveDataMode() === "api-football") {
    try {
      const payload = await apiFootballGetCached("/coachs", { id }, 120000);
      const items = Array.isArray(payload?.response) ? payload.response : [];
      coach = items.length ? mapApiFootballCoach(items[0]) : null;
      setLastApiFootballError("");
    } catch (err) {
      if (shouldFallbackToLocal(err)) {
        setLastApiFootballError(err.message || "erro desconhecido");
        coach = getCoachesLocal().find((c) => c.id === id) || null;
      } else {
        throw err;
      }
    }
  } else {
    coach = getCoachesLocal().find((c) => c.id === id) || null;
  }

  if (!coach) return res.status(404).json({ error: "Treinador não encontrado" });

  const impact_history = coachImpactHistory(id);
  const last = impact_history[impact_history.length - 1];
  res.json({ coach, impact: { jogos: last.jogos, vitorias: last.vitorias, empates: last.empates, derrotas: last.derrotas, aproveitamento_pct: last.aproveitamento_pct }, impact_history, source: resolveEffectiveDataMode() });
});

app.get("/api/coaches.csv", async (req, res) => {
  const q = normalize(req.query.q);
  const coaches = await getCoaches(req.query);
  const filtered = q ? coaches.filter((c) => normalize(c.nome).includes(q)) : coaches;
  const header = ["id", "nome", "nacionalidade", "idade", "ultimo_clube", "perfil"];
  const rows = filtered.map((c) => [c.id, c.nome, c.nacionalidade, c.idade, c.ultimo_clube, c.perfil]);
  const csv = [header.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="coaches_${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  if (status >= 500) console.error("❌ Erro interno:", err);
  res.status(status).json({ error: err.message || "Erro interno" });
});

module.exports = { app, allowedOrigins, resolveDataMode: resolveEffectiveDataMode };
