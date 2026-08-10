import { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_V1_QUERIES } from './schema';

export const LATEST_VERSION = 1;

/**
 * Handles database schema creation and future migration upgrades.
 * It reads SQLite's PRAGMA user_version to determine current state,
 * runs missing updates inside a transaction, and sets the version.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Query user_version schema pragma value
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= LATEST_VERSION) {
    console.log(`[Database] Schema is already up to date at version ${currentVersion}`);
    return;
  }

  console.log(`[Database] Upgrading schema from version ${currentVersion} to ${LATEST_VERSION}`);

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      // Execute all base V1 schema creation queries
      for (const query of SCHEMA_V1_QUERIES) {
        await db.execAsync(query);
      }
      // Increment user_version to version 1
      await db.execAsync('PRAGMA user_version = 1;');
    });
  }

  // Future migration hooks would check:
  // if (currentVersion < 2) { ... upgrade to v2 ... }

  console.log(`[Database] Upgrade completed. Schema is now at version ${LATEST_VERSION}`);
}
