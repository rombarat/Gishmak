// Runs on every Vercel build (see "vercel-build" in package.json):
// applies pending migrations, then the non-destructive seed.
// Migrations need a direct (unpooled) connection; Neon and Vercel Postgres expose one.
import { execSync } from "node:child_process";

const direct =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!direct) {
  console.error(
    "\n✖ DATABASE_URL is not set.\n  In Vercel: Storage → Create Database → Neon, connect it to this project, then redeploy.\n",
  );
  process.exit(1);
}
for (const key of ["SESSION_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"]) {
  if (!process.env[key]) {
    console.error(`\n✖ ${key} is not set. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.\n`);
    process.exit(1);
  }
}

const env = { ...process.env, DATABASE_URL: direct };
execSync("npx prisma migrate deploy", { stdio: "inherit", env });
execSync("npx prisma db seed", { stdio: "inherit", env });
