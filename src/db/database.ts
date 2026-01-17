import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { USER_DATA_SCHEMA } from "./schema";
import * as vocabSchema from "./drizzle/schema";

// Database singletons
let userDb: SQLite.SQLiteDatabase | null = null;
let vocabDb: SQLite.SQLiteDatabase | null = null;

const USER_DATA_DB_NAME = "app_user.db";
const VOCAB_DATA_DB_NAME = "vocab_data.db";

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

// Initialize vocab database from bundled asset
export const initVocabDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (vocabDb) {
    return vocabDb;
  }

  // Delete existing database to ensure fresh import from asset
  try {
    await SQLite.deleteDatabaseAsync(VOCAB_DATA_DB_NAME);
    console.log("db_deleted");
  } catch {
    // Database might not exist, that's ok
  }

  // Import the bundled database from assets
  await SQLite.importDatabaseFromAssetAsync(VOCAB_DATA_DB_NAME, {
    assetId: require("@/assets/data/vocab_data.db"),
  });

  vocabDb = await SQLite.openDatabaseAsync(VOCAB_DATA_DB_NAME, {
    useNewConnection: true,
  });

  return vocabDb;
};

// Get user database instance
export const getUserDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!userDb) {
    return initUserDatabase();
  }
  return userDb;
};

// Get vocab database instance
export const getVocabDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!vocabDb) {
    return initVocabDatabase();
  }
  return vocabDb;
};

// Get Drizzle instance for vocab database
export const getVocabDrizzle = async () => {
  const db = await getVocabDatabase();
  return drizzle(db, { schema: vocabSchema });
};

// Close all databases
export const closeDatabase = async (): Promise<void> => {
  if (userDb) {
    await userDb.closeAsync();
    userDb = null;
  }
  if (vocabDb) {
    await vocabDb.closeAsync();
    vocabDb = null;
  }
};

// Transaction helper for user database
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
