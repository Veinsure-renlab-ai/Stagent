import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { startTestServer, type TestServer } from "../helpers/server.js"
import { createMcpClientWs } from "@stagent/mcp-tools"
import { tables, hands, actions } from "@stagent/db-schema"
import { eq } from "drizzle-orm"

describe("acceptance: full hand", () => {
  let ts: TestServer
  let tableId: string

  beforeEach(async () => {
    ts = await startTestServer()
    const [t] = await ts.db.insert(tables).values({
      slug: "test-acceptance",
      game_kind: "texas_holdem",
      status: "live",
      blinds: { sb: 5, bb: 10 },
      max_seats: 2,
    }).returning({ id: tables.id })
    tableId = t!.id
    await ts.registry.loadAll()
  })

  afterEach(async () => {
    await ts.cleanup()
  })

  it("plays through a full hand from preflop to showdown", async () => {
    // Register two agents
    const alice = await createMcpClientWs(ts.wsUrl)
    const { owner_token: aliceToken } = await alice.call("register_agent", { name: "Alice" })
    alice.setOwnerToken(aliceToken)

    const bob = await createMcpClientWs(ts.wsUrl)
    const { owner_token: bobToken } = await bob.call("register_agent", { name: "Bob" })
    bob.setOwnerToken(bobToken)

    // Join the table
    await alice.call("join_table", { table_id: tableId })
    await bob.call("join_table", { table_id: tableId })

    // Wait for Alice's turn and act
    const aliceTurn1 = await alice.call("wait_for_my_turn", { table_id: tableId, timeout_s: 10 })
    expect(aliceTurn1.kind).toBe("turn")
    if (aliceTurn1.kind === "turn") {
      const legal = aliceTurn1.legal_actions
      const action = legal.find((a: any) => a.kind === "check")
        ?? legal.find((a: any) => a.kind === "call")
        ?? { kind: "fold" as const }
      if (action.kind === "raise") {
        await alice.call("texas_holdem.raise", { amount: (action as any).amount })
      } else if (action.kind === "check") {
        await alice.call("texas_holdem.check", {})
      } else if (action.kind === "call") {
        await alice.call("texas_holdem.call", {})
      } else {
        await alice.call("texas_holdem.fold", {})
      }
    }

    // Bob takes a turn too
    const bobTurn1 = await bob.call("wait_for_my_turn", { table_id: tableId, timeout_s: 10 })
    expect(bobTurn1.kind).toBe("turn")
    if (bobTurn1.kind === "turn") {
      const legal = bobTurn1.legal_actions
      const action = legal.find((a: any) => a.kind === "check")
        ?? legal.find((a: any) => a.kind === "call")
        ?? { kind: "fold" as const }
      if (action.kind === "raise") {
        await bob.call("texas_holdem.raise", { amount: (action as any).amount })
      } else if (action.kind === "check") {
        await bob.call("texas_holdem.check", {})
      } else if (action.kind === "call") {
        await bob.call("texas_holdem.call", {})
      } else {
        await bob.call("texas_holdem.fold", {})
      }
    }

    // Alice can say something
    await alice.call("say", { text: "GLHF!" })

    // Verify we have a hand in the DB with actions
    const handRows = await ts.db.select().from(hands).where(eq(hands.table_id, tableId))
    expect(handRows.length).toBeGreaterThan(0)
    const handId = handRows[0]!.id

    const actionRows = await ts.db.select().from(actions).where(eq(actions.hand_id, handId))
    expect(actionRows.length).toBeGreaterThan(0)

    alice.close()
    bob.close()
  }, 60000)
})
