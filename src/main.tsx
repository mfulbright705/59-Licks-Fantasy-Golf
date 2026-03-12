import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";

type Trend = "up" | "down" | "flat";

type StandingRow = {
  rank: number;
  team: string;
  total: number | null;
  today: number | null;
  thru: string;
  gap: number | null;
  trend: Trend;
};

type TeamGolferRow = {
  team?: string;
  golfer: string;
  today: number | null;
  thru: string;
  counting: boolean;
  currentRoundScore?: number | null;
  source?: string;
};

type FreeAgentRow = {
  id: number;
  name: string;
  rank: number;
  today: number | null;
  thru: string;
};

type HistoryRow = {
  event: string;
  winner?: string;
  tournamentWinner?: string;
  winningScore: number | null;
  timestamp?: string;
};

type MoveRow = {
  event: string;
  team: string;
  drop: string;
  add: string;
};

type LeagueSnapshot = {
  currentEvent: string;
  lastUpdated: string;
  currentRound?: string;
  liveStatus?: string;
  leader?: string;
  teamCount?: number;
  freeAgentCount?: number;
  historyCount?: number;
  standings: StandingRow[];
  teamDetails: Record<string, TeamGolferRow[]>;
  freeAgents: FreeAgentRow[];
  history: HistoryRow[];
  recentMoves: MoveRow[];
};

const DATA_URL =
  "https://script.google.com/macros/s/AKfycbxlf3nqcU8R-eeMjFcAZVlJm_3-OcVJ2YcIPPhZ1w2FYyoXzHSEpOrGUcEbtrqIYba_rQ/exec";
const AUTO_REFRESH_MS = 60000;

