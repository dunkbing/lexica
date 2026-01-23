/**
 * Import words from curated topic-based word lists
 * Source: https://github.com/imsky/wordlists
 *
 * This script:
 * 1. Reads word lists organized by topic/category
 * 2. Looks up each word in avdict for Vietnamese translation
 * 3. Fetches English data from Free Dictionary API
 * 4. Inserts into vocab_data.db with the correct category
 *
 * Usage:
 *   bun run scripts/import-curated.ts                    # Import all categories
 *   bun run scripts/import-curated.ts emotions food      # Import specific categories
 *   bun run scripts/import-curated.ts --dry-run          # Preview without importing
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");
const VOCAB_DB_PATH = join(ROOT_DIR, "src/assets/data/vocab_data.db");
const AVDICT_DB_PATH = join(ROOT_DIR, "scripts/data/dict_hh.db");
const WORDLISTS_DIR = join(ROOT_DIR, "scripts/data/wordlists");
const MAPPING_FILE = join(WORDLISTS_DIR, "category-mapping.json");

// API endpoints
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";
const DATAMUSE_API = "https://api.datamuse.com/words";

// Rate limiting
const API_DELAY_MS = 300;

interface CategoryMapping {
  category: string;
  files: string[];
  description: string;
}

interface MappingConfig {
  description: string;
  mappings: CategoryMapping[];
}

interface AvdictEntry {
  word: string;
  html: string;
  description: string;
  pronounce: string | null;
}

interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

/**
 * Parse Vietnamese definition from avdict
 */
function parseVietnameseDefinition(entry: AvdictEntry): string {
  if (entry.description && entry.description.trim()) {
    let def = entry.description
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    const parts = def.split(/[;،]/);
    if (parts[0] && parts[0].length > 2) {
      def = parts[0].trim();
    }

    if (def.length > 200) {
      def = def.substring(0, 200) + "...";
    }

    return def;
  }

  if (entry.html) {
    const text = entry.html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const firstLine = text.split("\n")[0] || text.substring(0, 100);
    return firstLine.trim();
  }

  return "";
}

/**
 * Fetch English definition from Free Dictionary API
 */
async function fetchEnglishDefinition(
  word: string
): Promise<DictionaryApiResponse | null> {
  try {
    const response = await fetch(
      `${DICTIONARY_API}/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data[0] as DictionaryApiResponse;
  } catch {
    return null;
  }
}

/**
 * Fetch synonyms from Datamuse API
 */
async function fetchSynonyms(word: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${DATAMUSE_API}?rel_syn=${encodeURIComponent(word)}&max=6`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: { word: string }) => item.word);
  } catch {
    return [];
  }
}

/**
 * Map part of speech to our format
 */
