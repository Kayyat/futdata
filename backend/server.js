// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// CORS (whitelist)
// =====================================================
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
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS bloqueado para origem: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// =====================================================
// DATA PATHS
// =====================================================
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

function getPlayers() {
  return loadJsonArray(PLAYERS_PATH, "players.json");
}

function getCoaches() {
  return loadJsonArray(COACHES_PATH, "coaches.json");
}

// Utils
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

  if (player.posicao === "Atacante") {
    return { ...base, gols: 8, assistencias: 2, chutes_no_alvo: 15, passes_chave: 4, desarmes: 4 };
  }
  if (player.posicao === "Meia") {
    return { ...base, gols: 2, assistencias: 6, chutes_no_alvo: 6, passes_chave: 20, desarmes: 10 };
  }
  if (player.posicao === "Zagueiro") {
    return { ...base, gols: 1, assistencias: 0, chutes_no_alvo: 1, passes_chave: 2, desarmes: 18 };
  }
  if (player.posicao === "Lateral") {
    return { ...base, gols: 1, assistencias: 3, chutes_no_alvo: 3, passes_chave: 8, desarmes: 16 };
  }
  if (player.posicao === "Goleiro") {
    return { ...base, defesas: 32 };
  }
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
  const withValue = players.map((p) => ({
    player: p,
    metrics: mockMetrics(p),
  }));

  withValue.sort((a, b) => (b.metrics[metricKey] || 0) - (a.metrics[metricKey] || 0));

  return withValue.slice(0, limit).map((x) => ({
    id: x.player.id,
    nome: x.player.nome,
    posicao: x.player.posicao,
    time: x.player.time,
    value: x.metrics[metricKey] || 0,
  }));
}

// Mock histórico de impacto por temporada (determinístico por id)
function coachImpactHistory(coachId) {
  const base = 2023; // 3 temporadas
  const seasons = [base, base + 1, base + 2];

  // gera números “estáveis” por id
  function rnd(n) {
    // pseudo-rand determinístico
    const x = Math.sin(coachId * 999 + n * 123) * 10000;
    return x - Math.floor(x);
  }

  return seasons.map((year, idx) => {
    const jogos = 38 - idx * 2; // só pra variar
    const winRate = 0.45 + rnd(idx) * 0.25; // 45% a 70%
    const vitorias = Math.round(jogos * winRate);
    const empates = Math.round((jogos - vitorias) * (0.35 + rnd(idx + 10) * 0.2));
    const derrotas = Math.max(0, jogos - vitorias - empates);
    const aproveitamento = Math.round(((vitorias * 3 + empates) / (jogos * 3)) * 100);

    return {
      temporada: String(year),
      jogos,
      vitorias,
      empates,
      derrotas,
      aproveitamento_pct: aproveitamento,
    };
  });
}

// =====================================================
// ROTAS
// =====================================================
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fut-data-mvp-backend",
    time: new Date().toISOString(),
    dataset_players: "backend/data/players.json",
    dataset_coaches: "backend/data/coaches.json",
    cors_allowed: allowedOrigins,
  });
});

// -------------------- PLAYERS --------------------
app.get("/api/players", (req, res) => {
  const players = getPlayers();
  const filtered = applyFilters(players, req.query);

  res.json({
    count: filtered.length,
    filters: {
      posicao: req.query.posicao || "",
      time: req.query.time || "",
      q: req.query.q || "",
    },
    players: filtered,
  });
});

app.get("/api/teams", (req, res) => {
  const players = getPlayers();
  const map = new Map();

  for (const p of players) {
    const name = String(p.time || "").trim();
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }

  const teams = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  res.json({ count: teams.length, teams });
});

app.get("/api/positions", (req, res) => {
  const players = getPlayers();
  const map = new Map();

  for (const p of players) {
    const name = String(p.posicao || "").trim();
    if (!name) continue;
    map.set(name, (map.get(name) || 0) + 1);
  }

  const positions = Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  res.json({ count: positions.length, positions });
});