const fallbackSnapshot: LeagueSnapshot = {
  currentEvent: "Players Championship",
  lastUpdated: "Awaiting tee times",
  currentRound: "R1",
  liveStatus: "Pre-round",
  leader: "Andrew",
  teamCount: 8,
  freeAgentCount: 20,
  historyCount: 0,
  standings: [
    { rank: 1, team: "Andrew", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 2, team: "Michael", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 3, team: "Ryan", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 4, team: "Ty", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 5, team: "Booher", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 6, team: "Justin", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 7, team: "Orians", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
    { rank: 8, team: "Dexter", total: null, today: null, thru: "Pre-round", gap: null, trend: "flat" },
  ],
  teamDetails: {},
  freeAgents: [],
  history: [],
  recentMoves: [],
};

function nullableNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function normalizeTrend(value: any): Trend {
  const v = String(value ?? "flat").toLowerCase();
  if (v === "up" || v === "down") return v;
  return "flat";
}

function displayScore(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value > 0 ? `+${value}` : `${value}`;
}

function scoreColor(value: number | null) {
  if (value === null || value === undefined) return "#94a3b8";
  if (value < 0) return "#059669";
  if (value > 0) return "#dc2626";
  return "#475569";
}

function transformSnapshot(raw: any): LeagueSnapshot {
  const standings: StandingRow[] = Array.isArray(raw?.standings)
    ? raw.standings.map((r: any, index: number) => ({
        rank: Number(r.rank ?? index + 1),
        team: String(r.team ?? ""),
        total: nullableNumber(r.total),
        today: nullableNumber(r.today),
        thru: String(r.thru ?? "—"),
        gap: nullableNumber(r.gap),
        trend: normalizeTrend(r.trend),
      }))
    : [];

  const detailsArray: TeamGolferRow[] = Array.isArray(raw?.teamDetails) ? raw.teamDetails : [];
  const teamDetails = detailsArray.reduce<Record<string, TeamGolferRow[]>>((acc, row: any) => {
    const team = String(row.team ?? "");
    if (!team) return acc;
    if (!acc[team]) acc[team] = [];
    acc[team].push({
      team,
      golfer: String(row.golfer ?? ""),
      today: nullableNumber(row.today),
      thru: String(row.thru ?? "—"),
      counting: String(row.counting ?? "").toLowerCase() === "yes" || Boolean(row.counting),
      currentRoundScore: nullableNumber(row.currentRoundScore),
      source: String(row.source ?? "sheet"),
    });
    return acc;
  }, {});

  const freeAgents: FreeAgentRow[] = Array.isArray(raw?.freeAgents)
    ? raw.freeAgents.map((r: any) => ({
        id: Number(r.id ?? 0),
        name: String(r.name ?? ""),
        rank: Number(r.rank ?? 0),
        today: nullableNumber(r.today),
        thru: String(r.thru ?? "—"),
      }))
    : [];

  const history: HistoryRow[] = Array.isArray(raw?.history)
    ? raw.history.map((r: any) => ({
        event: String(r.event ?? ""),
        winner: String(r.winner ?? ""),
        tournamentWinner: String(r.tournamentWinner ?? ""),
        winningScore: nullableNumber(r.winningScore),
        timestamp: String(r.timestamp ?? ""),
      }))
    : [];

  const recentMoves: MoveRow[] = Array.isArray(raw?.recentMoves)
    ? raw.recentMoves.map((r: any) => ({
        event: String(r.event ?? ""),
        team: String(r.team ?? ""),
        drop: String(r.drop ?? ""),
        add: String(r.add ?? ""),
      }))
    : [];

  return {
    currentEvent: String(raw?.currentEvent ?? fallbackSnapshot.currentEvent),
    lastUpdated: String(raw?.lastUpdated ?? fallbackSnapshot.lastUpdated),
    currentRound: String(raw?.currentRound ?? fallbackSnapshot.currentRound ?? "R1"),
    liveStatus: String(raw?.liveStatus ?? fallbackSnapshot.liveStatus ?? "Pre-round"),
    leader: String(raw?.leader ?? standings[0]?.team ?? fallbackSnapshot.leader ?? ""),
    teamCount: nullableNumber(raw?.teamCount) ?? standings.length,
    freeAgentCount: nullableNumber(raw?.freeAgentCount) ?? freeAgents.length,
    historyCount: nullableNumber(raw?.historyCount) ?? history.length,
    standings: standings.length ? standings : fallbackSnapshot.standings,
    teamDetails,
    freeAgents,
    history,
    recentMoves,
  };
}

function StatCard({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
      {subtext ? <div style={styles.statSub}>{subtext}</div> : null}
    </div>
  );
}

function App() {
  const [snapshot, setSnapshot] = useState<LeagueSnapshot>(fallbackSnapshot);
  const [selectedTeam, setSelectedTeam] = useState("Andrew");
  const [tab, setTab] = useState<"live" | "team" | "freeagents" | "history">("live");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [lastClientRefresh, setLastClientRefresh] = useState("Not yet");

  async function loadSnapshot(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const raw = await res.json();
      const next = transformSnapshot(raw);
      setSnapshot(next);
      setLastClientRefresh(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      if (!next.teamDetails[selectedTeam] && next.standings[0]?.team) {
        setSelectedTeam(next.standings[0].team);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load snapshot");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { loadSnapshot(); }, []);
  useEffect(() => {
    if (!autoRefreshOn) return;
    const id = window.setInterval(() => loadSnapshot(true), AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefreshOn]);

  const filteredFreeAgents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return snapshot.freeAgents;
    return snapshot.freeAgents.filter((p) => p.name.toLowerCase().includes(q));
  }, [search, snapshot.freeAgents]);

  const selectedTeamRows = snapshot.teamDetails[selectedTeam] ?? [];
  const countingRows = selectedTeamRows.filter((r) => r.counting).sort((a, b) => (a.currentRoundScore ?? 999) - (b.currentRoundScore ?? 999));
  const excludedRows = selectedTeamRows.filter((r) => !r.counting).sort((a, b) => (a.currentRoundScore ?? 999) - (b.currentRoundScore ?? 999));
  const penaltyCount = countingRows.filter((r) => r.golfer === "Worst Score Penalty").length;
  const topFreeAgents = [...filteredFreeAgents].sort((a, b) => {
    const av = a.today === null ? 999 : a.today;
    const bv = b.today === null ? 999 : b.today;
    return av - bv || a.rank - b.rank;
  }).slice(0, 8);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.h1}>Fantasy Golf Live</h1>
            <div style={styles.sub}>Read-only front end for live standings, team detail, free agents, and event history.</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.badge}>Current Event: {snapshot.currentEvent}</div>
            <button style={styles.buttonOutline} onClick={() => setAutoRefreshOn((v) => !v)}>{autoRefreshOn ? "Auto Refresh On" : "Auto Refresh Off"}</button>
            <button style={styles.button} onClick={() => loadSnapshot()}>{loading ? "Refreshing..." : "Refresh Snapshot"}</button>
          </div>
        </div>

        {error ? <div style={styles.error}>Could not load live JSON. Showing fallback snapshot instead. Error: {error}</div> : null}

        <div style={styles.statsGrid}>
          <StatCard title="Live Leader" value={snapshot.leader || "—"} subtext="Official standings source" />
          <StatCard title="Teams" value={snapshot.teamCount ?? snapshot.standings.length} />
          <StatCard title="Free Agents" value={snapshot.freeAgentCount ?? snapshot.freeAgents.length} subtext="Available for add/drop" />
          <StatCard title="Snapshot Status" value={snapshot.liveStatus || snapshot.lastUpdated} subtext={snapshot.lastUpdated} />
          <StatCard title="App Refreshed" value={lastClientRefresh} subtext={autoRefreshOn ? "Every 60 seconds" : "Manual only"} />
        </div>

        <div style={styles.tabs}>
          {(["live","team","freeagents","history"] as const).map((t) => (
            <button key={t} style={tab === t ? styles.tabActive : styles.tab} onClick={() => setTab(t)}>
              {t === "live" ? "Live Standings" : t === "team" ? "Team Detail" : t === "freeagents" ? "Free Agents" : "History"}
            </button>
          ))}
        </div>

        {tab === "live" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Live Race Board</h2>
            <div style={styles.mobileList}>
              {snapshot.standings.map((row) => (
                <div key={row.team} style={styles.listCard}>
                  <div style={styles.rowBetween}>
                    <div><div style={styles.muted}>Rank #{row.rank}</div><div style={styles.teamName}>{row.team}</div></div>
                    <div style={styles.badge}>{row.thru}</div>
                  </div>
                  <div style={styles.threeCol}>
                    <div><div style={styles.muted}>Total</div><div>{row.total ?? "—"}</div></div>
                    <div><div style={styles.muted}>Today</div><div style={{color: scoreColor(row.today)}}>{displayScore(row.today)}</div></div>
                    <div><div style={styles.muted}>Gap</div><div>{row.gap === null || row.gap === 0 ? "—" : `+${row.gap}`}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "team" && (
          <div style={styles.teamGrid}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Select Team</h2>
              <div style={styles.teamButtons}>
                {snapshot.standings.map((team) => (
                  <button key={team.team} style={selectedTeam === team.team ? styles.teamButtonActive : styles.teamButton} onClick={() => setSelectedTeam(team.team)}>
                    {team.team}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={styles.statsGrid3}>
                <StatCard title="Currently Counting" value={countingRows.filter((r) => r.golfer !== "Worst Score Penalty").length} />
                <StatCard title="Excluded" value={excludedRows.length} />
                <StatCard title="Penalty Slots" value={penaltyCount} />
              </div>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>{selectedTeam} — Counting Scores Right Now</h2>
                {countingRows.length === 0 ? <div style={styles.muted}>No live counted golfers yet.</div> : (
                  <div style={styles.stack}>
                    {countingRows.map((row) => (
                      <div key={row.golfer} style={styles.countCard}>
                        <div style={styles.rowBetween}>
                          <div><div style={styles.teamName}>{row.golfer}</div><div style={styles.muted}>{row.golfer === "Worst Score Penalty" ? "Penalty applied" : `Source: ${row.source || "sheet"}`}</div></div>
                          <div style={styles.badgeGreen}>Counting</div>
                        </div>
                        <div style={styles.threeCol}>
                          <div><div style={styles.muted}>Today</div><div style={{color: scoreColor(row.today)}}>{displayScore(row.today)}</div></div>
                          <div><div style={styles.muted}>Thru</div><div>{row.thru}</div></div>
                          <div><div style={styles.muted}>Round Score</div><div>{row.currentRoundScore ?? "—"}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>{selectedTeam} — Excluded Right Now</h2>
                <div style={styles.stack}>
                  {excludedRows.map((row) => (
                    <div key={row.golfer} style={styles.listCard}>
                      <div style={styles.rowBetween}>
                        <div><div style={styles.teamName}>{row.golfer}</div><div style={styles.muted}>Source: {row.source || "sheet"}</div></div>
                        <div style={styles.badgeMuted}>Excluded</div>
                      </div>
                      <div style={styles.threeCol}>
                        <div><div style={styles.muted}>Today</div><div style={{color: scoreColor(row.today)}}>{displayScore(row.today)}</div></div>
                        <div><div style={styles.muted}>Thru</div><div>{row.thru}</div></div>
                        <div><div style={styles.muted}>Round Score</div><div>{row.currentRoundScore ?? "—"}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "freeagents" && (
          <div style={styles.teamGrid}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Free Agent Board</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search free agents" style={styles.input} />
              <div style={styles.stack}>
                {filteredFreeAgents.map((p) => (
                  <div key={p.name} style={styles.listCard}>
                    <div style={styles.teamName}>{p.name}</div>
                    <div style={styles.threeCol}>
                      <div><div style={styles.muted}>DG Rank</div><div>{p.rank}</div></div>
                      <div><div style={styles.muted}>Today</div><div style={{color: scoreColor(p.today)}}>{displayScore(p.today)}</div></div>
                      <div><div style={styles.muted}>Thru</div><div>{p.thru}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Top Free Agents Right Now</h2>
                <div style={styles.stack}>
                  {topFreeAgents.map((p) => (
                    <div key={p.name} style={styles.listCard}>
                      <div style={styles.teamName}>{p.name}</div>
                      <div style={styles.threeCol}>
                        <div><div style={styles.muted}>DG Rank</div><div>{p.rank}</div></div>
                        <div><div style={styles.muted}>Today</div><div style={{color: scoreColor(p.today)}}>{displayScore(p.today)}</div></div>
                        <div><div style={styles.muted}>Thru</div><div>{p.thru}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Recent Roster Moves</h2>
                {snapshot.recentMoves.length === 0 ? <div style={styles.muted}>No roster moves have been recorded yet.</div> : (
                  <div style={styles.stack}>
                    {snapshot.recentMoves.map((move) => (
                      <div key={`${move.team}-${move.add}`} style={styles.listCard}>
                        <div style={styles.teamName}>{move.team}</div>
                        <div style={styles.muted}>{move.event}</div>
                        <div style={{marginTop: 8}}>Drop: {move.drop}</div>
                        <div>Add: {move.add}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Event History</h2>
            {snapshot.history.length === 0 ? <div style={styles.muted}>History will populate after tournaments are archived from the spreadsheet.</div> : (
              <div style={styles.stack}>
                {snapshot.history.map((row) => (
                  <div key={row.event} style={styles.listCard}>
                    <div style={styles.teamName}>{row.event}</div>
                    <div style={styles.threeCol}>
                      <div><div style={styles.muted}>Winner</div><div>{row.tournamentWinner || row.winner || "—"}</div></div>
                      <div><div style={styles.muted}>Winning Score</div><div>{row.winningScore ?? "—"}</div></div>
                      <div><div style={styles.muted}>Timestamp</div><div>{row.timestamp || "—"}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: 12, fontFamily: "Arial, sans-serif", color: "#0f172a" },
  container: { maxWidth: 1200, margin: "0 auto", display: "grid", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" },
  headerRight: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  h1: { margin: 0, fontSize: 36, lineHeight: 1.1 },
  sub: { color: "#475569", fontSize: 14, marginTop: 6 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  sectionTitle: { margin: "0 0 12px", fontSize: 24 },
  statTitle: { color: "#64748b", fontSize: 13, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700 },
  statSub: { color: "#64748b", fontSize: 12, marginTop: 4 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  statsGrid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 },
  badge: { background: "#eef2ff", color: "#312e81", padding: "6px 10px", borderRadius: 999, fontSize: 12, display: "inline-flex", alignItems: "center" },
  badgeGreen: { background: "#dcfce7", color: "#166534", padding: "6px 10px", borderRadius: 999, fontSize: 12 },
  badgeMuted: { background: "#e2e8f0", color: "#334155", padding: "6px 10px", borderRadius: 999, fontSize: 12 },
  button: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 14, padding: "10px 14px", cursor: "pointer" },
  buttonOutline: { background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 14, padding: "10px 14px", cursor: "pointer" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 14, borderRadius: 16, fontSize: 14 },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap", background: "#fff", borderRadius: 18, padding: 6, border: "1px solid #e2e8f0" },
  tab: { background: "transparent", border: "none", borderRadius: 12, padding: "10px 14px", cursor: "pointer", color: "#334155" },
  tabActive: { background: "#e2e8f0", border: "none", borderRadius: 12, padding: "10px 14px", cursor: "pointer", color: "#0f172a", fontWeight: 700 },
  teamGrid: { display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 300px) minmax(0, 1fr)" },
  teamButtons: { display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))" },
  teamButton: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left" },
  teamButtonActive: { background: "#0f172a", color: "#fff", border: "1px solid #0f172a", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left" },
  stack: { display: "grid", gap: 12 },
  listCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14 },
  countCard: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: 14 },
  rowBetween: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  teamName: { fontSize: 18, fontWeight: 700 },
  muted: { color: "#64748b", fontSize: 12 },
  threeCol: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 12, fontSize: 14 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", fontSize: 14, marginBottom: 12 },
  mobileList: { display: "grid", gap: 12 },
};

const root = document.getElementById("root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

