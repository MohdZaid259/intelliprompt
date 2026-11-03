import { eq, sql } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PASSES } from "@/config/plans";
import { createTestDb } from "@/server/db/test-db";
import { payments, users } from "@/server/db/schema";
import type { Db } from "@/server/db/types";
import { fulfillPayment, listPayments, markPaymentFailed, recordOrder } from "./billing";

let db: Db;
const DAY = 86_400_000;

beforeAll(async () => {
  db = await createTestDb();
}, 60_000);

beforeEach(async () => {
  await db.execute(sql`truncate users cascade`);
  await db.insert(users).values([
    { id: "u1", username: "u1", email: "u1@x.com" },
    { id: "u2", username: "u2", email: "u2@x.com" },
  ]);
});

const userRow = async (id = "u1") => (await db.select().from(users).where(eq(users.id, id)))[0];

describe("fulfillPayment", () => {
  it("activates Pro for the pass length", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    const result = await fulfillPayment(db, {
      orderId: "order_1",
      paymentId: "pay_1",
      userId: "u1",
      amountPaise: PASSES.pro_month.amountPaise,
    });

    expect(result.status).toBe("fulfilled");
    const u = await userRow();
    expect(u.plan).toBe("pro");
    const days = (u.planExpiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
  });

  it("is idempotent: a second call (webhook after browser) changes nothing", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    const first = (await userRow()).planExpiresAt;

    const again = await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    expect(again.status).toBe("already_paid");
    expect((await userRow()).planExpiresAt).toEqual(first);
  });

  it("extends from the current expiry when buying again", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await recordOrder(db, { userId: "u1", orderId: "order_2", passKey: "pro_year" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    await fulfillPayment(db, { orderId: "order_2", paymentId: "pay_2" });

    const days = ((await userRow()).planExpiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(394.9);
    expect(days).toBeLessThan(395.1);
  });

  it("starts from today if Pro already expired", async () => {
    await db
      .update(users)
      .set({ plan: "pro", planExpiresAt: new Date(Date.now() - 100 * DAY) })
      .where(eq(users.id, "u1"));
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    const days = ((await userRow()).planExpiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeGreaterThan(29.9);
  });

  it("refuses another user's order and wrong amounts", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    expect(
      (await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1", userId: "u2" })).status,
    ).toBe("not_found");
    expect(
      (await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1", amountPaise: 100 }))
        .status,
    ).toBe("amount_mismatch");
    expect((await userRow("u1")).plan).toBe("free");
    expect((await userRow("u2")).plan).toBe("free");
  });

  it("refuses to reuse one payment for a second order", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await recordOrder(db, { userId: "u1", orderId: "order_2", passKey: "pro_year" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    await expect(fulfillPayment(db, { orderId: "order_2", paymentId: "pay_1" })).rejects.toThrow();

    const days = ((await userRow()).planExpiresAt!.getTime() - Date.now()) / DAY;
    expect(days).toBeLessThan(30.1); // the year pass was not granted
  });

  it("returns not_found for unknown orders", async () => {
    expect((await fulfillPayment(db, { orderId: "nope", paymentId: "pay_x" })).status).toBe(
      "not_found",
    );
  });
});

describe("account deletion", () => {
  it("keeps payment records when the user is deleted", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    await db.delete(users).where(eq(users.id, "u1"));

    const [row] = await db.select().from(payments);
    expect(row).toMatchObject({ razorpayOrderId: "order_1", status: "paid", userId: null });
    // and a late webhook for it can't grant anything
    expect((await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" })).status).toBe(
      "not_found",
    );
  });
});

describe("payment history", () => {
  it("lists the user's payments with status", async () => {
    await recordOrder(db, { userId: "u1", orderId: "order_1", passKey: "pro_month" });
    await recordOrder(db, { userId: "u1", orderId: "order_2", passKey: "pro_year" });
    await fulfillPayment(db, { orderId: "order_1", paymentId: "pay_1" });
    await markPaymentFailed(db, "order_2");
    await markPaymentFailed(db, "order_1"); // paid orders are never marked failed

    const list = await listPayments(db, "u1");
    expect(list.map((p) => [p.planKey, p.status]).sort()).toEqual([
      ["pro_month", "paid"],
      ["pro_year", "failed"],
    ]);
    expect(await listPayments(db, "u2")).toEqual([]);
  });
});
