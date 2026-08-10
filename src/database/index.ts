import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let databaseInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens connection to the local SQLite database and runs version migrations.
 */
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('[Database] Opening SQLite database connection...');
    
    // Open or create the local database file 'josync.db'
    databaseInstance = await SQLite.openDatabaseAsync('josync.db');

    // Execute schema DDL scripts and check/run schema upgrades
    await runMigrations(databaseInstance);

    console.log('[Database] SQLite database initialized successfully.');
    return true;
  } catch (error) {
    console.error('[Database] Failed to initialize SQLite database:', error);
    return false;
  }
};

/**
 * Returns the initialized database instance.
 * Throws an error if accessed before initDatabase finishes.
 */
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!databaseInstance) {
    throw new Error('[Database] Database has not been initialized. Call initDatabase first.');
  }
  return databaseInstance;
};
