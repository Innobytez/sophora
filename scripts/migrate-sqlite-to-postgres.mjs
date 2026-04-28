import "dotenv/config";

import Database from "better-sqlite3";
import pg from "pg";

if (!process.env.DB_CLIENT) {
  process.env.DB_CLIENT = "postgres";
}

const { Client } = pg;
const { config } = await import("../server/config.js");
const { db: postgresWorkerDb, initializeDatabase } = await import("../server/database-postgres.js");

const FORCE_RESET = process.argv.includes("--force");
const SQLITE_TABLES = [
  "users",
  "artist_profiles",
  "oauth_accounts",
  "sessions",
  "auth_tokens",
  "artist_availability",
  "booking_requests",
  "artist_events"
];

const IMPORT_ORDER = [
  "users",
  "artist_profiles",
  "oauth_accounts",
  "sessions",
  "auth_tokens",
  "artist_availability",
  "booking_requests",
  "artist_events"
];

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function buildInsertSql(tableName, columns) {
  const columnList = columns.map(quoteIdentifier).join(", ");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  return `INSERT INTO ${quoteIdentifier(tableName)} (${columnList}) VALUES (${placeholders})`;
}

function getSqliteRows(sqlite, tableName) {
  return sqlite.prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`).all();
}

async function assertTargetIsReady(client) {
  const counts = {};
  for (const tableName of SQLITE_TABLES) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(tableName)}`);
    counts[tableName] = Number(result.rows[0]?.count || 0);
  }

  const hasData = Object.values(counts).some((count) => count > 0);
  if (!hasData) return;

  if (!FORCE_RESET) {
    const summary = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([tableName, count]) => `${tableName}=${count}`)
      .join(", ");
    throw new Error(`Target Postgres database already has data (${summary}). Re-run with --force to replace it.`);
  }

  await client.query(`
    TRUNCATE TABLE
      oauth_accounts,
      sessions,
      auth_tokens,
      artist_availability,
      artist_events,
      booking_requests,
      artist_profiles,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function insertRows(client, tableName, rows, transformRow = (row) => row) {
  if (!rows.length) return 0;
  const sampleRow = transformRow({ ...rows[0] });
  const columns = Object.keys(sampleRow);
  const insertSql = buildInsertSql(tableName, columns);

  for (const row of rows) {
    const nextRow = transformRow({ ...row });
    await client.query(insertSql, columns.map((column) => nextRow[column] ?? null));
  }

  return rows.length;
}

async function resetSequence(client, tableName) {
  await client.query(`
    SELECT setval(
      pg_get_serial_sequence('${tableName}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(tableName)}), 1),
      EXISTS(SELECT 1 FROM ${quoteIdentifier(tableName)})
    )
  `);
}

const sqlite = new Database(config.dbPath, { readonly: true });
const client = new Client({
  connectionString: config.databaseUrl
});

try {
  await initializeDatabase({ seed: false });
  await client.connect();
  await assertTargetIsReady(client);

  const tableRows = Object.fromEntries(SQLITE_TABLES.map((tableName) => [tableName, getSqliteRows(sqlite, tableName)]));
  const convertedEventLinks = tableRows.booking_requests
    .filter((row) => row.converted_event_id != null)
    .map((row) => ({ id: row.id, convertedEventId: row.converted_event_id }));

  await client.query("BEGIN");

  for (const tableName of IMPORT_ORDER) {
    if (tableName === "booking_requests") {
      await insertRows(client, tableName, tableRows[tableName], (row) => ({
        ...row,
        converted_event_id: null
      }));
      continue;
    }
    await insertRows(client, tableName, tableRows[tableName]);
  }

  for (const link of convertedEventLinks) {
    await client.query(
      "UPDATE booking_requests SET converted_event_id = $1 WHERE id = $2",
      [link.convertedEventId, link.id]
    );
  }

  for (const tableName of SQLITE_TABLES) {
    await resetSequence(client, tableName);
  }

  await client.query("COMMIT");

  console.log("[migrate-sqlite-to-postgres] Imported:");
  for (const tableName of SQLITE_TABLES) {
    console.log(`- ${tableName}: ${tableRows[tableName].length}`);
  }
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback errors during failed setup.
  }
  console.error("[migrate-sqlite-to-postgres] Migration failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  sqlite.close();
  await client.end().catch(() => {});
  postgresWorkerDb.close?.();
}
