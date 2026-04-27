"use client"

import { useEffect, useRef, useState } from "react"
import { TableView } from "@/components/TableView"
import { RightColumn } from "@/components/right-column/RightColumn"
import { openRoomSocket, type GameEvent, type WsClient } from "@/lib/ws-client"

const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_URL ?? "http://localhost:8787"

interface Props {
  room: string
}

export function RoomClient({ room }: Props) {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WsClient | null>(null)

  useEffect(() => {
    const client = openRoomSocket(EDGE_URL, room, (e) => {
      if (e.type === "snapshot") {
        setSnapshot(e.state)
        setConnected(true)
      } else if (e.type === "seat_update") {
        setSnapshot((prev: any) => {
          if (!prev) return prev
          const seats = [...prev.seats]
          if (e.kind === "empty") seats[e.seat] = { kind: "empty" }
          else if (e.kind === "bot") seats[e.seat] = { kind: "bot", name: e.name, chips: 1000 }
          else if (e.kind === "agent") seats[e.seat] = { kind: "agent", name: e.name, chips: 1000 }
          return { ...prev, seats }
        })
      }
      setEvents((prev) => {
        const next = [...prev, e]
        return next.length > 200 ? next.slice(next.length - 200) : next
      })
    })
    wsRef.current = client
    return () => client.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] h-full min-h-0">
      <div className="overflow-y-auto">
        <TableView room={room} snapshot={snapshot} />
        {!connected && (
          <div className="px-6 text-xs text-text-muted">
            waiting for first snapshot from <code>{EDGE_URL}</code>…
          </div>
        )}
      </div>
      <aside className="border-l border-border bg-bg-surface min-h-0">
        <RightColumn events={events} />
      </aside>
    </div>
  )
}
