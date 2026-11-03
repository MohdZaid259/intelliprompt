import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import type { Db } from "@/server/db/types";
import {
  deleteUser,
  findUserById,
  getSettings,
  unsubscribe,
  updateSettings,
  upsertUserFromClerk,
  type ClerkProfile,
} from "./users";

let db: Db;

const profile = (over: Partial<ClerkProfile> = {}): ClerkProfile => ({
  id: "user_1",
  username: null,
  email: "zaid@example.com",
  firstName: "Mohd",
  lastName: "Zaid",
  imageUrl: "https://img/1.png",
  ...over,
});

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
});

describe("upsertUserFromClerk", () => {
  it("creates a user with a derived username", async () => {
    const user = await upsertUserFromClerk(db, profile());
    expect(user).toMatchObject({ id: "user_1", username: "zaid", name: "Mohd Zaid", plan: "free" });
  });

  it("updates profile fields without touching plan or role", async () => {
    await upsertUserFromClerk(db, profile());
    await db.execute(sql`update users set plan = 'pro', role = 'admin'`);

    const user = await upsertUserFromClerk(db, profile({ firstName: "Zaid", imageUrl: "new.png" }));
    expect(user).toMatchObject({
      name: "Zaid Zaid",
      avatarUrl: "new.png",
      plan: "pro",
      role: "admin",
    });
  });

  it("keeps the derived username when Clerk has none", async () => {
    await upsertUserFromClerk(db, profile());
    const user = await upsertUserFromClerk(db, profile({ email: "other@example.com" }));
    expect(user.username).toBe("zaid");
  });

  it("adds a suffix when the username is taken", async () => {
    await upsertUserFromClerk(db, profile());
    const second = await upsertUserFromClerk(
      db,
      profile({ id: "user_2", email: "zaid@other.com" }),
    );
    expect(second.username).toMatch(/^zaid_[a-z0-9]{1,4}$/);
  });

  it("deletes users", async () => {
    await upsertUserFromClerk(db, profile());
    await deleteUser(db, "user_1");
    expect(await findUserById(db, "user_1")).toBeUndefined();
  });
});

describe("settings", () => {
  it("reads, updates and unsubscribes", async () => {
    await upsertUserFromClerk(db, profile());
    expect(await getSettings(db, "user_1")).toEqual({
      bio: "",
      newsletter: false,
      followUpdates: true,
    });

    await updateSettings(db, "user_1", {
      bio: "Prompt nerd",
      newsletter: true,
      followUpdates: true,
    });
    await unsubscribe(db, "user_1", "follows");
    expect(await getSettings(db, "user_1")).toEqual({
      bio: "Prompt nerd",
      newsletter: true,
      followUpdates: false,
    });
    await unsubscribe(db, "user_1", "newsletter");
    expect((await getSettings(db, "user_1"))?.newsletter).toBe(false);
  });
});
