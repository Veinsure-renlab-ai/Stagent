import { describe, it, expect } from "vitest"
import { SELF } from "cloudflare:test"
import { SESSION_COOKIE } from "../src/auth/session.js"

const J = { "Content-Type": "application/json" }
const uniq = () => `u-${crypto.randomUUID()}@x.com`

describe("auth-api", () => {
  it("register creates user and returns Set-Cookie", async () => {
    const email = uniq()
    const res = await SELF.fetch("https://edge/api/auth/register", {
      method: "POST",
      headers: J,
      body: JSON.stringify({ email, password: "hunter2", display_name: "Alice" }),
    })
    expect(res.status).toBe(200)
    const setCookie = res.headers.get("Set-Cookie")
    expect(setCookie).toContain(`${SESSION_COOKIE}=`)
    const body = await res.json<{ user: { email: string; display_name: string } }>()
    expect(body.user.email).toBe(email)
    expect(body.user.display_name).toBe("Alice")
  })

  it("register rejects duplicate email", async () => {
    const email = uniq()
    await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "x1y2z3", display_name: "D" }),
    })
    const res = await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "x1y2z3", display_name: "D2" }),
    })
    expect(res.status).toBe(409)
  })

  it("login returns Set-Cookie + me works after", async () => {
    const email = uniq()
    await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "hunter2", display_name: "Bob" }),
    })
    const login = await SELF.fetch("https://edge/api/auth/login", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "hunter2" }),
    })
    expect(login.status).toBe(200)
    const cookie = login.headers.get("Set-Cookie")!
    const sid = cookie.match(/stg_sid=([^;]+)/)![1]!

    const me = await SELF.fetch("https://edge/api/auth/me", {
      headers: { Cookie: `${SESSION_COOKIE}=${sid}` },
    })
    expect(me.status).toBe(200)
    const body = await me.json<{ user: { email: string } }>()
    expect(body.user.email).toBe(email)
  })

  it("login rejects wrong password", async () => {
    const email = uniq()
    await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "right1", display_name: "C" }),
    })
    const res = await SELF.fetch("https://edge/api/auth/login", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "wrong1" }),
    })
    expect(res.status).toBe(401)
  })

  it("me returns 401 without cookie", async () => {
    const res = await SELF.fetch("https://edge/api/auth/me")
    expect(res.status).toBe(401)
  })

  it("logout clears cookie and invalidates session", async () => {
    const email = uniq()
    await SELF.fetch("https://edge/api/auth/register", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "x1y2z3", display_name: "D" }),
    })
    const login = await SELF.fetch("https://edge/api/auth/login", {
      method: "POST", headers: J,
      body: JSON.stringify({ email, password: "x1y2z3" }),
    })
    const sid = login.headers.get("Set-Cookie")!.match(/stg_sid=([^;]+)/)![1]!

    const logout = await SELF.fetch("https://edge/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE}=${sid}` },
    })
    expect(logout.status).toBe(200)
    expect(logout.headers.get("Set-Cookie")).toContain("Max-Age=0")

    const me = await SELF.fetch("https://edge/api/auth/me", {
      headers: { Cookie: `${SESSION_COOKIE}=${sid}` },
    })
    expect(me.status).toBe(401)
  })
})
