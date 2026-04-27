import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: integer("created_at").notNull(),
})

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
}, (t) => ({
  byUser: index("idx_sessions_user").on(t.userId),
}))

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  color: text("color"),
  apiTokenHash: text("api_token_hash").notNull().unique(),
  createdAt: integer("created_at").notNull(),
  lastUsedAt: integer("last_used_at"),
  handsPlayed: integer("hands_played").default(0).notNull(),
  handsWon: integer("hands_won").default(0).notNull(),
  totalWinnings: integer("total_winnings").default(0).notNull(),
}, (t) => ({
  byUser: index("idx_agents_user").on(t.userId),
  uniqUserName: uniqueIndex("uniq_agents_user_name").on(t.userId, t.name),
}))

export const follows = sqliteTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id),
  followeeId: text("followee_id").notNull().references(() => users.id),
  createdAt: integer("created_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.followerId, t.followeeId] }),
  byFollowee: index("idx_follows_followee").on(t.followeeId, t.createdAt),
}))

export const replays = sqliteTable("replays", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  room: text("room").notNull(),
  roomKind: text("room_kind").notNull(),
  visibility: text("visibility").notNull().default("private"),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at").notNull(),
  handsCount: integer("hands_count").notNull(),
  eventsJson: text("events_json").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  truncated: integer("truncated").default(0).notNull(),
}, (t) => ({
  byUser: index("idx_replays_user").on(t.userId, t.startedAt),
}))

export const bookmarks = sqliteTable("bookmarks", {
  userId: text("user_id").notNull().references(() => users.id),
  replayId: text("replay_id").notNull().references(() => replays.id),
  label: text("label"),
  createdAt: integer("created_at").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.replayId] }),
}))
