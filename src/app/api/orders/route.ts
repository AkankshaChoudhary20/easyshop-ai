import { NextRequest, NextResponse } from "next/server";
import { query, getPool } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth/session";
import type { Order, OrderItem } from "@/types/order";
import type { Product } from "@/types/product";

// Order history for the logged-in user, items included.
export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const { rows: orders } = await query<Order>(
    "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
    [user.id],
  );
  if (orders.length === 0) return NextResponse.json({ orders: [] });

  const orderIds = orders.map((o) => o.id);
  const { rows: items } = await query<OrderItem & { title: string; image_url: string | null }>(
    `SELECT oi.*, p.title, p.image_url
       FROM order_items oi JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ANY($1::int[])`,
    [orderIds],
  );
  const itemsByOrder = new Map<number, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const withItems = orders.map((o) => ({ ...o, items: itemsByOrder.get(o.id) ?? [] }));
  return NextResponse.json({ orders: withItems });
}

// Checkout: creates an order + order_items from the client-side cart in one
// transaction. Prices are always re-read from the DB — the client only sends
// productId + quantity, never a price, so a tampered cart can't under-charge.
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireAuth(req);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw err;
  }

  const body = await req.json().catch(() => null);
  const validItem = (item: unknown): item is {productId: number; quantity: number} => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as {productId?: unknown; quantity?: unknown};
    return typeof candidate.productId === "number" && Number.isInteger(candidate.productId)
      && candidate.productId > 0 && candidate.productId <= 2147483647
      && typeof candidate.quantity === "number" && Number.isInteger(candidate.quantity)
      && candidate.quantity > 0 && candidate.quantity <= 2147483647;
  };
  if (!Array.isArray(body?.items) || body.items.length === 0 || !body.items.every(validItem)) {
    return NextResponse.json({error: "Every cart item must have a positive integer productId and quantity."}, {status: 400});
  }
  const items: {productId: number; quantity: number}[] = body.items;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productIds = items.map((i) => i.productId);
    const { rows: products } = await client.query<Product>(
      "SELECT * FROM products WHERE id = ANY($1::int[])",
      [productIds],
    );
    const productById = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) throw new Error(`product ${item.productId} not found`);
      total += Number(product.price) * item.quantity;
    }

    const { rows: orderRows } = await client.query<Order>(
      "INSERT INTO orders (user_id, status, total) VALUES ($1, 'pending', $2) RETURNING *",
      [user.id, total],
    );
    const order = orderRows[0];

    for (const item of items) {
      const product = productById.get(item.productId)!;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, product.price],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[orders] checkout error:", err);
    return NextResponse.json({ error: "checkout failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
