import * as SQLite from "expo-sqlite";
import { USER_DATA_SCHEMA } from "./schema";

// Database singleton
let userDb: SQLite.SQLiteDatabase | null = null;

const USER_DATA_DB_NAME = "app_user.db";

// Initialize user database
export const initUserDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (userDb) {
    return userDb;
  }

  userDb = await SQLite.openDatabaseAsync(USER_DATA_DB_NAME);

  // Enable foreign keys
  await userDb.execAsync("PRAGMA foreign_keys = ON;");

  // Create tables
  await userDb.execAsync(USER_DATA_SCHEMA);

  return userDb;
};

// Get user database instance
export const getUserDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!userDb) {
    return initUserDatabase();
  }
  return userDb;
};

// Close database
export const closeDatabase = async (): Promise<void> => {
  if (userDb) {
    await userDb.closeAsync();
    userDb = null;
  }
};

// Transaction helper
export const withTransaction = async <T>(
  fn: (db: SQLite.SQLiteDatabase) => Promise<T>,
): Promise<T> => {
  const db = await getUserDatabase();
  await db.execAsync("BEGIN TRANSACTION");
  try {
    const result = await fn(db);
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
};
