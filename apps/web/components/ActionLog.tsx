"use client"

import type { GameEvent } from "@/lib/ws-client"

interface Props {
  events: GameEvent[]
}

function describe(e: GameEvent): { tag: string; body: string } {
  switch (e.type) {
    case "snapshot":
      return { tag: "snap", body: "table snapshot" }
    case "hand_start":
      return { tag: "hand", body: `start #${e.handId} · dealer ${e.dealer}` }
    case "action":
      return {
        tag: "act",
        body: `seat ${e.seat} · ${e.action}${e.amount !== undefined ? ` ${e.amount}` : ""}`,
      }
    case "board":
      return { tag: "board", body: `${e.cards.length} card(s)` }
    case "showdown":
      return { tag: "show", body: "showdown" }
    case "seat_update":
      return { tag: "seat", body: `seat ${e.seat} → ${e.kind}${e.name ? ` (${e.name})` : ""}` }
    case "say":
      return { tag: "say", body: `seat ${e.seat}: ${e.text}` }
  }
}

const TAG_COLOR: Record<string, string> = {
  snap: "text-twitch-muted",
  hand: "text-yellow-400",
  act: "text-twitch-text",
  board: "text-blue-400",
  show: "text-orange-400",
  seat: "text-green-400",
  say: "text-twitch-accent",
}

export function ActionLog({ events }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-twitch-border text-xs uppercase tracking-wide text-twitch-muted">
        Action log
      </div>
      <ol className="flex-1 overflow-y-auto px-2 py-1 text-xs space-y-0.5 font-mono">
        {events.length === 0 && (
          <li className="text-twitch-muted px-1 py-1">waiting for events…</li>
        )}
        {events.map((e, i) => {
          const d = describe(e)
          return (
            <li key={i} className="flex gap-2 px-1 py-0.5">
              <span className={`shrink-0 w-12 ${TAG_COLOR[d.tag] ?? ""}`}>{d.tag}</span>
              <span className="text-twitch-text">{d.body}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
