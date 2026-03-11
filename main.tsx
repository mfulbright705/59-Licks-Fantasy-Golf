import React from 'react'
import ReactDOM from 'react-dom/client'
import { motion } from 'framer-motion'
import {
  Trophy,
  Users,
  History as HistoryIcon,
  Shield,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Radio,
} from 'lucide-react'

type Trend = 'up' | 'down' | 'flat'

type StandingRow = {
  rank: number
  team: string
  total: number | null
  today: number | null
  thru: string
  gap: number | null
  trend: Trend
}

type TeamGolferRow = {
  team?: string
  golfer: string
  today: number | null
  thru: string
  counting: boolean
  currentRoundScore?: number | null
  source?: string
}

type FreeAgentRow = {
  id: number
  name: string
  rank: number
  today: number | null
  thru: string
}

type HistoryRow = {
  event: string
  winner?: string
  tournamentWinner?: string
  winningScore: number | null
  r1Winner?: string
  r2Winner?: string
  r3Winner?: string
  r4Winner?: string
  timestamp?: string
}

type MoveRow = {
  event: string
  team: string
  drop: string
  add: string
}

type LeagueSnapshot = {
  currentEvent: string
  lastUpdated: string
  currentRound?: string
  liveStatus?: string
  leader?: string
  teamCount?: number
  freeAgentCount?: number
  historyCount?: number
  standings: StandingRow[]
  teamDetails: Record<string, TeamGolferRow[]>
  freeAgents: FreeAgentRow[]
  history: HistoryRow[]
  recentMoves: MoveRow[]
}

const DATA_URL = import.meta.env.VITE_DATA_URL || 'https://script.google.com/macros/s/AKfycbxlf3nqcU8R-eeMjFcAZVlJm_3-OcVJ2YcIPPhZ1w2FYyoXzHSEpOrGUcEbtrqIYba_rQ/exec'

