"use client"

interface SeatView {
  kind: "empty" | "bot" | "agent"
  name?: string
  chips?: number
}

interface EngineView {
  street: string
  pot_main: number
  current_bet: number
  to_act: number | null
  board: Array<{ rank: string; suit: string }>
  seats: Array<{ agent_id: string; chips: number; status: string; index: number }>
}

interface Snapshot {
  kind: "demo" | "private"
  room: string
  seats: SeatView[]
  engine: EngineView | null
  handsPlayed: number
}

interface Props {
  room: string
  snapshot: Snapshot | null
}

const SUIT_GLYPH: Record<string, string> = {
  s: "♠", h: "♥", d: "♦", c: "♣",
}

function Card({ rank, suit }: { rank: string; suit: string }) {
  const red = suit === "h" || suit === "d"
  return (
    <div
      className={`inline-flex items-center justify-center w-10 h-14 rounded bg-white text-xl font-bold mr-1 shadow ${
        red ? "text-red-600" : "text-black"
      }`}
    >
      {rank}
      {SUIT_GLYPH[suit] ?? "?"}
    </div>
  )
}

function Seat({ seat, isToAct, label }: { seat: SeatView; isToAct: boolean; label: string }) {
  const ringColor = isToAct
    ? "ring-2 ring-yellow-400"
    : seat.kind === "agent"
    ? "ring-2 ring-twitch-accent"
    : "ring-1 ring-twitch-border"
  return (
    <div
      className={`w-32 px-3 py-2 bg-twitch-surface rounded ${ringColor} text-center`}
    >
      <div className="text-xs text-twitch-muted">{label}</div>
      <div className="text-sm font-medium truncate">
        {seat.kind === "empty" ? <span className="text-twitch-muted">empty</span> : seat.name}
      </div>
      <div className="text-xs text-twitch-muted">
        {seat.kind !== "empty" ? `${seat.chips ?? 0} chips` : "—"}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide">
        {seat.kind === "agent" ? (
          <span className="text-twitch-accent">agent</span>
        ) : seat.kind === "bot" ? (
          <span className="text-twitch-muted">bot</span>
        ) : (
          <span className="text-twitch-muted">—</span>
        )}
      </div>
    </div>
  )
}

export function TableView({ room, snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="p-6 text-twitch-muted">
        Connecting to <code>{room}</code>…
      </div>
    )
  }
  const engine = snapshot.engine
  const toActDoIdx = engine?.to_act ?? null
  // engine.to_act is the engine seat index; map to DO seat index by stepping
  // through non-empty seats.
  const toActSeatIdx = (() => {
    if (toActDoIdx === null || !engine) return null
    let cur = -1
    for (let i = 0; i < snapshot.seats.length; i++) {
      if (snapshot.seats[i]!.kind !== "empty") {
        cur += 1
        if (cur === toActDoIdx) return i
      }
    }
    return null
  })()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold">{room}</h1>
          <div className="text-xs text-twitch-muted">
            {snapshot.kind === "demo" ? "demo table" : "private table"} · hand #{snapshot.handsPlayed}
          </div>
        </div>
        {engine && (
          <div className="text-xs text-twitch-muted text-right">
            <div>street: <span className="text-twitch-text">{engine.street}</span></div>
            <div>pot: <span className="text-twitch-text">{engine.pot_main}</span></div>
            <div>bet: <span className="text-twitch-text">{engine.current_bet}</span></div>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="flex items-center justify-center min-h-[80px] bg-green-900/20 border border-twitch-border rounded p-3">
        {engine?.board?.length ? (
          engine.board.map((c, i) => <Card key={i} rank={c.rank} suit={c.suit} />)
        ) : (
          <div className="text-twitch-muted text-sm">— waiting for flop —</div>
        )}
      </div>

      {/* Seats — 4 in a row, simple */}
      <div className="grid grid-cols-4 gap-3">
        {snapshot.seats.map((s, i) => (
          <Seat key={i} seat={s} isToAct={i === toActSeatIdx} label={`seat ${i}`} />
        ))}
      </div>
    </div>
  )
}
