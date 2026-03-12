import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  RefreshCw,
  Radio,
  Clock3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  r1Winner?: string;
  r2Winner?: string;
  r3Winner?: string;
  r4Winner?: string;
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
  teamDetails: {
    Andrew: [
      { golfer: "Scheffler, Scottie", today: null, thru: "—", counting: false },
      { golfer: "Fitzpatrick, Matt", today: null, thru: "—", counting: false },
      { golfer: "Aberg, Ludvig", today: null, thru: "—", counting: false },
      { golfer: "Fowler, Rickie", today: null, thru: "—", counting: false },
      { golfer: "Noren, Alex", today: null, thru: "—", counting: false },
      { golfer: "Spaun, J.J.", today: null, thru: "—", counting: false },
      { golfer: "Taylor, Nick", today: null, thru: "—", counting: false },
      { golfer: "Greyserman, Max", today: null, thru: "—", counting: false },
      { golfer: "Mitchell, Keith", today: null, thru: "—", counting: false },
      { golfer: "Rodgers, Patrick", today: null, thru: "—", counting: false },
    ],
    Michael: [
      { golfer: "Rahm, Jon", today: null, thru: "—", counting: false },
      { golfer: "MacIntyre, Robert", today: null, thru: "—", counting: false },
      { golfer: "Knapp, Jake", today: null, thru: "—", counting: false },
      { golfer: "Scott, Adam", today: null, thru: "—", counting: false },
      { golfer: "Hojgaard, Rasmus", today: null, thru: "—", counting: false },
      { golfer: "Hojgaard, Nicolai", today: null, thru: "—", counting: false },
      { golfer: "Hatton, Tyrrell", today: null, thru: "—", counting: false },
      { golfer: "Pendrith, Taylor", today: null, thru: "—", counting: false },
      { golfer: "Poston, J.T.", today: null, thru: "—", counting: false },
      { golfer: "Thorbjornsen, Michael", today: null, thru: "—", counting: false },
    ],
    Ryan: [
      { golfer: "McIlroy, Rory", today: null, thru: "—", counting: false },
      { golfer: "Matsuyama, Hideki", today: null, thru: "—", counting: false },
      { golfer: "Bhatia, Akshay", today: null, thru: "—", counting: false },
      { golfer: "Burns, Sam", today: null, thru: "—", counting: false },
      { golfer: "Bradley, Keegan", today: null, thru: "—", counting: false },
      { golfer: "Gerard, Ryan", today: null, thru: "—", counting: false },
      { golfer: "Echavarria, Nico", today: null, thru: "—", counting: false },
      { golfer: "McCarty, Matt", today: null, thru: "—", counting: false },
      { golfer: "Homa, Max", today: null, thru: "—", counting: false },
      { golfer: "McGreevy, Max", today: null, thru: "—", counting: false },
    ],
    Ty: [
      { golfer: "DeChambeau, Bryson", today: null, thru: "—", counting: false },
      { golfer: "Lee, Min Woo", today: null, thru: "—", counting: false },
      { golfer: "English, Harris", today: null, thru: "—", counting: false },
      { golfer: "Straka, Sepp", today: null, thru: "—", counting: false },
      { golfer: "Bridgeman, Jacob", today: null, thru: "—", counting: false },
      { golfer: "Penge, Marco", today: null, thru: "—", counting: false },
      { golfer: "Brennan, Michael", today: null, thru: "—", counting: false },
      { golfer: "Novak, Andrew", today: null, thru: "—", counting: false },
      { golfer: "Castillo, Ricky", today: null, thru: "—", counting: false },
      { golfer: "Olesen, Thorbjorn", today: null, thru: "—", counting: false },
    ],
    Booher: [
      { golfer: "Henley, Russell", today: null, thru: "—", counting: false },
      { golfer: "Hovland, Viktor", today: null, thru: "—", counting: false },
      { golfer: "Gotterup, Chris", today: null, thru: "—", counting: false },
      { golfer: "McNealy, Maverick", today: null, thru: "—", counting: false },
      { golfer: "Spieth, Jordan", today: null, thru: "—", counting: false },
      { golfer: "Cantlay, Patrick", today: null, thru: "—", counting: false },
      { golfer: "Thomas, Justin", today: null, thru: "—", counting: false },
      { golfer: "Fox, Ryan", today: null, thru: "—", counting: false },
      { golfer: "Smith, Cameron", today: null, thru: "—", counting: false },
      { golfer: "Niemann, Joaquin", today: null, thru: "—", counting: false },
    ],
    Justin: [
      { golfer: "Fleetwood, Tommy", today: null, thru: "—", counting: false },
      { golfer: "Young, Cameron", today: null, thru: "—", counting: false },
      { golfer: "Hall, Harry", today: null, thru: "—", counting: false },
      { golfer: "Griffin, Ben", today: null, thru: "—", counting: false },
      { golfer: "Coody, Pierceson", today: null, thru: "—", counting: false },
      { golfer: "Day, Jason", today: null, thru: "—", counting: false },
      { golfer: "Stevens, Sam", today: null, thru: "—", counting: false },
      { golfer: "Clark, Wyndham", today: null, thru: "—", counting: false },
      { golfer: "Reitan, Kristoffer", today: null, thru: "—", counting: false },
      { golfer: "Keefer, Johnny", today: null, thru: "—", counting: false },
    ],
    Orians: [
      { golfer: "Schauffele, Xander", today: null, thru: "—", counting: false },
      { golfer: "Morikawa, Collin", today: null, thru: "—", counting: false },
      { golfer: "Theegala, Sahith", today: null, thru: "—", counting: false },
      { golfer: "Lowry, Shane", today: null, thru: "—", counting: false },
      { golfer: "Rose, Justin", today: null, thru: "—", counting: false },
      { golfer: "Berger, Daniel", today: null, thru: "—", counting: false },
      { golfer: "Conners, Corey", today: null, thru: "—", counting: false },
      { golfer: "Koepka, Brooks", today: null, thru: "—", counting: false },
      { golfer: "Rai, Aaron", today: null, thru: "—", counting: false },
      { golfer: "Valimaki, Sami", today: null, thru: "—", counting: false },
    ],
    Dexter: [
      { golfer: "Reed, Patrick", today: null, thru: "—", counting: false },
      { golfer: "Kim, Si Woo", today: null, thru: "—", counting: false },
      { golfer: "Kitayama, Kurt", today: null, thru: "—", counting: false },
      { golfer: "Li, Haotong", today: null, thru: "—", counting: false },
      { golfer: "Hisatsune, Ryo", today: null, thru: "—", counting: false },
      { golfer: "Kim, Michael", today: null, thru: "—", counting: false },
      { golfer: "Finau, Tony", today: null, thru: "—", counting: false },
      { golfer: "Bezuidenhout, Christiaan", today: null, thru: "—", counting: false },
      { golfer: "Im, Sungjae", today: null, thru: "—", counting: false },
      { golfer: "Yu, Kevin", today: null, thru: "—", counting: false },
    ],
  },
  freeAgents: [
    { id: 40, name: "Hillier, Daniel", rank: 40, today: null, thru: "—" },
    { id: 47, name: "Schaper, Jayden", rank: 47, today: null, thru: "—" },
    { id: 53, name: "Koivun, Jackson", rank: 53, today: null, thru: "—" },
    { id: 56, name: "Puig, David", rank: 56, today: null, thru: "—" },
    { id: 60, name: "Ayora, Angel", rank: 60, today: null, thru: "—" },
    { id: 65, name: "Munoz, Sebastian", rank: 65, today: null, thru: "—" },
    { id: 69, name: "Detry, Thomas", rank: 69, today: null, thru: "—" },
    { id: 70, name: "Smith, Jordan", rank: 70, today: null, thru: "—" },
    { id: 71, name: "Parry, John", rank: 71, today: null, thru: "—" },
    { id: 72, name: "Jarvis, Casey", rank: 72, today: null, thru: "—" },
    { id: 73, name: "Meissner, Mac", rank: 73, today: null, thru: "—" },
    { id: 75, name: "McCarthy, Denny", rank: 75, today: null, thru: "—" },
    { id: 78, name: "Ortiz, Carlos", rank: 78, today: null, thru: "—" },
    { id: 79, name: "Pieters, Thomas", rank: 79, today: null, thru: "—" },
    { id: 80, name: "Thompson, Davis", rank: 80, today: null, thru: "—" },
    { id: 81, name: "Herbert, Lucas", rank: 81, today: null, thru: "—" },
    { id: 82, name: "Glover, Lucas", rank: 82, today: null, thru: "—" },
    { id: 83, name: "Ancer, Abraham", rank: 83, today: null, thru: "—" },
    { id: 85, name: "Zalatoris, Will", rank: 85, today: null, thru: "—" },
    { id: 89, name: "Smalley, Alex", rank: 89, today: null, thru: "—" },
  ],
  history: [],
  recentMoves: [],
};

