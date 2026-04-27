import { describe, it, expect } from "vitest"
import { env, SELF } from "cloudflare:test"
import { putPresence } from "../src/presence.js"

const J = { "Content-Type": "application/json" }

describe("users-api", () => {
  it("returns public profile + empty live array when no presence", async () => {
    const dn = `Frank-${crypto.randomUUID().slice(0, 6)}`
    const reg = await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email: `u-${crypto.randomUUID()}@x.com`, password: "x1y2z3", display_name: dn }),
    })
    expect(reg.status).toBe(200)
    const get = await SELF.fetch(`https://edge/api/users/${dn}`)
    expect(get.status).toBe(200)
    const body = await get.json<{ user: { display_name: string }; live: any[] }>()
    expect(body.user.display_name).toBe(dn)
    expect(body.live).toEqual([])
  })

  it("returns live array when presence is set", async () => {
    const dn = `Live-${crypto.randomUUID().slice(0, 6)}`
    const reg = await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email: `${dn}@x.com`, password: "x1y2z3", display_name: dn }),
    })
    const u = await reg.json<{ user: { id: string } }>()
    await putPresence(env.PRESENCE, u.user.id, "agent-abc", {
      room: "demo-1", sinceTs: 100, agentName: "MyClaude",
    })
    const get = await SELF.fetch(`https://edge/api/users/${dn}`)
    const body = await get.json<{ live: Array<{ agent_name: string; room: string }> }>()
    expect(body.live).toHaveLength(1)
    expect(body.live[0]!.room).toBe("demo-1")
    expect(body.live[0]!.agent_name).toBe("MyClaude")
  })

  it("404 for unknown user", async () => {
    const res = await SELF.fetch("https://edge/api/users/no-such-person")
    expect(res.status).toBe(404)
  })
})
