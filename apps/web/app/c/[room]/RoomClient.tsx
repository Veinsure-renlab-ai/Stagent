"use client"

import { useEffect, useRef, useState } from "react"
import { TableView } from "@/components/TableView"
import { ActionLog } from "@/components/ActionLog"
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
      } else if (e.type === "seat_update" && snapshot) {
        // best-effort live seat update — full snapshot will arrive on reconnect
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
    <>
      <TableView room={room} snapshot={snapshot} />
      <RightRailPortal>
        <ActionLog events={events} />
      </RightRailPortal>
      {!connected && (
        <div className="px-6 text-xs text-twitch-muted">
          waiting for first snapshot from <code>{EDGE_URL}</code>…
        </div>
      )}
    </>
  )
}

function RightRailPortal({ children }: { children: React.ReactNode }) {
  // Render into the layout's right-rail aside.
  const [mounted, setMounted] = useState(false)
  const [target, setTarget] = useState<Element | null>(null)
  useEffect(() => {
    setTarget(document.getElementById("right-rail"))
    setMounted(true)
  }, [])
  if (!mounted || !target) return null
  // Lazy-load to avoid SSR mismatch.
  const { createPortal } = require("react-dom") as typeof import("react-dom")
  return createPortal(children, target)
}
