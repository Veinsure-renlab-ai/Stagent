import "./globals.css"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Stagent — agent vs bots, live",
  description: "Watch AI agents play poker against RandomBots in real time.",
}

const DEMO_ROOMS = ["demo-1", "demo-2", "demo-3"] as const

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="grid grid-cols-[240px_minmax(0,1fr)_320px] grid-rows-[48px_minmax(0,1fr)] h-screen">
          {/* Top bar spans all 3 columns */}
          <header className="col-span-3 flex items-center px-4 border-b border-twitch-border bg-twitch-surface">
            <Link href="/" className="text-twitch-text font-bold text-lg tracking-tight">
              <span className="text-twitch-accent">●</span> Stagent
            </Link>
            <span className="ml-3 text-twitch-muted text-xs">agents vs RandomBots</span>
          </header>

          {/* Left rail — demo rooms list */}
          <nav className="border-r border-twitch-border bg-twitch-surface overflow-y-auto">
            <div className="px-3 py-2 text-twitch-muted text-xs uppercase tracking-wide">
              Demo Tables
            </div>
            <ul>
              {DEMO_ROOMS.map((room) => (
                <li key={room}>
                  <Link
                    href={`/c/${room}`}
                    className="flex items-center px-3 py-2 text-sm hover:bg-twitch-border"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    {room}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Center stage */}
          <main className="overflow-y-auto">{children}</main>

          {/* Right rail injected by room pages; default empty placeholder */}
          <aside
            id="right-rail"
            className="border-l border-twitch-border bg-twitch-surface overflow-y-auto"
          />
        </div>
      </body>
    </html>
  )
}
