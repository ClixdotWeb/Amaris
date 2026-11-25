import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db } from "@/lib/db";
import type { AdminAccount } from "@/types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

/**
 * Admin accounts. Passwords are stored as scrypt hashes ("scrypt$<salt>$<hash>", base64).
 * The FIRST admin is created at the first sign-in from DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD in .env.local,
 * and only while no admin exists. After that, admins add each other at /admin/users.
 */
export const MIN_PASSWORD = 10;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const bootstrapEmail = () => (process.env.DEV_ADMIN_EMAIL ?? "").trim().toLowerCase();
const bootstrapPassword = () => process.env.DEV_ADMIN_PASSWORD ?? "";

/** Can anyone sign in at all? (an admin exists, or the first one can be created from .env.local) */
export async function adminLoginConfigured() {
  return (await db.admins.count()) > 0 || (bootstrapEmail() !== "" && bootstrapPassword().length >= 8);
}

/** Creates the first admin from .env.local, only when there are no admins yet. */
async function ensureFirstAdmin() {
  if ((await db.admins.count()) > 0) return;
  if (!bootstrapEmail() || bootstrapPassword().length < 8) return;
  await db.admins.add({
    email: bootstrapEmail(),
    full_name: "Admin",
    password_hash: await hashPassword(bootstrapPassword()),
    created_by: null,
  });
}

// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");

/** The admin if the email + password are right, else null. */
export async function checkAdminCredentials(email: string, password: string): Promise<AdminAccount | null> {
  await ensureFirstAdmin();
  const admin = await db.admins.findByEmail(email);
  const ok = await verifyPassword(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) return null;
  const { password_hash: _secret, ...account } = admin;
  void _secret;
  return account;
}

export async function isAdminEmail(email: string) {
  return (await db.admins.findByEmail(email)) !== null;
}
