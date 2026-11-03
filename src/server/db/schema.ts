import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const visibilityEnum = pgEnum("visibility", ["private", "public"]);
export const versionSourceEnum = pgEnum("version_source", [
  "manual",
  "enhanced",
  "restored",
  "fork",
]);
export const runStatusEnum = pgEnum("run_status", ["ok", "error"]);
export const paymentStatusEnum = pgEnum("payment_status", ["created", "paid", "failed"]);

// id is the Clerk user id
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull().default(""),
  email: text("email").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  bio: text("bio").notNull().default(""),
  role: roleEnum("role").notNull().default("user"),
  plan: planEnum("plan").notNull().default("free"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  newsletter: boolean("newsletter").notNull().default(false),
  // emails when someone you follow publishes (unsubscribe link in every email)
  followUpdates: boolean("follow_updates").notNull().default(true),
  streakCurrent: integer("streak_current").notNull().default(0),
  streakBest: integer("streak_best").notNull().default(0),
  lastActiveDay: date("last_active_day"),
  createdAt: createdAt(),
});

export const prompts = pgTable(
  "prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    visibility: visibilityEnum("visibility").notNull().default("private"),
    bestVersionId: uuid("best_version_id").references((): AnyPgColumn => versions.id, {
      onDelete: "set null",
    }),
    forkedFromId: uuid("forked_from_id").references((): AnyPgColumn => prompts.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("prompts_owner_idx").on(t.ownerId),
    index("prompts_public_feed_idx").on(t.visibility, t.publishedAt),
    index("prompts_tags_idx").using("gin", t.tags),
  ],
);

// Versions are immutable: edits always insert a new row.
export const versions = pgTable(
  "versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    content: text("content").notNull(),
    note: text("note").notNull().default(""),
    source: versionSourceEnum("source").notNull().default("manual"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("versions_prompt_number_idx").on(t.promptId, t.number)],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modelId: text("model_id").notNull(),
    temperature: real("temperature").notNull(),
    maxTokens: integer("max_tokens").notNull(),
    status: runStatusEnum("status").notNull(),
    output: text("output").notNull().default(""),
    error: text("error"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
    latencyMs: integer("latency_ms").notNull().default(0),
    isBest: boolean("is_best").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("runs_version_idx").on(t.versionId),
    // at most one best run per version
    uniqueIndex("runs_one_best_per_version_idx")
      .on(t.versionId)
      .where(sql`${t.isBest}`),
  ],
);

export const likes = pgTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.promptId] }),
    index("likes_prompt_idx").on(t.promptId),
  ],
);

export const saves = pgTable(
  "saves",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.promptId] }),
    index("saves_prompt_idx").on(t.promptId),
  ],
);

// Every share is counted (not unique per user); anonymous shares have no user.
export const shares = pgTable(
  "shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    channel: text("channel").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("shares_prompt_idx").on(t.promptId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("comments_prompt_idx").on(t.promptId, t.createdAt),
    check("comments_body_length", sql`char_length(${t.body}) between 1 and 1000`),
  ],
);

export const commentLikes = pgTable(
  "comment_likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })],
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followeeId: text("followee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    index("follows_followee_idx").on(t.followeeId),
    check("follows_not_self", sql`${t.followerId} <> ${t.followeeId}`),
  ],
);

export const usageDaily = pgTable(
  "usage_daily",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    runs: integer("runs").notNull().default(0),
    enhances: integer("enhances").notNull().default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 6 }).notNull().default("0"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // kept when a user deletes their account (refunds, disputes, tax records)
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    planKey: text("plan_key").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    status: paymentStatusEnum("status").notNull().default("created"),
    createdAt: createdAt(),
  },
  (t) => [index("payments_user_idx").on(t.userId)],
);

export const promptsRelations = relations(prompts, ({ many }) => ({
  versions: many(versions),
}));

export const versionsRelations = relations(versions, ({ one }) => ({
  prompt: one(prompts, { fields: [versions.promptId], references: [prompts.id] }),
}));
