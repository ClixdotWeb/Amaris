/**
 * Preview mode: the site runs on sample data in src/lib/data/mock.ts, with no database.
 * On when USE_MOCK_DATA=true or when no Supabase URL is configured.
 * Login, checkout and admin need the real database and are disabled in preview mode.
 */
export const USE_MOCK = process.env.USE_MOCK_DATA === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;
