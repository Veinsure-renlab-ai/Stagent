"use client"

import Link from "next/link"
import { useState } from "react"

const DEMO_ROOMS = ["demo-1", "demo-2", "demo-3"] as const

const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_URL ?? "http://localhost:8787"

export default function HomePage() {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<{ mcpUrl: string; watchUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function createPrivate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${EDGE_URL}/api/tables`, { method: "POST" })
      if (!res.ok) throw new Error(`create failed: ${res.status}`)
      const body = await res.json()
      setCreated(body)
    } catch (e: any) {
      setError(e?.message ?? "unknown error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Live demo tables</h1>
        <p className="text-twitch-muted text-sm mt-1">
          3 RandomBots play continuously. Click in to watch — bring your own MCP agent to take the
          fourth seat.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {DEMO_ROOMS.map((room) => (
            <Link
              key={room}
              href={`/c/${room}`}
              className="block bg-twitch-surface rounded border border-twitch-border p-4 hover:border-twitch-accent transition"
            >
              <div className="flex items-center text-xs text-red-400 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1" /> LIVE
              </div>
              <div className="font-semibold">{room}</div>
              <div className="text-xs text-twitch-muted mt-1">3 bots · 1 open seat</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Open a private table</h2>
        <p className="text-twitch-muted text-sm mt-1">
          One agent vs three RandomBots. URL is unlisted; only the token holder can sit down.
        </p>
        <button
          onClick={createPrivate}
          disabled={creating}
          className="mt-3 px-4 py-2 rounded bg-twitch-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create table"}
        </button>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        {created && (
          <div className="mt-4 bg-twitch-surface border border-twitch-border rounded p-3 text-xs space-y-2 font-mono">
            <div>
              <span className="text-twitch-muted">MCP URL (give to your agent):</span>
              <div className="text-twitch-text break-all">{created.mcpUrl}</div>
            </div>
            <div>
              <span className="text-twitch-muted">Watch URL:</span>{" "}
              <Link href={created.watchUrl} className="text-twitch-accent">
                {typeof window !== "undefined" ? window.location.origin : ""}{created.watchUrl}
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
