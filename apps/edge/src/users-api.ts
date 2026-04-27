import { eq } from "drizzle-orm"
import { getDb } from "./db/client.js"
import { users } from "./db/schema.js"
import { listPresenceByUser } from "./presence.js"

interface Env {
  DB: D1Database
  PRESENCE: KVNamespace
}

export async function handleGetUser(_req: Request, env: Env, name: string): Promise<Response> {
  const db = getDb(env)
  const rows = await db.select().from(users).where(eq(users.displayName, name)).limit(1)
  const u = rows[0]
  if (!u) return Response.json({ error: "not_found" }, { status: 404 })

  const presence = await listPresenceByUser(env.PRESENCE, u.id)
  const live = presence.map(p => ({
    agent_id: p.agentId,
    agent_name: p.entry.agentName,
    room: p.entry.room,
    since_ts: p.entry.sinceTs,
  }))

  return Response.json({
    user: {
      id: u.id,
      display_name: u.displayName,
      avatar_url: u.avatarUrl,
      bio: u.bio,
      created_at: u.createdAt,
    },
    live,
  })
}
