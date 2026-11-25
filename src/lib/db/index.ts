import "server-only";
import type { AdminDb } from "./types";
import { devDb } from "./dev";

/**
 * Data access for the admin dashboard. DATA_BACKEND picks the backend:
 *   dev (default)  local development store in .data/dev-store.json
 *   postgres       Postgres on Coolify (not built yet; comes after the dashboard)
 */
export const DATA_BACKEND = process.env.DATA_BACKEND ?? "dev";

function pick(): AdminDb {
  if (DATA_BACKEND === "dev") return devDb;
  throw new Error(`DATA_BACKEND=${DATA_BACKEND} is not available yet. Use DATA_BACKEND=dev until the Postgres backend is built.`);
}

export const db: AdminDb = pick();
export * from "./types";
