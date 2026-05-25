import { getSessionSecret } from "@/lib/env";

const MAX_AGE_SEC = 60 * 60 * 24 * 14;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(sig));
}

/** Valide un jeton session (Edge + Node via Web Crypto). */
export async function parseSessionToken(token: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, issuedAt, signature] = parts;
  if (!userId || !issuedAt || !signature) return null;

  const payload = `${userId}.${issuedAt}`;
  const expected = await signPayload(payload);

  const a = hexToBytes(signature);
  const b = hexToBytes(expected);
  if (!a || !b || !timingSafeEqual(a, b)) return null;

  const age = Date.now() - Number.parseInt(issuedAt, 10);
  if (Number.isNaN(age) || age > MAX_AGE_SEC * 1000) return null;

  return userId;
}

export async function isValidSessionCookieValue(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  return (await parseSessionToken(token)) !== null;
}

export async function buildSessionToken(userId: string): Promise<string> {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${await signPayload(payload)}`;
}
