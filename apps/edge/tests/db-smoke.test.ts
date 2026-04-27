import { describe, it, expect } from "vitest"
import { env } from "cloudflare:test"
import { sql } from "drizzle-orm"
import { getDb } from "../src/db/client.js"

describe("db smoke", () => {
  it("connects to D1 and queries users table", async () => {
    const db = getDb(env)
    // tables created by migration applied at miniflare startup
    const rows = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
    const names = (rows.results as Array<{ name: string }>).map(r => r.name)
    expect(names).toContain("users")
    expect(names).toContain("sessions")
    expect(names).toContain("agents")
    expect(names).toContain("follows")
    expect(names).toContain("replays")
    expect(names).toContain("bookmarks")
  })
})
