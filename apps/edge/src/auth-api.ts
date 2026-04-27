import { z } from "zod"
import { eq } from "drizzle-orm"
import { getDb } from "./db/client.js"
import { users, sessions } from "./db/schema.js"
import { hashPassword, verifyPassword } from "./auth/password.js"
import {
  generateSessionToken,
  hashSessionToken,
  serializeSessionCookie,
  clearSessionCookie,
  parseSessionCookie,
  SESSION_TTL_MS,
} from "./auth/session.js"

interface Env {
  DB: D1Database
}

const registerInput = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
  display_name: z.string().min(1).max(80),
})

const loginInput = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
})

function ulid(): string {
  const t = Date.now().toString(36).padStart(10, "0")
  const r = new Uint8Array(10)
  crypto.getRandomValues(r)
  return t + Array.from(r, b => b.toString(36)).join("").slice(0, 16)
}

export async function handleRegister(req: Request, env: Env): Promise<Response> {
  const body = await req.json<unknown>()
  const parsed = registerInput.safeParse(body)
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 })
  const { email, password, display_name } = parsed.data

  const db = getDb(env)
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return Response.json({ error: "email_taken" }, { status: 409 })

  const userId = ulid()
  const now = Date.now()
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: await hashPassword(password),
    displayName: display_name,
    createdAt: now,
  })

  const token = generateSessionToken()
  await db.insert(sessions).values({
    id: hashSessionToken(token),
    userId,
    expiresAt: now + SESSION_TTL_MS,
    createdAt: now,
  })

  return new Response(
    JSON.stringify({ user: { id: userId, email, display_name } }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": serializeSessionCookie(token, { maxAgeSec: SESSION_TTL_MS / 1000 }),
      },
    },
  )
}

export async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await req.json<unknown>()
  const parsed = loginInput.safeParse(body)
  if (!parsed.success) return Response.json({ error: "invalid_input" }, { status: 400 })

  const db = getDb(env)
  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1)
  const u = rows[0]
  if (!u) return Response.json({ error: "invalid_credentials" }, { status: 401 })
  const ok = await verifyPassword(parsed.data.password, u.passwordHash)
  if (!ok) return Response.json({ error: "invalid_credentials" }, { status: 401 })

  const now = Date.now()
  const token = generateSessionToken()
  await db.insert(sessions).values({
    id: hashSessionToken(token),
    userId: u.id,
    expiresAt: now + SESSION_TTL_MS,
    createdAt: now,
  })

  return new Response(
    JSON.stringify({ user: { id: u.id, email: u.email, display_name: u.displayName } }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": serializeSessionCookie(token, { maxAgeSec: SESSION_TTL_MS / 1000 }),
      },
    },
  )
}

export async function handleLogout(req: Request, env: Env): Promise<Response> {
  const token = parseSessionCookie(req.headers)
  if (token) {
    const db = getDb(env)
    await db.delete(sessions).where(eq(sessions.id, hashSessionToken(token)))
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  })
}

export async function handleMe(req: Request, env: Env): Promise<Response> {
  const token = parseSessionCookie(req.headers)
  if (!token) return Response.json({ error: "unauthenticated" }, { status: 401 })
  const db = getDb(env)
  const sid = hashSessionToken(token)
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sid))
    .limit(1)
  const r = rows[0]
  if (!r || r.expiresAt < Date.now()) {
    return Response.json({ error: "unauthenticated" }, { status: 401 })
  }
  return Response.json({
    user: {
      id: r.id,
      email: r.email,
      display_name: r.displayName,
      avatar_url: r.avatarUrl,
      bio: r.bio,
    },
  })
}
