import { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_V1_QUERIES } from './schema';

export const LATEST_VERSION = 3;

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

  if (currentVersion < 2) {
    // 1. Detect if categories_old already exists before starting migration
    const oldTableExists = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='categories_old';"
    );

    if (oldTableExists) {
      throw new Error(
        "Migration aborted: 'categories_old' table already exists from a potentially interrupted previous migration. " +
        "Please inspect the database and drop or rename 'categories_old' manually to proceed."
      );
    }

    // 2. Disable foreign keys and set legacy_alter_table = ON outside the transaction block
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.execAsync('PRAGMA legacy_alter_table = ON;');

    try {
      await db.withTransactionAsync(async () => {
        // Rename categories table to categories_old
        await db.execAsync('ALTER TABLE categories RENAME TO categories_old;');

        // Create new categories table
        await db.execAsync(`
          CREATE TABLE categories (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
          );
        `);

        // Copy all category records
        await db.execAsync(`
          INSERT INTO categories (id, name, created_at, updated_at, deleted_at)
          SELECT id, name, created_at, updated_at, deleted_at FROM categories_old;
        `);

        // Create partial unique index
        await db.execAsync(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_active 
          ON categories (name) 
          WHERE deleted_at IS NULL;
        `);

        // Drop categories_old now that copy succeeded
        await db.execAsync('DROP TABLE categories_old;');

        // Verify foreign key integrity
        const check = await db.getAllAsync<{ table: string; rowid: number; parent: string; fkid: number }>('PRAGMA foreign_key_check;');
        if (check.length > 0) {
          throw new Error('Foreign key violations detected after migration: ' + JSON.stringify(check));
        }

        // Set version to 2
        await db.execAsync('PRAGMA user_version = 2;');
      });
    } finally {
      // Always restore default settings
      await db.execAsync('PRAGMA legacy_alter_table = OFF;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
    }
  }

  if (currentVersion < 3) {
    await db.withTransactionAsync(async () => {
      // Safely add quantity column to borrowed_items table with default value 1
      await db.execAsync('ALTER TABLE borrowed_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;');
      
      // Set version to 3
      await db.execAsync('PRAGMA user_version = 3;');
    });
  }

  console.log(`[Database] Upgrade completed. Schema is now at version ${LATEST_VERSION}`);
}
