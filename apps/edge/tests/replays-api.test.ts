import { describe, it, expect } from "vitest"
import { SELF } from "cloudflare:test"

const J = { "Content-Type": "application/json" }

async function newUser(email: string) {
  const reg = await SELF.fetch("https://edge/api/auth/register", {
    method: "POST", headers: J,
    body: JSON.stringify({ email, password: "x1y2z3", display_name: email.split("@")[0] }),
  })
  const sid = reg.headers.get("Set-Cookie")!.match(/stg_sid=([^;]+)/)![1]!
  return { sid, headers: { Cookie: `stg_sid=${sid}`, ...J } }
}

const sampleEvents = [{ type: "snapshot", state: {} }, { type: "hand_start", handId: 1, dealer: 0 }]

describe("replays-api", () => {
  it("uploads a replay (private) and retrieves by owner", async () => {
    const { headers } = await newUser(`r1-${crypto.randomUUID()}@x.com`)
    const up = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 100, ended_at: 200, hands_count: 1,
        events: sampleEvents, visibility: "private",
      }),
    })
    expect(up.status).toBe(200)
    const u = await up.json<{ id: string }>()

    const get = await SELF.fetch(`https://edge/api/replays/${u.id}`, { headers })
    expect(get.status).toBe(200)
    const g = await get.json<{ id: string; events: any[] }>()
    expect(g.events).toHaveLength(2)
  })

  it("private replay 404 for other user", async () => {
    const a = await newUser(`r2a-${crypto.randomUUID()}@x.com`)
    const b = await newUser(`r2b-${crypto.randomUUID()}@x.com`)
    const up = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers: a.headers,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 1, ended_at: 2, hands_count: 1,
        events: sampleEvents, visibility: "private",
      }),
    })
    const u = await up.json<{ id: string }>()
    const get = await SELF.fetch(`https://edge/api/replays/${u.id}`, { headers: b.headers })
    expect(get.status).toBe(404)
  })

  it("public replay readable by anyone (no cookie)", async () => {
    const a = await newUser(`r3-${crypto.randomUUID()}@x.com`)
    const up = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers: a.headers,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 1, ended_at: 2, hands_count: 1,
        events: sampleEvents, visibility: "public",
      }),
    })
    const u = await up.json<{ id: string }>()
    const get = await SELF.fetch(`https://edge/api/replays/${u.id}`)
    expect(get.status).toBe(200)
  })

  it("rejects oversized replay (>1 MB)", async () => {
    const { headers } = await newUser(`r4-${crypto.randomUUID()}@x.com`)
    const big = "x".repeat(1024 * 1024 + 100)
    const res = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 1, ended_at: 2, hands_count: 1,
        events: [{ type: "snapshot", state: big }], visibility: "private",
      }),
    })
    expect(res.status).toBe(413)
  })

  it("delete only by owner", async () => {
    const a = await newUser(`r5a-${crypto.randomUUID()}@x.com`)
    const b = await newUser(`r5b-${crypto.randomUUID()}@x.com`)
    const up = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers: a.headers,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 1, ended_at: 2, hands_count: 1,
        events: sampleEvents, visibility: "private",
      }),
    })
    const u = await up.json<{ id: string }>()
    const del1 = await SELF.fetch(`https://edge/api/replays/${u.id}`, {
      method: "DELETE", headers: b.headers,
    })
    expect(del1.status).toBe(404)
    const del2 = await SELF.fetch(`https://edge/api/replays/${u.id}`, {
      method: "DELETE", headers: a.headers,
    })
    expect(del2.status).toBe(200)
  })

  it("requires session for upload", async () => {
    const res = await SELF.fetch("https://edge/api/replays", {
      method: "POST", headers: J,
      body: JSON.stringify({
        room: "demo-1", room_kind: "demo",
        started_at: 1, ended_at: 2, hands_count: 1,
        events: sampleEvents, visibility: "private",
      }),
    })
    expect(res.status).toBe(401)
  })
})
