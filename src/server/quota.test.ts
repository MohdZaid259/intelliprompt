import { sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/server/db/test-db";
import { usageDaily, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { getUsage, recordCost, releaseQuota, reserveQuota } from "./quota";

let db: Db;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values({ id: "u1", username: "u1", email: "u1@example.com" });
});

describe("quota", () => {
  it("allows up to the limit and then refuses", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await reserveQuota(db, "u1", "runs", 3));
    expect(results).toEqual([true, true, true, false]);
    expect(await getUsage(db, "u1")).toEqual({ runs: 3, enhances: 0 });
  });

  it("never exceeds the limit under concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => reserveQuota(db, "u1", "runs", 5)),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    expect((await getUsage(db, "u1")).runs).toBe(5);
  });

  it("counts runs and enhances separately and can give a unit back", async () => {
    await reserveQuota(db, "u1", "runs", 5);
    await reserveQuota(db, "u1", "enhances", 5);
    await releaseQuota(db, "u1", "runs");
    await releaseQuota(db, "u1", "runs"); // never goes negative
    expect(await getUsage(db, "u1")).toEqual({ runs: 0, enhances: 1 });
  });

  it("accumulates cost", async () => {
    await reserveQuota(db, "u1", "runs", 5);
    await recordCost(db, "u1", 0.0015);
    await recordCost(db, "u1", 0.0005);
    const [row] = await db.select({ cost: usageDaily.costUsd }).from(usageDaily);
    expect(Number(row.cost)).toBeCloseTo(0.002);
  });
});
