import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, COOKIE_NAME } from "@/lib/auth/jwt";
import type { User } from "@/types/user";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const { rows } = await query<User & { password_hash: string }>(
    "SELECT id, email, name, created_at, password_hash FROM users WHERE email = $1",
    [email],
  );
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
  }

  const user: User = { id: row.id, email: row.email, name: row.name, created_at: row.created_at };
  const token = await signToken(user.id);
  const res = NextResponse.json({ user });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
