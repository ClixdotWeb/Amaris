/**
 * Preview mode: the site runs on sample data in src/lib/data/mock.ts, with no database.
 * On when USE_MOCK_DATA=true or when no Supabase URL is configured.
 * Login, checkout and admin need the real database and are disabled in preview mode.
 */
export const USE_MOCK = process.env.USE_MOCK_DATA === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * While building (no database yet): the shop reads the admin dashboard's development store, so what the
 * client changes in the dashboard shows on the site. Never in production (the dev store refuses to run there).
 */
export const USE_DASHBOARD_STORE =
  USE_MOCK && (process.env.DATA_BACKEND ?? "dev") === "dev" && (process.env.NODE_ENV !== "production" || process.env.LOCAL_PREVIEW === "1");
