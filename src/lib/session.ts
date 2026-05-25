import { cookies } from "next/headers";
import { buildSessionToken, parseSessionToken } from "@/lib/session-token";

const COOKIE_NAME = "session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14;

export async function setSessionUserId(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, await buildSessionToken(userId), {
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
  return parseSessionToken(token);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  jar.delete("userId");
}
