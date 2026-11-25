/**
 * Signed admin session cookie. Uses Web Crypto so it works both in middleware and on the server.
 * Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256 signature), keyed by ADMIN_SESSION_SECRET.
 */
export const ADMIN_COOKIE = "amaris_admin";
export const ADMIN_SESSION_HOURS = 12;

export type AdminSession = { email: string; exp: number };

const enc = new TextEncoder();

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

export const sessionConfigured = () => secret() !== null;

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function key(s: string) {
  return crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSessionToken(email: string): Promise<string> {
  const s = secret();
  if (!s) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
  const payload: AdminSession = { email, exp: Date.now() + ADMIN_SESSION_HOURS * 3_600_000 };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(s), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

/** The session if the token is genuine and not expired, else null. */
export async function verifySessionToken(token: string | undefined): Promise<AdminSession | null> {
  const s = secret();
  if (!s || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(s), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as AdminSession;
    if (typeof payload.email !== "string" || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
