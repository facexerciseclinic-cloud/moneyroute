// Minimal migration runner for local/dev use.
//
//   node scripts/db-migrate.mjs
//
// Reads SUPABASE_DB_URL from .env.local and applies every *.sql file in
// supabase/migrations (in filename order) inside a single transaction each.
// Tracks applied files in a _migrations table so it is safe to re-run.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  try {
    const text = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
  } catch {
    /* no .env.local — rely on process env */
  }
}

async function main() {
  loadEnvLocal();
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error("Missing SUPABASE_DB_URL");
    process.exit(1);
  }

  const dir = join(root, "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  await client.query(
    `create table if not exists public._migrations (
       name text primary key,
       applied_at timestamptz not null default now()
     )`,
  );

  for (const file of files) {
    const { rowCount } = await client.query(
      "select 1 from public._migrations where name = $1",
      [file],
    );
    if (rowCount > 0) {
      console.log(`skip   ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(dir, file), "utf8");
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public._migrations(name) values ($1)", [
        file,
      ]);
      await client.query("commit");
      console.log(`apply  ${file}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`FAILED ${file}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
