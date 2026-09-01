import { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_V1_QUERIES } from './schema';

export const LATEST_VERSION = 3;

/**
 * Handles database schema creation and migration upgrades.
 *
 * Strategy:
 * - All table/index DDL uses IF NOT EXISTS — safe to re-run on every launch.
 * - A SELECT 1 warm-up fires first to avoid the Android NativeDatabase
 *   NullPointerException that occurs when prepareAsync is called immediately
 *   after openDatabaseAsync.
 * - PRAGMA user_version is set OUTSIDE any transaction (Android requirement).
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Warm up the native Android SQLite connection before using prepared statements
  await db.execAsync('SELECT 1;');

  // Read current schema version via getAllAsync (avoids prepareAsync on cold start)
  const versionRows = await db.getAllAsync<Record<string, number>>('PRAGMA user_version;');
  const currentVersion =
    versionRows.length > 0 ? (Object.values(versionRows[0])[0] ?? 0) : 0;

  console.log(`[Database] Current version: ${currentVersion}, target: ${LATEST_VERSION}`);

  if (currentVersion >= LATEST_VERSION) {
    console.log('[Database] Schema is already up to date.');
    return;
  }

  console.log('[Database] Running schema setup and upgrades...');

  // ── Step 1: Create all tables and indexes (IF NOT EXISTS — idempotent) ──────
  for (const query of SCHEMA_V1_QUERIES) {
    await db.execAsync(query);
  }

  // ── Step 2: Drop leftover temp table from any interrupted migration ──────────
  await db.execAsync('DROP TABLE IF EXISTS categories_old;');

  // ── Step 3: Add quantity column to borrowed_items if not already present ─────
  const tableInfoRows = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(borrowed_items);'
  );
  const hasQuantity = tableInfoRows.some((col) => col.name === 'quantity');
  if (!hasQuantity) {
    await db.execAsync(
      'ALTER TABLE borrowed_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;'
    );
  }

  // ── Step 4: Stamp schema version (must be outside a transaction on Android) ──
  await db.execAsync(`PRAGMA user_version = ${LATEST_VERSION};`);

  console.log(`[Database] Setup complete. Schema now at version ${LATEST_VERSION}.`);
}
