/**
 * Fast local preview: builds the site in production mode (optimised, like the live site) and starts it
 * on http://localhost:3005, still using the dashboard's development store (.data/dev-store.json).
 *   npm run preview            build + start
 *   npm run preview -- --no-build   start the last build again
 * The dev server (npm run dev) can keep running; the preview builds into .next-preview.
 */
import { spawn } from "node:child_process";

const env = { ...process.env, LOCAL_PREVIEW: "1", NEXT_DIST_DIR: ".next-preview" };
const run = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn("npx", ["next", ...args], { stdio: "inherit", env, shell: process.platform === "win32" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`next ${args[0]} exited with ${code}`))));
  });

try {
  if (!process.argv.includes("--no-build")) await run(["build"]);
  console.log("\n  Fast preview: http://localhost:3005  (dashboard: http://localhost:3005/admin)\n");
  await run(["start", "-p", "3005"]);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
