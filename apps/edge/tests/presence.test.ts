import { describe, it, expect } from "vitest"
import { env } from "cloudflare:test"
import { putPresence, listPresenceByUser, deletePresence } from "../src/presence.js"

describe("presence", () => {
  it("puts and lists by user prefix", async () => {
    const u = "user-x"
    await putPresence(env.PRESENCE, u, "agent-1", { room: "demo-1", sinceTs: 1, agentName: "A1" })
    await putPresence(env.PRESENCE, u, "agent-2", { room: "demo-2", sinceTs: 2, agentName: "A2" })
    const list = await listPresenceByUser(env.PRESENCE, u)
    expect(list.length).toBe(2)
    expect(list.find(x => x.agentId === "agent-1")?.entry.room).toBe("demo-1")
  })

  it("deletes one agent", async () => {
    const u = "user-y"
    await putPresence(env.PRESENCE, u, "z", { room: "r", sinceTs: 1, agentName: "Z" })
    await deletePresence(env.PRESENCE, u, "z")
    const list = await listPresenceByUser(env.PRESENCE, u)
    expect(list).toHaveLength(0)
  })
})
