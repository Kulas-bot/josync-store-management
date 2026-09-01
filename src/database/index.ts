import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let databaseInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

/**
 * Opens connection to the local SQLite database and runs version migrations.
 * Safe to call multiple times — will no-op if already initialized.
 */
export const initDatabase = async (): Promise<boolean> => {
  if (isInitialized && databaseInstance) {
    return true;
  }

  try {
    console.log('[Database] Opening SQLite database connection...');

    // Open or create the local database file
    const db = await SQLite.openDatabaseAsync('josync.db');

    // Run schema creation + migrations — must complete before we expose the db
    await runMigrations(db);

    // Only assign the instance AFTER migrations fully succeed
    databaseInstance = db;
    isInitialized = true;

    console.log('[Database] SQLite database initialized successfully.');
    return true;
  } catch (error) {
    // Make sure we never expose a broken/partial db instance
    databaseInstance = null;
    isInitialized = false;
    console.error('[Database] Failed to initialize SQLite database:', error);
    return false;
  }
};

/**
 * Returns the initialized database instance.
 * Throws if called before initDatabase() has completed successfully.
 */
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!databaseInstance || !isInitialized) {
    throw new Error('[Database] Database has not been initialized. Call initDatabase first.');
  }
  return databaseInstance;
};