function trendIcon(trend: Trend) {
  if (trend === "up") return <ArrowUp className="h-4 w-4" />;
  if (trend === "down") return <ArrowDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

function scoreColor(value: number | null) {
  if (value === null || value === undefined) return "text-slate-400";
  if (value < 0) return "text-emerald-600";
  if (value > 0) return "text-rose-600";
  return "text-slate-500";
}

function displayScore(value: number | null) {
  if (value === null || value === undefined) return "—";
  return value > 0 ? `+${value}` : `${value}`;
}

function StatCard({
  title,
  value,
  icon,
  subtext,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-slate-100 p-3">{icon}</div>
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="text-lg font-semibold">{value}</div>
          {subtext ? <div className="text-xs text-slate-500">{subtext}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FantasyGolfLiveDashboardApp() {
  const [snapshot, setSnapshot] = useState<LeagueSnapshot>(fallbackSnapshot);
  const [selectedTeam, setSelectedTeam] = useState(fallbackSnapshot.standings[0]?.team ?? "Andrew");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshOn, setAutoRefreshOn] = useState(true);
  const [lastClientRefresh, setLastClientRefresh] = useState<string>("Not yet");

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load snapshot";
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshot();
  }, []);

  useEffect(() => {
    if (!autoRefreshOn) return;
    const id = window.setInterval(() => {
      loadSnapshot(true);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefreshOn, selectedTeam]);

  const filteredFreeAgents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return snapshot.freeAgents;
    return snapshot.freeAgents.filter((p) => p.name.toLowerCase().includes(q));
  }, [search, snapshot.freeAgents]);

  const selectedTeamRows = snapshot.teamDetails[selectedTeam] ?? [];
  const countingRows = selectedTeamRows
    .filter((r) => r.counting)
    .sort((a, b) => {
      const aPenalty = a.golfer === "Worst Score Penalty" ? 1 : 0;
      const bPenalty = b.golfer === "Worst Score Penalty" ? 1 : 0;
      if (aPenalty !== bPenalty) return aPenalty - bPenalty;
      const aScore = a.currentRoundScore ?? 999;
      const bScore = b.currentRoundScore ?? 999;
      return aScore - bScore;
    });
  const excludedRows = selectedTeamRows
    .filter((r) => !r.counting)
    .sort((a, b) => {
      const aScore = a.currentRoundScore ?? 999;
      const bScore = b.currentRoundScore ?? 999;
      return aScore - bScore;
    });

  const topFreeAgents = useMemo(() => {
    const withLive = filteredFreeAgents.filter((p) => p.today !== null);
    if (withLive.length > 0) {
      return [...withLive].sort((a, b) => (a.today ?? 999) - (b.today ?? 999)).slice(0, 8);
    }
    return filteredFreeAgents.slice(0, 8);
  }, [filteredFreeAgents]);

  const liveLeader = snapshot.leader || snapshot.standings[0]?.team || "TBD";
  const countingCount = countingRows.filter((r) => r.golfer !== "Worst Score Penalty").length;
  const penaltyCount = countingRows.filter((r) => r.golfer === "Worst Score Penalty").length;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Fantasy Golf Live</h1>
            <p className="mt-1 text-sm text-slate-600">
              Read-only front end for live standings, team detail, free agents, and event history.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Badge variant="secondary" className="justify-center rounded-full px-3 py-1 text-xs sm:justify-start">
              Current Event: {snapshot.currentEvent}
            </Badge>
            <Button
              variant={autoRefreshOn ? "default" : "outline"}
              className="rounded-2xl"
              onClick={() => setAutoRefreshOn((v) => !v)}
            >
              <Clock3 className="mr-2 h-4 w-4" />
              {autoRefreshOn ? "Auto Refresh On" : "Auto Refresh Off"}
            </Button>
            <Button className="rounded-2xl" onClick={() => loadSnapshot()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh Snapshot"}
            </Button>
          </div>
        </div>

        {error ? (
          <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
            <CardContent className="p-4 text-sm text-rose-700">
              Could not load live JSON from Google Apps Script. Showing fallback snapshot instead. Error: {error}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Live Leader"
            value={liveLeader}
            icon={<Trophy className="h-5 w-5 text-amber-700" />}
            subtext="Official standings source"
          />
          <StatCard
            title="Teams"
            value={snapshot.teamCount ?? snapshot.standings.length}
            icon={<Users className="h-5 w-5 text-emerald-700" />}
          />
          <StatCard
            title="Free Agents"
            value={snapshot.freeAgentCount ?? snapshot.freeAgents.length}
            icon={<Shield className="h-5 w-5 text-sky-700" />}
            subtext="Available for add/drop"
          />
          <StatCard
            title="Snapshot Status"
            value={snapshot.liveStatus || snapshot.lastUpdated}
            icon={<Radio className="h-5 w-5 text-violet-700" />}
            subtext={snapshot.lastUpdated}
          />
          <StatCard
            title="App Refreshed"
            value={lastClientRefresh}
            icon={<Clock3 className="h-5 w-5 text-slate-700" />}
            subtext={autoRefreshOn ? "Every 60 seconds" : "Manual only"}
          />
        </div>

        <Tabs defaultValue="live" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white p-1 shadow-sm md:w-[720px] md:grid-cols-4">
            <TabsTrigger value="live" className="rounded-xl text-xs sm:text-sm">Live Standings</TabsTrigger>
            <TabsTrigger value="team" className="rounded-xl text-xs sm:text-sm">Team Detail</TabsTrigger>
            <TabsTrigger value="freeagents" className="rounded-xl text-xs sm:text-sm">Free Agents</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-xs sm:text-sm">History</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4 sm:space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Live Race Board</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Today</TableHead>
                        <TableHead>Thru</TableHead>
                        <TableHead className="text-right">Gap</TableHead>
                        <TableHead className="text-center">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.standings.map((row, idx) => (
                        <motion.tr
                          key={row.team}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{row.rank}</TableCell>
                          <TableCell className="font-semibold">{row.team}</TableCell>
                          <TableCell className="text-right">{row.total ?? "—"}</TableCell>
                          <TableCell className={`text-right font-semibold ${scoreColor(row.today)}`}>
                            {displayScore(row.today)}
                          </TableCell>
                          <TableCell>{row.thru}</TableCell>
                          <TableCell className="text-right">
                            {row.gap === null || row.gap === 0 ? "—" : `+${row.gap}`}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">{trendIcon(row.trend)}</div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 md:hidden">
                  {snapshot.standings.map((row) => (
                    <div key={row.team} className="rounded-2xl border bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Rank #{row.rank}</div>
                          <div className="text-base font-semibold text-slate-900">{row.team}</div>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-xs">
                          {trendIcon(row.trend)}
                          <span>{row.thru}</span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500">Total</div>
                          <div className="font-semibold">{row.total ?? "—"}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Today</div>
                          <div className={`font-semibold ${scoreColor(row.today)}`}>{displayScore(row.today)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Gap</div>
                          <div className="font-semibold">{row.gap === null || row.gap === 0 ? "—" : `+${row.gap}`}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Select Team</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {snapshot.standings.map((team) => (
                    <Button
                      key={team.team}
                      variant={selectedTeam === team.team ? "default" : "outline"}
                      className="justify-start rounded-xl"
                      onClick={() => setSelectedTeam(team.team)}
                    >
                      {team.team}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500">Currently Counting</div>
                      <div className="mt-1 text-2xl font-semibold">{countingCount}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500">Excluded</div>
                      <div className="mt-1 text-2xl font-semibold">{excludedRows.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-slate-500">Penalty Slots</div>
                      <div className="mt-1 text-2xl font-semibold">{penaltyCount}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>{selectedTeam} — Counting Scores Right Now</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {countingRows.length === 0 ? (
                      <div className="text-sm text-slate-500">No live counted golfers yet. Once live scoring is connected, this table will show the current five scores being used.</div>
                    ) : (
                      <div className="space-y-3">
                        {countingRows.map((row) => (
                          <div key={row.golfer} className="rounded-2xl border bg-emerald-50/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium text-slate-900">{row.golfer}</div>
                                <div className="mt-1 text-xs text-slate-500">{row.golfer === "Worst Score Penalty" ? "Penalty applied" : `Source: ${row.source || "sheet"}`}</div>
                              </div>
                              <Badge className="rounded-full">Counting</Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <div className="text-slate-500">Today</div>
                                <div className={`font-semibold ${scoreColor(row.today)}`}>{displayScore(row.today)}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Thru</div>
                                <div className="font-semibold">{row.thru}</div>
                              </div>
                              <div>
                                <div className="text-slate-500">Round Score</div>
                                <div className="font-semibold">{row.currentRoundScore ?? "—"}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>{selectedTeam} — Excluded Right Now</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {excludedRows.map((row) => (
                        <div key={row.golfer} className="rounded-2xl border bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-900">{row.golfer}</div>
                              <div className="mt-1 text-xs text-slate-500">Source: {row.source || "sheet"}</div>
                            </div>
                            <Badge variant="secondary" className="rounded-full">Excluded</Badge>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-slate-500">Today</div>
                              <div className={`font-semibold ${scoreColor(row.today)}`}>{displayScore(row.today)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Thru</div>
                              <div className="font-semibold">{row.thru}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Round Score</div>
                              <div className="font-semibold">{row.currentRoundScore ?? "—"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="freeagents" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Free Agent Board</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search free agents"
                      className="rounded-xl pl-9"
                    />
                  </div>
                  <div className="space-y-3 md:hidden">
                    {filteredFreeAgents.map((p) => (
                      <div key={p.name} className="rounded-2xl border bg-white p-4">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-slate-500">DG Rank</div>
                            <div className="font-semibold">{p.rank}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Today</div>
                            <div className={`font-semibold ${scoreColor(p.today)}`}>{displayScore(p.today)}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Thru</div>
                            <div className="font-semibold">{p.thru}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DG Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Today</TableHead>
                          <TableHead className="text-right">Thru</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFreeAgents.map((p) => (
                          <TableRow key={p.name}>
                            <TableCell>{p.rank}</TableCell>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell className={`text-right font-semibold ${scoreColor(p.today)}`}>{displayScore(p.today)}</TableCell>
                            <TableCell className="text-right">{p.thru}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 sm:space-y-6">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Top Free Agents Right Now</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topFreeAgents.map((p) => (
                        <div key={`fa-live-${p.name}`} className="rounded-2xl border bg-white p-4">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-slate-500">DG Rank</div>
                              <div className="font-semibold">{p.rank}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Today</div>
                              <div className={`font-semibold ${scoreColor(p.today)}`}>{displayScore(p.today)}</div>
                            </div>
                            <div>
                              <div className="text-slate-500">Thru</div>
                              <div className="font-semibold">{p.thru}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      This panel is wired for live scoring too. Free agents are just unrostered golfers, so they can be ranked the same way as active players.
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Roster Moves</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.recentMoves.length === 0 ? (
                      <div className="text-sm text-slate-500">No roster moves have been recorded yet.</div>
                    ) : (
                      snapshot.recentMoves.map((move) => (
                        <div key={`${move.team}-${move.add}`} className="rounded-2xl border bg-slate-50 p-4">
                          <div className="text-sm font-semibold text-slate-900">{move.team}</div>
                          <div className="mt-1 text-sm text-slate-500">{move.event}</div>
                          <div className="mt-3 text-sm">
                            <span className="font-medium text-rose-600">Drop:</span> {move.drop}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-emerald-600">Add:</span> {move.add}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Event History</CardTitle>
              </CardHeader>
              <CardContent>
                {snapshot.history.length === 0 ? (
                  <div className="text-sm text-slate-500">History will populate after tournaments are archived from the spreadsheet.</div>
                ) : (
                  <div className="space-y-3">
                    {snapshot.history.map((row) => (
                      <div key={row.event} className="rounded-2xl border bg-white p-4">
                        <div className="font-medium text-slate-900">{row.event}</div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-slate-500">Winner</div>
                            <div className="font-semibold">{row.tournamentWinner || row.winner || "—"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Winning Score</div>
                            <div className="font-semibold">{row.winningScore ?? "—"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Timestamp</div>
                            <div className="font-semibold">{row.timestamp || "—"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
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
        r1Winner: String(r.r1Winner ?? ""),
        r2Winner: String(r.r2Winner ?? ""),
        r3Winner: String(r.r3Winner ?? ""),
        r4Winner: String(r.r4Winner ?? ""),
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
    teamDetails: Object.keys(teamDetails).length ? teamDetails : fallbackSnapshot.teamDetails,
    freeAgents: freeAgents.length ? freeAgents : fallbackSnapshot.freeAgents,
    history,
    recentMoves,
  };
}

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
