import { z } from "zod"
import { and, eq } from "drizzle-orm"
import { getDb } from "./db/client.js"
import { replays, sessions } from "./db/schema.js"
import { requireSession } from "./auth/middleware.js"
import { parseSessionCookie, hashSessionToken } from "./auth/session.js"

interface Env { DB: D1Database }

const MAX_BYTES = 1024 * 1024

const uploadInput = z.object({
  room: z.string().min(1).max(64),
  room_kind: z.enum(["demo", "private"]),
  started_at: z.number().int(),
  ended_at: z.number().int(),
  hands_count: z.number().int().min(0),
  events: z.array(z.unknown()),
  visibility: z.enum(["private", "public"]).default("private"),
})

function ulid(): string {
  const t = Date.now().toString(36).padStart(10, "0")
  const r = new Uint8Array(10)
  crypto.getRandomValues(r)
  return t + Array.from(r, b => b.toString(36)).join("").slice(0, 16)
}

export async function handleUploadReplay(req: Request, env: Env): Promise<Response> {
  const session = await requireSession(req, env)
  if (session instanceof Response) return session

  let body: unknown
  try { body = await req.json() } catch { return Response.json({ error: "invalid_json" }, { status: 400 }) }
  const parsed = uploadInput.safeParse(body)
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 })

  const eventsJson = JSON.stringify(parsed.data.events)
  const sizeBytes = new TextEncoder().encode(eventsJson).length
  if (sizeBytes > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 })

  const id = ulid()
  await getDb(env).insert(replays).values({
    id,
    userId: session.id,
    room: parsed.data.room,
    roomKind: parsed.data.room_kind,
    visibility: parsed.data.visibility,
    startedAt: parsed.data.started_at,
    endedAt: parsed.data.ended_at,
    handsCount: parsed.data.hands_count,
    eventsJson,
    sizeBytes,
  })
  return Response.json({ id, url: `/replay/${id}` })
}

async function currentUserIdOrNull(req: Request, env: Env): Promise<string | null> {
  const token = parseSessionCookie(req.headers)
  if (!token) return null
  const db = getDb(env)
  const rows = await db.select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions).where(eq(sessions.id, hashSessionToken(token))).limit(1)
  const r = rows[0]
  if (!r || r.expiresAt < Date.now()) return null
  return r.userId
}

export async function handleGetReplay(req: Request, env: Env, id: string): Promise<Response> {
  const db = getDb(env)
  const rows = await db.select().from(replays).where(eq(replays.id, id)).limit(1)
  const r = rows[0]
  if (!r) return Response.json({ error: "not_found" }, { status: 404 })

  if (r.visibility === "private") {
    const uid = await currentUserIdOrNull(req, env)
    if (uid !== r.userId) return Response.json({ error: "not_found" }, { status: 404 })
  }
  return Response.json({
    id: r.id,
    user_id: r.userId,
    room: r.room,
    room_kind: r.roomKind,
    visibility: r.visibility,
    started_at: r.startedAt,
    ended_at: r.endedAt,
    hands_count: r.handsCount,
    events: JSON.parse(r.eventsJson),
    truncated: r.truncated === 1,
  })
}

export async function handleDeleteReplay(req: Request, env: Env, id: string): Promise<Response> {
  const session = await requireSession(req, env)
  if (session instanceof Response) return session
  const db = getDb(env)
  const result = await db.delete(replays)
    .where(and(eq(replays.id, id), eq(replays.userId, session.id)))
    .returning({ id: replays.id })
  if (result.length === 0) return Response.json({ error: "not_found" }, { status: 404 })
  return Response.json({ ok: true })
}
