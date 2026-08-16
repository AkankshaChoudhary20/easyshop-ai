// `jose` instead of `jsonwebtoken` — works in both the Node runtime (route
// handlers) and the Edge runtime (middleware), unlike `jsonwebtoken`, which
// the original app carried as a dependency but is edge-incompatible.
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const COOKIE_NAME = "token";
const EXPIRY = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  sub: string;
}

export async function signToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
