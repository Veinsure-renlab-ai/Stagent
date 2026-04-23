import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "..", "..", "..", "..",
  "packages", "db-schema", "drizzle",
)

export interface FreshSchema {
  databaseUrl: string
  schemaName: string
  cleanup: () => Promise<void>
}

export async function freshSchema(): Promise<FreshSchema> {
  const baseUrl = process.env.TEST_DATABASE_URL
  if (!baseUrl) throw new Error("TEST_DATABASE_URL not set (did testcontainers setup run?)")
  const schemaName = `test_${crypto.randomBytes(8).toString("hex")}`
  const url = new URL(baseUrl)
  // Apply search_path via connection options
  const adminSql = postgres(baseUrl, { max: 1 })
  await adminSql`CREATE SCHEMA ${adminSql(schemaName)}`
  await adminSql.end()

  const sql = postgres(baseUrl, { max: 2, connection: { search_path: schemaName } })
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder })
  return {
    databaseUrl: baseUrl,
    schemaName,
    cleanup: async () => {
      await sql.end()
      const admin = postgres(baseUrl, { max: 1 })
      await admin`DROP SCHEMA ${admin(schemaName)} CASCADE`
      await admin.end()
    },
  }
}
