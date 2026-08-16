import { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "./jwt";
import { query } from "../db";
import type { User } from "@/types/user";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

/** Reads the session cookie and returns the current user, or null on any failure. */
export async function getCurrentUser(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) return null;

  const { rows } = await query<User>(
    "SELECT id, email, name, created_at FROM users WHERE id = $1",
    [userId],
  );
  return rows[0] ?? null;
}

/** Same as getCurrentUser, but throws AuthError (caught by route handlers -> 401) when unauthenticated. */
export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getCurrentUser(req);
  if (!user) throw new AuthError();
  return user;
}