const fallbackSnapshot: LeagueSnapshot = {
  currentEvent: 'Players Championship',
  lastUpdated: 'Awaiting tee times',
  currentRound: 'R1',
  liveStatus: 'Pre-round',
  leader: 'Andrew',
  teamCount: 8,
  freeAgentCount: 20,
  historyCount: 0,
  standings: [
    { rank: 1, team: 'Andrew', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 2, team: 'Michael', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 3, team: 'Ryan', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 4, team: 'Ty', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 5, team: 'Booher', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 6, team: 'Justin', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 7, team: 'Orians', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
    { rank: 8, team: 'Dexter', total: null, today: null, thru: 'Pre-round', gap: null, trend: 'flat' },
  ],
  teamDetails: {},
  freeAgents: [],
  history: [],
  recentMoves: [],
}

function normalizeTrend(value: unknown): Trend {
  const v = String(value ?? 'flat').toLowerCase()
  if (v === 'up' || v === 'down') return v
  return 'flat'
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

function transformSnapshot(raw: any): LeagueSnapshot {
  const standings: StandingRow[] = Array.isArray(raw?.standings)
    ? raw.standings.map((r: any, index: number) => ({
        rank: Number(r.rank ?? index + 1),
        team: String(r.team ?? ''),
        total: nullableNumber(r.total),
        today: nullableNumber(r.today),
        thru: String(r.thru ?? '—'),
        gap: nullableNumber(r.gap),
        trend: normalizeTrend(r.trend),
      }))
    : []

  const detailsArray: TeamGolferRow[] = Array.isArray(raw?.teamDetails) ? raw.teamDetails : []
  const teamDetails = detailsArray.reduce<Record<string, TeamGolferRow[]>>((acc, row: any) => {
    const team = String(row.team ?? '')
    if (!team) return acc
    if (!acc[team]) acc[team] = []
    acc[team].push({
      team,
      golfer: String(row.golfer ?? ''),
      today: nullableNumber(row.today),
      thru: String(row.thru ?? '—'),
      counting: String(row.counting ?? '').toLowerCase() === 'yes' || Boolean(row.counting),
      currentRoundScore: nullableNumber(row.currentRoundScore),
      source: String(row.source ?? 'sheet'),
    })
    return acc
  }, {})

  const freeAgents: FreeAgentRow[] = Array.isArray(raw?.freeAgents)
    ? raw.freeAgents.map((r: any) => ({
        id: Number(r.id ?? 0),
        name: String(r.name ?? ''),
        rank: Number(r.rank ?? 0),
        today: nullableNumber(r.today),
        thru: String(r.thru ?? '—'),
      }))
    : []

  const history: HistoryRow[] = Array.isArray(raw?.history)
    ? raw.history.map((r: any) => ({
        event: String(r.event ?? ''),
        winner: String(r.winner ?? ''),
        tournamentWinner: String(r.tournamentWinner ?? ''),
        winningScore: nullableNumber(r.winningScore),
        r1Winner: String(r.r1Winner ?? ''),
        r2Winner: String(r.r2Winner ?? ''),
        r3Winner: String(r.r3Winner ?? ''),
        r4Winner: String(r.r4Winner ?? ''),
        timestamp: String(r.timestamp ?? ''),
      }))
    : []

  const recentMoves: MoveRow[] = Array.isArray(raw?.recentMoves)
    ? raw.recentMoves.map((r: any) => ({
        event: String(r.event ?? ''),
        team: String(r.team ?? ''),
        drop: String(r.drop ?? ''),
        add: String(r.add ?? ''),
      }))
    : []

  return {
    currentEvent: String(raw?.currentEvent ?? fallbackSnapshot.currentEvent),
    lastUpdated: String(raw?.lastUpdated ?? fallbackSnapshot.lastUpdated),
    currentRound: String(raw?.currentRound ?? fallbackSnapshot.currentRound ?? 'R1'),
    liveStatus: String(raw?.liveStatus ?? fallbackSnapshot.liveStatus ?? 'Pre-round'),
    leader: String(raw?.leader ?? standings[0]?.team ?? fallbackSnapshot.leader ?? ''),
    teamCount: nullableNumber(raw?.teamCount) ?? standings.length,
    freeAgentCount: nullableNumber(raw?.freeAgentCount) ?? freeAgents.length,
    historyCount: nullableNumber(raw?.historyCount) ?? history.length,
    standings: standings.length ? standings : fallbackSnapshot.standings,
    teamDetails,
    freeAgents,
    history,
    recentMoves,
  }
}

function scoreColor(value: number | null) {
  if (value === null || value === undefined) return 'gray'
  if (value < 0) return 'green'
  if (value > 0) return 'red'
  return 'gray'
}

function displayScore(value: number | null) {
  if (value === null || value === undefined) return '—'
  return value > 0 ? `+${value}` : `${value}`
}

function trendIcon(trend: Trend) {
  if (trend === 'up') return <ArrowUp size={16} />
  if (trend === 'down') return <ArrowDown size={16} />
  return <Minus size={16} />
}

function StatCard({
  title,
  value,
  subtext,
  icon,
}: {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
}) {
  return (
    <div className="card card-pad">
      <div className="stat-inner">
        <div className="icon-wrap">{icon}</div>
        <div>
          <div className="muted">{title}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{value}</div>
          {subtext ? <div className="small-note">{subtext}</div> : null}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [snapshot, setSnapshot] = React.useState<LeagueSnapshot>(fallbackSnapshot)
  const [selectedTeam, setSelectedTeam] = React.useState(fallbackSnapshot.standings[0]?.team ?? 'Andrew')
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<'live' | 'team' | 'freeagents' | 'history'>('live')

  const loadSnapshot = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const raw = await res.json()
      const next = transformSnapshot(raw)
      setSnapshot(next)
      if (!next.teamDetails[selectedTeam] && next.standings[0]?.team) {
        setSelectedTeam(next.standings[0].team)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load snapshot'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [selectedTeam])

  React.useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  const filteredFreeAgents = React.useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return snapshot.freeAgents
    return snapshot.freeAgents.filter((p) => p.name.toLowerCase().includes(q))
  }, [search, snapshot.freeAgents])

  const selectedTeamRows = snapshot.teamDetails[selectedTeam] ?? []
  const countingRows = selectedTeamRows.filter((r) => r.counting)
  const excludedRows = selectedTeamRows.filter((r) => !r.counting)

  const topFreeAgents = React.useMemo(() => {
    const withLive = filteredFreeAgents.filter((p) => p.today !== null)
    if (withLive.length > 0) return [...withLive].sort((a, b) => (a.today ?? 999) - (b.today ?? 999)).slice(0, 8)
    return filteredFreeAgents.slice(0, 8)
  }, [filteredFreeAgents])

  const liveLeader = snapshot.leader || snapshot.standings[0]?.team || 'TBD'

  return (
    <div className="app-shell">
      <div className="container stack">
        <div className="row between">
          <div>
            <h1 className="header-title">Fantasy Golf Live</h1>
            <p className="subtitle">Read-only front end for live standings, team detail, free agents, and event history.</p>
          </div>
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="badge">Current Event: {snapshot.currentEvent}</span>
            <button className="button" onClick={loadSnapshot} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Snapshot'}
            </button>
          </div>
        </div>

        {error ? <div className="alert">Could not load live JSON from Google Apps Script. Showing fallback snapshot instead. Error: {error}</div> : null}

        <div className="stats">
          <StatCard title="Live Leader" value={liveLeader} subtext="Official standings source" icon={<Trophy size={20} color="#c2410c" />} />
          <StatCard title="Teams" value={snapshot.teamCount ?? snapshot.standings.length} icon={<Users size={20} color="#059669" />} />
          <StatCard title="Free Agents" value={snapshot.freeAgentCount ?? snapshot.freeAgents.length} subtext="Available for add/drop" icon={<Shield size={20} color="#0284c7" />} />
          <StatCard title="Snapshot Status" value={snapshot.liveStatus || snapshot.lastUpdated} subtext={snapshot.lastUpdated} icon={<Radio size={20} color="#7c3aed" />} />
        </div>

        <div className="tabs">
          {[
            ['live', 'Live Standings'],
            ['team', 'Team Detail'],
            ['freeagents', 'Free Agents'],
            ['history', 'History'],
          ].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key as any)}>{label}</button>
          ))}
        </div>

        {tab === 'live' ? (
          <div className="card card-pad">
            <h2 className="section-title">Live Race Board</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th className="num">Total</th>
                  <th className="num">Today</th>
                  <th>Thru</th>
                  <th className="num">Gap</th>
                  <th className="center">Trend</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.standings.map((row, idx) => (
                  <motion.tr key={row.team} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                    <td>{row.rank}</td>
                    <td style={{ fontWeight: 700 }}>{row.team}</td>
                    <td className="num">{row.total ?? '—'}</td>
                    <td className={`num ${scoreColor(row.today)}`}>{displayScore(row.today)}</td>
                    <td>{row.thru}</td>
                    <td className="num">{row.gap === null || row.gap === 0 ? '—' : `+${row.gap}`}</td>
                    <td className="center">{trendIcon(row.trend)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === 'team' ? (
          <div className="team-grid">
            <div className="card card-pad">
              <h2 className="section-title">Select Team</h2>
              <div className="team-list">
                {snapshot.standings.map((team) => (
                  <button key={team.team} className={`team-select ${selectedTeam === team.team ? 'active' : ''}`} onClick={() => setSelectedTeam(team.team)}>
                    {team.team}
                  </button>
                ))}
              </div>
            </div>
            <div className="stack">
              <div className="card card-pad">
                <h2 className="section-title">{selectedTeam} — Counting Scores Right Now</h2>
                {countingRows.length === 0 ? (
                  <div className="muted">No live counted golfers yet. Once live scoring is connected, this table will show the current five scores being used.</div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Golfer</th>
                        <th className="num">Today</th>
                        <th className="num">Thru</th>
                        <th>Counting?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countingRows.map((row) => (
                        <tr key={row.golfer}>
                          <td style={{ fontWeight: 700 }}>{row.golfer}</td>
                          <td className={`num ${scoreColor(row.today)}`}>{displayScore(row.today)}</td>
                          <td className="num">{row.thru}</td>
                          <td><span className="pill pill-yes">Yes</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="card card-pad">
                <h2 className="section-title">{selectedTeam} — Excluded Right Now</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Golfer</th>
                      <th className="num">Today</th>
                      <th className="num">Thru</th>
                      <th>Counting?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excludedRows.map((row) => (
                      <tr key={row.golfer}>
                        <td style={{ fontWeight: 700 }}>{row.golfer}</td>
                        <td className={`num ${scoreColor(row.today)}`}>{displayScore(row.today)}</td>
                        <td className="num">{row.thru}</td>
                        <td><span className="pill pill-no">No</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'freeagents' ? (
          <div className="fa-grid">
            <div className="card card-pad">
              <h2 className="section-title">Free Agent Board</h2>
              <div style={{ marginBottom: 16 }}>
                <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search free agents" />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>DG Rank</th>
                    <th>Player</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFreeAgents.map((p) => (
                    <tr key={p.name}>
                      <td>{p.rank}</td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stack">
              <div className="card card-pad">
                <h2 className="section-title">Top Free Agents Right Now</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th className="num">DG Rank</th>
                      <th className="num">Today</th>
                      <th className="num">Thru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFreeAgents.map((p) => (
                      <tr key={p.name}>
                        <td style={{ fontWeight: 700 }}>{p.name}</td>
                        <td className="num">{p.rank}</td>
                        <td className={`num ${scoreColor(p.today)}`}>{displayScore(p.today)}</td>
                        <td className="num">{p.thru}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="small-note" style={{ marginTop: 12 }}>
                  This panel is wired for live scoring too. Free agents are just unrostered golfers, so they can be ranked the same way as active players.
                </p>
              </div>
              <div className="card card-pad">
                <h2 className="section-title">Recent Roster Moves</h2>
                {snapshot.recentMoves.length === 0 ? (
                  <div className="muted">No roster moves have been recorded yet.</div>
                ) : (
                  <div className="stack">
                    {snapshot.recentMoves.map((move) => (
                      <div key={`${move.team}-${move.add}`} className="move-card">
                        <div style={{ fontWeight: 700 }}>{move.team}</div>
                        <div className="small-note" style={{ marginTop: 4 }}>{move.event}</div>
                        <div style={{ marginTop: 12 }}><span style={{ color: '#dc2626', fontWeight: 700 }}>Drop:</span> {move.drop}</div>
                        <div><span style={{ color: '#059669', fontWeight: 700 }}>Add:</span> {move.add}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'history' ? (
          <div className="card card-pad">
            <h2 className="section-title">Event History</h2>
            {snapshot.history.length === 0 ? (
              <div className="muted">History will populate after tournaments are archived from the spreadsheet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Winner</th>
                    <th className="num">Winning Score</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.history.map((row) => (
                    <tr key={row.event}>
                      <td style={{ fontWeight: 700 }}>{row.event}</td>
                      <td>{row.tournamentWinner || row.winner || '—'}</td>
                      <td className="num">{row.winningScore ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
