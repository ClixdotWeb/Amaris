/**
 * Fails if an admin server action or API route doesn't check the admin session.
 *   node scripts/check-admin-guards.mjs     (npm run check:admin)
 * Every exported function in src/app/admin/**\/actions.ts and every handler in src/app/api/admin/**\/route.ts
 * must call requireAdmin() or getAdmin(). The login actions are the only exception.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src", "app");
const ALLOW = new Set(["admin/login/actions.ts:adminLogin", "admin/login/actions.ts:adminLogout"]);

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/[\\/]admin[\\/]/.test(p) && (e.name === "actions.ts" || e.name === "route.ts")) files.push(p);
  }
})(ROOT);

const problems = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf8");
  const re = /export async function (\w+)\s*\([^)]*\)[^{]*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    // body up to the next top-level export (good enough for these files)
    const rest = src.slice(m.index + m[0].length);
    const end = rest.search(/\nexport /);
    const body = end === -1 ? rest : rest.slice(0, end);
    if (ALLOW.has(`${rel}:${name}`)) continue;
    if (!/\b(requireAdmin|getAdmin)\(/.test(body)) problems.push(`${rel}: ${name}() does not call requireAdmin()/getAdmin()`);
  }
}

if (problems.length) {
  console.error("Admin guard check FAILED:\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`Admin guard check passed (${files.length} files).`);