function mapPartOfSpeech(pos: string): string {
  const mapping: Record<string, string> = {
    noun: "noun",
    verb: "verb",
    adjective: "adj",
    adverb: "adv",
    preposition: "prep",
    conjunction: "conj",
    pronoun: "pron",
    interjection: "interj",
  };
  return mapping[pos.toLowerCase()] || "noun";
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Load word list from file
 */
function loadWordList(filePath: string): string[] {
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return [];
  }
  return readFileSync(filePath, "utf-8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w && w.length > 1 && /^[a-z]+$/.test(w));
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const categoryFilters = args.filter((a) => !a.startsWith("--"));

  console.log("📚 Curated Word Lists Import\n");

  // Check databases exist
  if (!existsSync(AVDICT_DB_PATH)) {
    console.error("❌ AVDict database not found. Run:");
    console.error(
      '   curl -L -o scripts/data/dict_hh.db "https://github.com/yenthanh132/avdict-database-sqlite-converter/raw/master/dict_hh.db"'
    );
    process.exit(1);
  }

  if (!existsSync(VOCAB_DB_PATH)) {
    console.error("❌ Vocab database not found. Run:");
    console.error("   bun run scripts/build-vocab-db.ts");
    process.exit(1);
  }

  if (!existsSync(MAPPING_FILE)) {
    console.error("❌ Category mapping not found:", MAPPING_FILE);
    process.exit(1);
  }

  // Load mapping configuration
  const mappingConfig: MappingConfig = JSON.parse(
    readFileSync(MAPPING_FILE, "utf-8")
  );

  // Filter categories if specified
  let mappings = mappingConfig.mappings;
  if (categoryFilters.length > 0) {
    mappings = mappings.filter((m) => categoryFilters.includes(m.category));
    if (mappings.length === 0) {
      console.error("❌ No matching categories found for:", categoryFilters);
      console.log(
        "Available:",
        mappingConfig.mappings.map((m) => m.category).join(", ")
      );
      process.exit(1);
    }
  }

  // Open databases
  const avdictDb = new Database(AVDICT_DB_PATH, { readonly: true });
  const vocabDb = dryRun ? null : new Database(VOCAB_DB_PATH);

  // Get existing words
  const existingWords = vocabDb
    ? (vocabDb.query("SELECT term FROM words").all() as { term: string }[])
    : [];
  const existingTerms = new Set(existingWords.map((w) => w.term.toLowerCase()));

  // Build avdict lookup (word -> entry)
  console.log("📖 Loading AVDict entries...");
  const avdictEntries = avdictDb
    .query("SELECT word, html, description, pronounce FROM av")
    .all() as AvdictEntry[];
  const avdictMap = new Map<string, AvdictEntry>();
  for (const entry of avdictEntries) {
    avdictMap.set(entry.word.toLowerCase().trim(), entry);
  }
  console.log(`   Loaded ${avdictMap.size} entries\n`);

  // Process each category
  const stats = {
    total: 0,
    found: 0,
    imported: 0,
    skipped: 0,
    notInAvdict: 0,
  };

  const wordsToImport: Array<{
    word: string;
    category: string;
    avEntry: AvdictEntry;
  }> = [];

  console.log("📋 Scanning word lists...\n");

  for (const mapping of mappings) {
    console.log(`📂 ${mapping.category}: ${mapping.description}`);

    for (const file of mapping.files) {
      const filePath = join(WORDLISTS_DIR, file);
      const words = loadWordList(filePath);

      let fileFound = 0;
      let fileNotFound = 0;

      for (const word of words) {
        stats.total++;

        if (existingTerms.has(word)) {
          stats.skipped++;
          continue;
        }

        const avEntry = avdictMap.get(word);
        if (avEntry) {
          fileFound++;
          stats.found++;
          wordsToImport.push({ word, category: mapping.category, avEntry });
        } else {
          fileNotFound++;
          stats.notInAvdict++;
        }
      }

      console.log(
        `   ${file}: ${words.length} words → ${fileFound} found, ${fileNotFound} not in avdict`
      );
    }
    console.log();
  }

  console.log("═".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Total words scanned: ${stats.total}`);
  console.log(`   Found in AVDict: ${stats.found}`);
  console.log(`   Already in database: ${stats.skipped}`);
  console.log(`   Not in AVDict: ${stats.notInAvdict}`);
  console.log(`   Words to import: ${wordsToImport.length}`);

  if (dryRun) {
    console.log("\n🔍 Dry run - no changes made");
    console.log("\nWords that would be imported:");
    for (const { word, category } of wordsToImport.slice(0, 20)) {
      console.log(`   ${word} → ${category}`);
    }
    if (wordsToImport.length > 20) {
      console.log(`   ... and ${wordsToImport.length - 20} more`);
    }
    avdictDb.close();
    return;
  }

  if (wordsToImport.length === 0) {
    console.log("\n✅ No new words to import!");
    avdictDb.close();
    vocabDb?.close();
    return;
  }

  // Import words
  console.log(`\n🚀 Importing ${wordsToImport.length} words...\n`);

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < wordsToImport.length; i++) {
    const { word, category, avEntry } = wordsToImport[i];
    const progress = `[${i + 1}/${wordsToImport.length}]`;

    process.stdout.write(`${progress} ${word} → ${category}...`);

    // Parse Vietnamese from avdict
    const definitionVi = parseVietnameseDefinition(avEntry);
    if (!definitionVi) {
      process.stdout.write(" ❌ no Vietnamese\n");
      failCount++;
      continue;
    }

    let phonetic = avEntry.pronounce?.replace(/^\/|\/$/g, "").trim() || "";

    // Fetch English data
    const englishData = await fetchEnglishDefinition(word);

    let definitionEn = "";
    let pos = "noun";
    let exampleEn = "";
    let audioUrl: string | null = null;
    let synonyms: string[] = [];

    if (englishData) {
      if (!phonetic) {
        phonetic =
          englishData.phonetic ||
          englishData.phonetics?.find((p) => p.text)?.text ||
          "";
      }
      audioUrl = englishData.phonetics?.find((p) => p.audio)?.audio || null;

      const firstMeaning = englishData.meanings[0];
      if (firstMeaning) {
        pos = mapPartOfSpeech(firstMeaning.partOfSpeech);
        const firstDef = firstMeaning.definitions[0];
        definitionEn = firstDef?.definition || "";
        exampleEn =
          firstDef?.example ||
          firstMeaning.definitions.find((d) => d.example)?.example ||
          "";
        synonyms = [
          ...new Set([
            ...(firstDef?.synonyms || []),
            ...(firstMeaning.synonyms || []),
          ]),
        ].slice(0, 6);
      }
    }

    if (!definitionEn) {
      definitionEn = `Definition of ${word}`;
    }

    if (synonyms.length === 0) {
      synonyms = await fetchSynonyms(word);
    }

    if (!exampleEn) {
      exampleEn = `The word "${word}" is commonly used in English.`;
    }

    // Determine level based on word length/complexity
    const level =
      word.length <= 5 ? "beginner" : word.length >= 9 ? "advanced" : "intermediate";

    // Insert into database
    try {
      const wordId = generateId();

      vocabDb!
        .prepare(
          `
        INSERT INTO words (id, term, phonetic, pos, definition_en, definition_vi, examples, synonyms, antonyms, origin, audio_url, level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          wordId,
          word,
          phonetic || "",
          pos,
          definitionEn,
          definitionVi,
          JSON.stringify([{ en: exampleEn, vi: "" }]),
          synonyms.length > 0 ? JSON.stringify(synonyms) : null,
          null,
          null,
          audioUrl,
          level
        );

      vocabDb!
        .prepare(`INSERT INTO word_categories (word_id, category_id) VALUES (?, ?)`)
        .run(wordId, category);

      existingTerms.add(word);
      successCount++;
      process.stdout.write(" ✅\n");
    } catch (error) {
      process.stdout.write(` ❌ ${error}\n`);
      failCount++;
    }

    // Rate limiting
    if (i < wordsToImport.length - 1) {
      await sleep(API_DELAY_MS);
    }

    // Progress report
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n📊 Progress: ${i + 1}/${wordsToImport.length} (${elapsed}s)\n`);
    }
  }

  // Final stats
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalWords = vocabDb
    ? (vocabDb.query("SELECT COUNT(*) as count FROM words").get() as { count: number })
        .count
    : 0;

  const categoryStats = vocabDb
    ? (vocabDb
        .query(
          `
    SELECT c.name_en, COUNT(wc.word_id) as count
    FROM categories c
    LEFT JOIN word_categories wc ON wc.category_id = c.id
    GROUP BY c.id
    HAVING count > 0
    ORDER BY count DESC
  `
        )
        .all() as { name_en: string; count: number }[])
    : [];

  avdictDb.close();
  vocabDb?.close();

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Import complete in ${totalTime}s`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`\n📊 Total words in database: ${totalWords}`);

  if (categoryStats.length > 0) {
    console.log(`\n📂 Words by category:`);
    for (const { name_en, count } of categoryStats) {
      console.log(`   ${name_en}: ${count}`);
    }
  }
}

main().catch(console.error);
