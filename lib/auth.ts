const encoder = new TextEncoder();

export const SESSION_COOKIE = "tb_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return (
    process.env.ADMIN_SECRET ||
    `${process.env.ADMIN_PASSWORD ?? ""}::terminal-blog-session-secret`
  );
}

export function isAuthEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const signature = await hmacHex(String(expires));
  return `${expires}.${signature}`;
}

export async function isValidSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const [expiresStr, signature] = token.split(".");
  if (!expiresStr || !signature) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = await hmacHex(expiresStr);
  return timingSafeEqual(signature, expected);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

/** When no password is configured, the admin area is intentionally open (dev). */
export async function isAuthenticated(cookieValue: string | undefined): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  return isValidSessionToken(cookieValue);
}
