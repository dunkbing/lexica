/**
 * Build script to create vocab_data.db structure
 * Uses Bun's native SQLite support
 * Run with: bun run scripts/build-vocab-db.ts
 */

import { categoriesData, categoryGroupsData } from "@/db/drizzle/schema";
import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");
const OUTPUT_DB_PATH = join(ROOT_DIR, "src/assets/data/vocab_data.db");

// Delete existing database if it exists
if (existsSync(OUTPUT_DB_PATH)) {
  unlinkSync(OUTPUT_DB_PATH);
  console.log("Deleted existing database");
}

// Create new database
const db = new Database(OUTPUT_DB_PATH);

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS category_groups (
    id TEXT PRIMARY KEY NOT NULL,
    name_en TEXT NOT NULL,
    name_vi TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    group_id TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_vi TEXT NOT NULL,
    FOREIGN KEY (group_id) REFERENCES category_groups(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY NOT NULL,
    term TEXT NOT NULL,
    phonetic TEXT NOT NULL,
    pos TEXT NOT NULL,
    definition_en TEXT NOT NULL,
    definition_vi TEXT NOT NULL,
    examples TEXT NOT NULL,
    synonyms TEXT,
    antonyms TEXT,
    origin TEXT,
    audio_url TEXT,
    level TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS word_categories (
    word_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    PRIMARY KEY (word_id, category_id),
    FOREIGN KEY (word_id) REFERENCES words(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )
`);

// Create indexes for better query performance
db.run(
  `CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_id)`,
);
db.run(`CREATE INDEX IF NOT EXISTS idx_word_categories_word ON word_categories(word_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_word_categories_category ON word_categories(category_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_words_term ON words(term)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_words_level ON words(level)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_words_pos ON words(pos)`);

console.log("Tables created:");
console.log("  - category_groups");
console.log("  - categories");
console.log("  - words");
console.log("  - word_categories (junction table)");
console.log("\nIndexes created:");
console.log("  - idx_categories_group");
console.log("  - idx_word_categories_word");
console.log("  - idx_word_categories_category");
console.log("  - idx_words_term");
console.log("  - idx_words_level");
console.log("  - idx_words_pos");

// Insert category groups
const insertGroup = db.prepare(`
  INSERT INTO category_groups (id, name_en, name_vi)
  VALUES (?, ?, ?)
`);

for (const group of categoryGroupsData) {
  insertGroup.run(group.id, group.name_en, group.name_vi);
}

console.log(`\nInserted ${categoryGroupsData.length} category groups`);

// Insert categories
const insertCategory = db.prepare(`
  INSERT INTO categories (id, group_id, name_en, name_vi)
  VALUES (?, ?, ?, ?)
`);

for (const category of categoriesData) {
  insertCategory.run(
    category.id,
    category.groupId,
    category.name_en,
    category.name_vi,
  );
}

console.log(`Inserted ${categoriesData.length} categories`);

// Close database
db.close();

console.log(`\nDatabase created successfully at: ${OUTPUT_DB_PATH}`);
console.log("\nNext step: Run crawl-words.ts to populate words");
console.log("  GEMINI_API_KEY=xxx bun run scripts/crawl-words.ts");
