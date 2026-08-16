import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Product } from "@/types/product";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  const { rows } = await query<Product>("SELECT * FROM products WHERE id = $1", [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }
  return NextResponse.json({ product: rows[0] });
}
