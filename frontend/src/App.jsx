import { useEffect, useMemo, useState } from "react";
import { apiGet, API_BASE_URL } from "./api";

const COLORS = {
  bg: "radial-gradient(circle at 10% 0%, #1a2440 0%, #0f1115 45%)",
  panel: "rgba(21, 25, 35, 0.9)",
  panel2: "rgba(17, 21, 33, 0.92)",
  border: "#2a3242",
  text: "#e8ecf3",
  muted: "#a6b0c3",
  chipBg: "#0f1320",
  chipBorder: "#2a3242",
  headerRow: "#1b2130",
  rowSelected: "#203252",
  inputBg: "#0f1320",
  barBg: "#0d1018",
  barFill: "#2a7fff",
  barFill2: "#23d18b",
  star: "#f7d154",
};

function Chip({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${COLORS.chipBorder}`,
        background: COLORS.chipBg,
        color: COLORS.text,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 16,
        background: COLORS.panel,
        color: COLORS.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.inputBg,
        color: COLORS.text,
        outline: "none",
        minWidth: 220,
        ...props.style,
      }}
    />
  );
}

function Select({ ...props }) {
  return (
    <select
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.inputBg,
        color: COLORS.text,
        outline: "none",
        ...props.style,
      }}
    />
  );
}

function Button({ children, active, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        background: active ? "#22304b" : "#1b2335",
        color: COLORS.text,
        cursor: "pointer",
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

function StarButton({ active, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        background: active ? "#2a2f18" : "#1b2335",
        color: active ? COLORS.star : COLORS.muted,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        lineHeight: "18px",
      }}
    >
      ★
    </button>
  );
}

function PercentBar({ label, value, pct, fill = COLORS.barFill }) {
  const p = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 12,
        background: COLORS.panel2,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: COLORS.muted, fontSize: 12 }}>Percentil</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{p}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          height: 10,
          borderRadius: 999,
          background: COLORS.barBg,
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        <div style={{ height: "100%", width: `${p}%`, background: fill }} />
      </div>
    </div>
  );
}

function ProfileBlock({ title, data, loading, accentFill }) {
  if (loading) return <p style={{ color: COLORS.muted }}>Carregando {title}...</p>;
  if (!data) return <p style={{ color: COLORS.muted }}>{title}: selecione um jogador.</p>;

  const { player, metrics, percentis, context } = data;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Chip>{player.posicao}</Chip>
        <Chip>{player.time}</Chip>
        <Chip>{player.pe}</Chip>
        <Chip>{player.idade} anos</Chip>
      </div>

      <h3 style={{ marginBottom: 4 }}>{player.nome}</h3>
      <div style={{ color: COLORS.muted, marginBottom: 12, fontSize: 12 }}>
        {context?.comparacao} • amostra: {context?.amostra}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <PercentBar label="Minutos" value={metrics.minutos} pct={percentis.minutos} fill={accentFill} />
        <PercentBar label="Gols" value={metrics.gols} pct={percentis.gols} fill={accentFill} />
        <PercentBar label="Assistências" value={metrics.assistencias} pct={percentis.assistencias} fill={accentFill} />
        <PercentBar label="Chutes no alvo" value={metrics.chutes_no_alvo} pct={percentis.chutes_no_alvo} fill={accentFill} />
        <PercentBar label="Passes-chave" value={metrics.passes_chave} pct={percentis.passes_chave} fill={accentFill} />
        <PercentBar label="Desarmes" value={metrics.desarmes} pct={percentis.desarmes} fill={accentFill} />
        <PercentBar label="Defesas" value={metrics.defesas} pct={percentis.defesas} fill={accentFill} />
      </div>
    </div>
  );
}

function getUrlState() {
  const sp = new URLSearchParams(window.location.search);

  const tab = sp.get("tab") || "";
  const p = Number(sp.get("p") || "");
  const c = Number(sp.get("c") || "");
  const coach = Number(sp.get("coach") || "");

  return {
    tab: tab === "coaches" ? "coaches" : "players",
    p: Number.isFinite(p) && p > 0 ? p : null,
    c: Number.isFinite(c) && c > 0 ? c : null,
    coach: Number.isFinite(coach) && coach > 0 ? coach : null,
  };
}

function setUrlState({ tab, p, c, coach }) {
  const sp = new URLSearchParams(window.location.search);

  sp.set("tab", tab === "coaches" ? "coaches" : "players");

  if (p) sp.set("p", String(p));
  else sp.delete("p");

  if (c) sp.set("c", String(c));
  else sp.delete("c");

  if (coach) sp.set("coach", String(coach));
  else sp.delete("coach");

  const qs = sp.toString();
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", newUrl);
}

function RankingCard({ title, items, onPick }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ color: COLORS.muted, fontSize: 12 }}>Top 5</div>
      </div>
      {(!items || items.length === 0) ? (
        <div style={{ color: COLORS.muted }}>Sem dados</div>
      ) : (
        <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {items.map((x) => (
            <li key={x.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span
                onClick={() => onPick(x.id)}
                title="Clique para abrir no perfil"
                style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
              >
                {x.nome}
                <span style={{ color: COLORS.muted }}> • {x.time}</span>
              </span>
              <span style={{ fontWeight: 800 }}>{x.value}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function safeJsonParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function downloadJson(filename, dataObj) {
  const json = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function App() {
  const initialUrl = useMemo(() => getUrlState(), []);
  const [tab, setTab] = useState(initialUrl.tab);

  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  // Favorites (persist)
  const [favPlayers, setFavPlayers] = useState(() => safeJsonParse(localStorage.getItem("fav_players"), []));
  const [favCoaches, setFavCoaches] = useState(() => safeJsonParse(localStorage.getItem("fav_coaches"), []));

  useEffect(() => localStorage.setItem("fav_players", JSON.stringify(favPlayers)), [favPlayers]);
  useEffect(() => localStorage.setItem("fav_coaches", JSON.stringify(favCoaches)), [favCoaches]);

  function isFavPlayer(id) {
    return favPlayers.some((x) => x.id === id);
  }
  function isFavCoach(id) {
    return favCoaches.some((x) => x.id === id);
  }

  function toggleFavPlayer(playerObj) {
    setFavPlayers((prev) => {
      const exists = prev.some((x) => x.id === playerObj.id);
      if (exists) return prev.filter((x) => x.id !== playerObj.id);
      return [{ id: playerObj.id, nome: playerObj.nome, posicao: playerObj.posicao, time: playerObj.time }, ...prev];
    });
  }

  function toggleFavCoach(coachObj) {
    setFavCoaches((prev) => {
      const exists = prev.some((x) => x.id === coachObj.id);
      if (exists) return prev.filter((x) => x.id !== coachObj.id);
      return [{ id: coachObj.id, nome: coachObj.nome, ultimo_clube: coachObj.ultimo_clube, perfil: coachObj.perfil }, ...prev];
    });
  }

  function exportFavoritesJson() {
    const payload = {
      exported_at: new Date().toISOString(),
      app: "Fut Data MVP",
      favorites: {
        players: favPlayers,
        coaches: favCoaches,
      },
    };
    const filename = `futdata_favoritos_${Date.now()}.json`;
    downloadJson(filename, payload);
  }

  useEffect(() => {
    apiGet("/health")
      .then((data) => setHealth(data))
      .catch(() => setError(`Não consegui conectar no backend. Base URL: ${API_BASE_URL}`));
  }, []);

  // ---------- Players ----------
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [positions, setPositions] = useState([]);
  const [rankings, setRankings] = useState(null);
  const [rankLoading, setRankLoading] = useState(false);

  const [fPosicao, setFPosicao] = useState("");
  const [fTime, setFTime] = useState("");
  const [q, setQ] = useState("");
  const [fLeague, setFLeague] = useState("71");
  const [fSeason, setFSeason] = useState(String(new Date().getFullYear()));
  const [fPage, setFPage] = useState("1");

  const [selectedId, setSelectedId] = useState(initialUrl.p);
  const [compareId, setCompareId] = useState(initialUrl.c ? String(initialUrl.c) : "");

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [compareProfile, setCompareProfile] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // ---------- Coaches ----------
  const [coaches, setCoaches] = useState([]);
  const [coachQ, setCoachQ] = useState("");
  const [coachSelectedId, setCoachSelectedId] = useState(initialUrl.coach);
  const [coachDetail, setCoachDetail] = useState(null);
  const [coachLoading, setCoachLoading] = useState(false);

  // Sync URL
  useEffect(() => {
    const cNum = Number(compareId);
    setUrlState({
      tab,
      p: tab === "players" ? selectedId : null,
      c: tab === "players" && cNum > 0 ? cNum : null,
      coach: tab === "coaches" ? coachSelectedId : null,
    });
  }, [tab, selectedId, compareId, coachSelectedId]);

  useEffect(() => {
    if (tab !== "players") return;

    apiGet("/api/teams")
      .then((data) => setTeams(data.teams || []))
      .catch(() => setError("Falha ao buscar /api/teams"));

    apiGet("/api/positions")
      .then((data) => setPositions(data.positions || []))
      .catch(() => setError("Falha ao buscar /api/positions"));
  }, [tab]);

  useEffect(() => {
    if (tab !== "players") return;

    setRankLoading(true);
    const params = new URLSearchParams();
    if (fPosicao) params.set("posicao", fPosicao);
    if (fLeague) params.set("league", fLeague);
    if (fSeason) params.set("season", fSeason);
    if (fPage) params.set("page", fPage);
    const qs = params.toString() ? `?${params.toString()}` : "";
    apiGet(`/api/rankings${qs}`)
      .then((data) => setRankings(data.rankings || null))
      .catch(() => setError("Falha ao buscar /api/rankings"))
      .finally(() => setRankLoading(false));
  }, [tab, fPosicao, fLeague, fSeason, fPage]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (fPosicao) params.set("posicao", fPosicao);
    if (fTime) params.set("time", fTime);
    if (q.trim()) params.set("q", q.trim());
    if (fLeague) params.set("league", fLeague);
    if (fSeason) params.set("season", fSeason);
    if (fPage) params.set("page", fPage);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [fPosicao, fTime, q, fLeague, fSeason, fPage]);

  useEffect(() => {
    if (tab !== "players") return;
    apiGet(`/api/players${queryString}`)
      .then((data) => setPlayers(data.players || []))
      .catch(() => setError("Falha ao buscar /api/players"));
  }, [tab, queryString]);

  useEffect(() => {
    if (tab !== "players") return;

    if (!selectedId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    apiGet(`/api/players/${selectedId}`)
      .then((data) => setProfile(data))
      .catch(() => setError("Falha ao buscar perfil do jogador"))
      .finally(() => setProfileLoading(false));
  }, [tab, selectedId]);

  useEffect(() => {
    if (tab !== "players") return;

    const id = Number(compareId);
    if (!id) {
      setCompareProfile(null);
      return;
    }
    setCompareLoading(true);
    apiGet(`/api/players/${id}`)
      .then((data) => setCompareProfile(data))
      .catch(() => setError("Falha ao buscar perfil de comparação"))
      .finally(() => setCompareLoading(false));
  }, [tab, compareId]);

  function downloadPlayersCsv() {
    const url = `${API_BASE_URL}/api/players.csv${queryString}`;
    window.open(url, "_blank");
  }

  function pickFromRanking(id) {
    setSelectedId(id);
    setTab("players");
  }

  // Coaches
  useEffect(() => {
    if (tab !== "coaches") return;
    const qs = coachQ.trim() ? `?q=${encodeURIComponent(coachQ.trim())}` : "";
    apiGet(`/api/coaches${qs}`)
      .then((data) => setCoaches(data.coaches || []))
      .catch(() => setError("Falha ao buscar /api/coaches"));
  }, [tab, coachQ]);

  useEffect(() => {
    if (tab !== "coaches") return;
    if (!coachSelectedId) {
      setCoachDetail(null);
      return;
    }
    setCoachLoading(true);
    apiGet(`/api/coaches/${coachSelectedId}`)
      .then((data) => setCoachDetail(data))
      .catch(() => setError("Falha ao buscar detalhe do treinador"))
      .finally(() => setCoachLoading(false));
  }, [tab, coachSelectedId]);

  function downloadCoachesCsv() {
    const qs = coachQ.trim() ? `?q=${encodeURIComponent(coachQ.trim())}` : "";
    const url = `${API_BASE_URL}/api/coaches.csv${qs}`;
    window.open(url, "_blank");
  }

  function copyShareLink() {
    navigator.clipboard?.writeText(window.location.href);
  }

  function openFavPlayer(id) {
    setTab("players");
    setSelectedId(id);
    setCompareId("");
  }
  function openFavCoach(id) {
    setTab("coaches");
    setCoachSelectedId(id);
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "Inter, Arial, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <h1 style={{ margin: 0 }}>Fut Data MVP</h1>
            <span style={{ color: COLORS.muted }}>
              API: <code>{API_BASE_URL || "(proxy dev)"}</code>
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button active={tab === "players"} onClick={() => setTab("players")}>Jogadores</Button>
            <Button active={tab === "coaches"} onClick={() => setTab("coaches")}>Treinadores</Button>
            <Button onClick={copyShareLink} style={{ background: "#222b3d" }}>Copiar link</Button>
            <Button onClick={exportFavoritesJson} style={{ background: "#1f3a2d" }}>
              Exportar Favoritos (JSON)
            </Button>
          </div>
        </div>

        {/* FAVORITOS */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>⭐ Favoritos — Jogadores</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{favPlayers.length}</div>
            </div>
            {favPlayers.length === 0 ? (
              <div style={{ color: COLORS.muted, marginTop: 8 }}>Nenhum favorito ainda.</div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {favPlayers.slice(0, 6).map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <span
                      onClick={() => openFavPlayer(p.id)}
                      style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                      title="Abrir jogador"
                    >
                      {p.nome} <span style={{ color: COLORS.muted }}>• {p.posicao} • {p.time}</span>
                    </span>
                    <StarButton active title="Remover dos favoritos" onClick={() => toggleFavPlayer(p)} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800 }}>⭐ Favoritos — Treinadores</div>
              <div style={{ color: COLORS.muted, fontSize: 12 }}>{favCoaches.length}</div>
            </div>
            {favCoaches.length === 0 ? (
              <div style={{ color: COLORS.muted, marginTop: 8 }}>Nenhum favorito ainda.</div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {favCoaches.slice(0, 6).map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <span
                      onClick={() => openFavCoach(c.id)}
                      style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                      title="Abrir treinador"
                    >
                      {c.nome} <span style={{ color: COLORS.muted }}>• {c.ultimo_clube}</span>
                    </span>
                    <StarButton active title="Remover dos favoritos" onClick={() => toggleFavCoach(c)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

        {!error && !health && <p style={{ color: COLORS.muted, marginTop: 16 }}>Carregando status do backend...</p>}

        {health && (
          <div style={{ marginTop: 12, padding: 12, border: `1px solid ${COLORS.border}`, borderRadius: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: COLORS.panel, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
            <div>
              <b>Backend</b> ✅ <span style={{ color: COLORS.muted }}>({health.service})</span>
              <div style={{ marginTop: 6, fontSize: 12, color: COLORS.muted }}>
                Fonte de dados: <b style={{ color: COLORS.text }}>{health.data_mode || "local"}</b>
                {health?.api_football?.mode_reason ? ` • ${health.api_football.mode_reason}` : ""}
              </div>
            </div>
            <div style={{ color: COLORS.muted }}>{new Date(health.time).toLocaleString()}</div>
          </div>
        )}

        {/* PLAYERS TAB */}
        {tab === "players" && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Rankings</h2>
                <div style={{ color: COLORS.muted, fontSize: 12 }}>
                  {fPosicao ? `Filtrado por posição: ${fPosicao}` : "Geral (todas posições)"}
                  {rankLoading ? " • carregando..." : ""}
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <RankingCard title="Gols" items={rankings?.gols} onPick={pickFromRanking} />
                <RankingCard title="Assistências" items={rankings?.assistencias} onPick={pickFromRanking} />
                <RankingCard title="Passes-chave" items={rankings?.passes_chave} onPick={pickFromRanking} />
                <RankingCard title="Chutes no alvo" items={rankings?.chutes_no_alvo} onPick={pickFromRanking} />
                <RankingCard title="Desarmes" items={rankings?.desarmes} onPick={pickFromRanking} />
                <RankingCard title="Defesas" items={rankings?.defesas} onPick={pickFromRanking} />
              </div>
            </div>

            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 16, alignItems: "start" }}>
              <div>
                <Card>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <h2 style={{ margin: 0, marginRight: 8 }}>Filtros</h2>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Buscar:</span>
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex: pedro, fabio..." />
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Posição:</span>
                        <Select value={fPosicao} onChange={(e) => setFPosicao(e.target.value)}>
                          <option value="">Todas</option>
                          {positions.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name} ({p.count})
                            </option>
                          ))}
                        </Select>
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Time:</span>
                        <Select value={fTime} onChange={(e) => setFTime(e.target.value)}>
                          <option value="">Todos</option>
                          {teams.map((t) => (
                            <option key={t.name} value={t.name}>
                              {t.name} ({t.count})
                            </option>
                          ))}
                        </Select>
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Liga:</span>
                        <Input value={fLeague} onChange={(e) => setFLeague(e.target.value)} style={{ minWidth: 90 }} />
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Temporada:</span>
                        <Input value={fSeason} onChange={(e) => setFSeason(e.target.value)} style={{ minWidth: 110 }} />
                      </label>

                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: COLORS.muted }}>Página:</span>
                        <Input value={fPage} onChange={(e) => setFPage(e.target.value)} style={{ minWidth: 80 }} />
                      </label>

                      <Button onClick={() => { setQ(""); setFPosicao(""); setFTime(""); setFLeague("71"); setFSeason(String(new Date().getFullYear())); setFPage("1"); }}>
                        Limpar
                      </Button>

                      <span style={{ color: COLORS.muted }}>
                        Query: <code>{queryString || "(sem filtros)"}</code>
                      </span>
                    </div>

                    <Button onClick={() => window.open(`${API_BASE_URL}/api/players.csv${queryString}`, "_blank")} style={{ background: "#22304b" }}>
                      Baixar CSV
                    </Button>
                  </div>
                </Card>

                <div style={{ marginTop: 12, color: COLORS.muted }}>
                  Resultados: <b style={{ color: COLORS.text }}>{players.length}</b> (clique em um jogador)
                </div>

                <div style={{ marginTop: 10, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", background: COLORS.panel }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: COLORS.headerRow }}>
                        <th style={{ textAlign: "left", padding: 12 }}>★</th>
                        <th style={{ textAlign: "left", padding: 12 }}>Jogador</th>
                        <th style={{ textAlign: "left", padding: 12 }}>Posição</th>
                        <th style={{ textAlign: "left", padding: 12 }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 14, color: COLORS.muted }}>
                            Nenhum jogador encontrado com esses filtros.
                          </td>
                        </tr>
                      ) : (
                        players.map((pl) => {
                          const isSelected = selectedId === pl.id;
                          const fav = isFavPlayer(pl.id);
                          return (
                            <tr
                              key={pl.id}
                              style={{
                                borderTop: `1px solid ${COLORS.border}`,
                                background: isSelected ? COLORS.rowSelected : "transparent",
                              }}
                            >
                              <td style={{ padding: 12, width: 44 }}>
                                <StarButton
                                  active={fav}
                                  title={fav ? "Remover dos favoritos" : "Favoritar"}
                                  onClick={(e) => {
                                    e.stopPropagation?.();
                                    toggleFavPlayer(pl);
                                  }}
                                />
                              </td>
                              <td style={{ padding: 12, cursor: "pointer" }} onClick={() => setSelectedId(pl.id)}>
                                <b>{pl.nome}</b>
                              </td>
                              <td style={{ padding: 12 }}>
                                <Chip>{pl.posicao}</Chip>
                              </td>
                              <td style={{ padding: 12 }}>
                                <Chip>{pl.time}</Chip>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h2 style={{ marginTop: 0, marginBottom: 10 }}>Perfil & Comparação</h2>
                      {profile?.player && (
                        <StarButton
                          active={isFavPlayer(profile.player.id)}
                          title={isFavPlayer(profile.player.id) ? "Remover dos favoritos" : "Favoritar"}
                          onClick={() => toggleFavPlayer(profile.player)}
                        />
                      )}
                    </div>

                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: COLORS.muted }}>Comparar com:</span>
                      <Select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                        <option value="">Nenhum</option>
                        {players.filter((p) => p.id !== selectedId).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.posicao} — {p.time}
                          </option>
                        ))}
                      </Select>
                    </label>
                  </div>

                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Jogador A</div>
                      <ProfileBlock title="Jogador A" data={profile} loading={profileLoading} accentFill={COLORS.barFill} />
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                      <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Jogador B</div>
                      <ProfileBlock title="Jogador B" data={compareProfile} loading={compareLoading} accentFill={COLORS.barFill2} />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* COACHES TAB */}
        {tab === "coaches" && (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            <div>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ marginTop: 0, marginBottom: 10 }}>Treinadores</h2>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: COLORS.muted }}>Buscar:</span>
                      <Input value={coachQ} onChange={(e) => setCoachQ(e.target.value)} placeholder="Ex: diniz, tite..." />
                    </div>
                    <div style={{ marginTop: 12, color: COLORS.muted }}>
                      Resultados: <b style={{ color: COLORS.text }}>{coaches.length}</b> (clique para ver detalhes)
                    </div>
                  </div>

                  <Button onClick={downloadCoachesCsv} style={{ background: "#22304b", height: 42 }}>
                    Baixar CSV
                  </Button>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                  {coaches.map((c) => {
                    const fav = isFavCoach(c.id);
                    return (
                      <div
                        key={c.id}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          border: `1px solid ${COLORS.border}`,
                          background: coachSelectedId === c.id ? COLORS.rowSelected : COLORS.panel2,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div onClick={() => setCoachSelectedId(c.id)} style={{ cursor: "pointer", flex: 1 }}>
                          <div style={{ fontWeight: 800 }}>{c.nome}</div>
                          <div style={{ color: COLORS.muted, fontSize: 12 }}>
                            Último clube: {c.ultimo_clube} • {c.idade} anos
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <Chip>{c.perfil}</Chip>
                          </div>
                        </div>

                        <StarButton
                          active={fav}
                          title={fav ? "Remover dos favoritos" : "Favoritar"}
                          onClick={() => toggleFavCoach(c)}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            <div>
              <Card>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <h2 style={{ marginTop: 0 }}>Detalhes</h2>
                  {coachDetail?.coach && (
                    <StarButton
                      active={isFavCoach(coachDetail.coach.id)}
                      title={isFavCoach(coachDetail.coach.id) ? "Remover dos favoritos" : "Favoritar"}
                      onClick={() => toggleFavCoach(coachDetail.coach)}
                    />
                  )}
                </div>

                {!coachSelectedId && <p style={{ color: COLORS.muted }}>Selecione um treinador.</p>}
                {coachLoading && <p style={{ color: COLORS.muted }}>Carregando...</p>}

                {!coachLoading && coachDetail && (
                  <>
                    <h3 style={{ marginBottom: 6 }}>{coachDetail.coach.nome}</h3>
                    <div style={{ color: COLORS.muted, marginBottom: 12 }}>
                      {coachDetail.coach.nacionalidade} • {coachDetail.coach.idade} anos • Último clube:{" "}
                      <b style={{ color: COLORS.text }}>{coachDetail.coach.ultimo_clube}</b>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <Chip>{coachDetail.coach.perfil}</Chip>
                    </div>

                    <h4 style={{ margin: "12px 0 8px" }}>Impacto (última temporada)</h4>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: COLORS.panel2 }}>
                        Jogos: <b>{coachDetail.impact?.jogos ?? "-"}</b>
                      </div>
                      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: COLORS.panel2 }}>
                        Vitórias: <b>{coachDetail.impact?.vitorias ?? "-"}</b> • Empates: <b>{coachDetail.impact?.empates ?? "-"}</b> • Derrotas:{" "}
                        <b>{coachDetail.impact?.derrotas ?? "-"}</b>
                      </div>
                      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: COLORS.panel2 }}>
                        Aproveitamento: <b>{coachDetail.impact?.aproveitamento_pct ?? "-"}%</b>
                      </div>
                    </div>

                    <h4 style={{ margin: "16px 0 8px" }}>Histórico por temporada</h4>

                    {Array.isArray(coachDetail.impact_history) && coachDetail.impact_history.length > 0 ? (
                      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: COLORS.headerRow }}>
                              <th style={{ textAlign: "left", padding: 12 }}>Temporada</th>
                              <th style={{ textAlign: "right", padding: 12 }}>J</th>
                              <th style={{ textAlign: "right", padding: 12 }}>V</th>
                              <th style={{ textAlign: "right", padding: 12 }}>E</th>
                              <th style={{ textAlign: "right", padding: 12 }}>D</th>
                              <th style={{ textAlign: "right", padding: 12 }}>Aprov.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coachDetail.impact_history.map((row, idx) => (
                              <tr key={`${row.temporada}-${idx}`} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                                <td style={{ padding: 12 }}>
                                  <b>{row.temporada}</b>
                                </td>
                                <td style={{ padding: 12, textAlign: "right" }}>{row.jogos}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{row.vitorias}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{row.empates}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>{row.derrotas}</td>
                                <td style={{ padding: 12, textAlign: "right" }}>
                                  <b>{row.aproveitamento_pct}%</b>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ color: COLORS.muted, marginTop: 8 }}>Sem histórico disponível.</p>
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}