app.get("/api/rankings", (req, res) => {
  const players = getPlayers();
  const pos = normalize(req.query.posicao);

  const pool = pos ? players.filter((p) => normalize(p.posicao) === pos) : players;

  const rankings = {
    gols: topByMetric(pool, "gols", 5),
    assistencias: topByMetric(pool, "assistencias", 5),
    passes_chave: topByMetric(pool, "passes_chave", 5),
    chutes_no_alvo: topByMetric(pool, "chutes_no_alvo", 5),
    desarmes: topByMetric(pool, "desarmes", 5),
    defesas: topByMetric(pool, "defesas", 5),
  };

  res.json({
    filters: { posicao: req.query.posicao || "" },
    rankings,
    count_pool: pool.length,
  });
});

app.get("/api/players.csv", (req, res) => {
  const players = getPlayers();
  const filtered = applyFilters(players, req.query);

  const header = ["id", "nome", "posicao", "time", "idade", "pe"];
  const rows = filtered.map((p) => [p.id, p.nome, p.posicao, p.time, p.idade, p.pe]);

  const csv = [header.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");

  const filename = `players_${Date.now()}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv);
});

app.get("/api/players/:id", (req, res) => {
  const players = getPlayers();
  const id = Number(req.params.id);
  const player = players.find((p) => p.id === id);

  if (!player) return res.status(404).json({ error: "Player não encontrado" });

  const metrics = mockMetrics(player);
  const samePos = players
    .filter((p) => p.posicao === player.posicao)
    .map((p) => mockMetrics(p));

  const percentis = {
    minutos: percentile(metrics.minutos, samePos.map((m) => m.minutos)),
    gols: percentile(metrics.gols, samePos.map((m) => m.gols)),
    assistencias: percentile(metrics.assistencias, samePos.map((m) => m.assistencias)),
    chutes_no_alvo: percentile(metrics.chutes_no_alvo, samePos.map((m) => m.chutes_no_alvo)),
    passes_chave: percentile(metrics.passes_chave, samePos.map((m) => m.passes_chave)),
    desarmes: percentile(metrics.desarmes, samePos.map((m) => m.desarmes)),
    defesas: percentile(metrics.defesas, samePos.map((m) => m.defesas)),
  };

  res.json({
    player,
    metrics,
    percentis,
    context: {
      comparacao: `Percentis dentro da posição (${player.posicao})`,
      amostra: samePos.length,
    },
  });
});

// -------------------- COACHES --------------------
app.get("/api/coaches", (req, res) => {
  const q = normalize(req.query.q);
  const coaches = getCoaches();
  const filtered = q ? coaches.filter((c) => normalize(c.nome).includes(q)) : coaches;

  res.json({ count: filtered.length, coaches: filtered, filters: { q: req.query.q || "" } });
});

app.get("/api/coaches/:id", (req, res) => {
  const id = Number(req.params.id);
  const coaches = getCoaches();
  const coach = coaches.find((c) => c.id === id);

  if (!coach) return res.status(404).json({ error: "Treinador não encontrado" });

  const impact_history = coachImpactHistory(id);

  // resumo (última temporada)
  const last = impact_history[impact_history.length - 1];

  res.json({
    coach,
    impact: {
      jogos: last.jogos,
      vitorias: last.vitorias,
      empates: last.empates,
      derrotas: last.derrotas,
      aproveitamento_pct: last.aproveitamento_pct,
    },
    impact_history,
  });
});

app.get("/api/coaches.csv", (req, res) => {
  const q = normalize(req.query.q);
  const coaches = getCoaches();
  const filtered = q ? coaches.filter((c) => normalize(c.nome).includes(q)) : coaches;

  const header = ["id", "nome", "nacionalidade", "idade", "ultimo_clube", "perfil"];
  const rows = filtered.map((c) => [c.id, c.nome, c.nacionalidade, c.idade, c.ultimo_clube, c.perfil]);

  const csv = [header.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");

  const filename = `coaches_${Date.now()}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send("\uFEFF" + csv);
});

// Start
app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
  console.log(`🔒 CORS permitido: ${allowedOrigins.join(", ") || "(nenhum)"}`);
});