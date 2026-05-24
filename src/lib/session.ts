import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/env";

const COOKIE_NAME = "session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
}

function buildToken(userId: string): string {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

function parseToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, issuedAt, signature] = parts;
  if (!userId || !issuedAt || !signature) return null;

  const payload = `${userId}.${issuedAt}`;
  const expected = sign(payload);

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const age = Date.now() - Number.parseInt(issuedAt, 10);
  if (Number.isNaN(age) || age > MAX_AGE_SEC * 1000) return null;

  return userId;
}

export async function setSessionUserId(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, buildToken(userId), {
    httpOnly: true,
    path: "/",
    maxAge: MAX_AGE_SEC,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    const legacy = jar.get("userId")?.value;
    return legacy ?? null;
  }
  return parseToken(token);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  jar.delete("userId");
}
