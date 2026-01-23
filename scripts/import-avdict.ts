/**
 * Import English-Vietnamese dictionary from AVDict database
 * Source: https://github.com/yenthanh132/avdict-database-sqlite-converter
 *
 * This script:
 * 1. Reads Vietnamese definitions from avdict (dict_hh.db)
 * 2. Fetches English definitions from Free Dictionary API
 * 3. Inserts into vocab_data.db
 *
 * Usage:
 *   # First, download dict_hh.db to scripts/data/
 *   mkdir -p scripts/data
 *   curl -L -o scripts/data/dict_hh.db "https://github.com/yenthanh132/avdict-database-sqlite-converter/raw/master/dict_hh.db"
 *
 *   # Then run the import
 *   bun run scripts/import-avdict.ts                     # Import all words
 *   bun run scripts/import-avdict.ts --limit 100        # Import first 100 words
 *   bun run scripts/import-avdict.ts --file words.txt   # Import words from file
 *   bun run scripts/import-avdict.ts --common           # Import common words only (NGSL-based)
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");
const VOCAB_DB_PATH = join(ROOT_DIR, "src/assets/data/vocab_data.db");
const AVDICT_DB_PATH = join(ROOT_DIR, "scripts/data/dict_hh.db");

// Free Dictionary API
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";
const DATAMUSE_API = "https://api.datamuse.com/words";

// Rate limiting
const API_DELAY_MS = 300; // 300ms between API calls
const BATCH_SIZE = 50; // Process in batches

// Common English words (subset of NGSL - New General Service List)
// These are high-frequency words most learners should know
const COMMON_WORDS = new Set([
  // Top 500 most common words that are likely in avdict
  "time",
  "year",
  "people",
  "way",
  "day",
  "man",
  "thing",
  "woman",
  "life",
  "child",
  "world",
  "school",
  "state",
  "family",
  "student",
  "group",
  "country",
  "problem",
  "hand",
  "part",
  "place",
  "case",
  "week",
  "company",
  "system",
  "program",
  "question",
  "work",
  "government",
  "number",
  "night",
  "point",
  "home",
  "water",
  "room",
  "mother",
  "area",
  "money",
  "story",
  "fact",
  "month",
  "lot",
  "right",
  "study",
  "book",
  "eye",
  "job",
  "word",
  "business",
  "issue",
  "side",
  "kind",
  "head",
  "house",
  "service",
  "friend",
  "father",
  "power",
  "hour",
  "game",
  "line",
  "end",
  "member",
  "law",
  "car",
  "city",
  "community",
  "name",
  "president",
  "team",
  "minute",
  "idea",
  "kid",
  "body",
  "information",
  "back",
  "parent",
  "face",
  "others",
  "level",
  "office",
  "door",
  "health",
  "person",
  "art",
  "war",
  "history",
  "party",
  "result",
  "change",
  "morning",
  "reason",
  "research",
  "girl",
  "guy",
  "moment",
  "air",
  "teacher",
  "force",
  "education",
  // Emotions & feelings
  "happy",
  "sad",
  "angry",
  "love",
  "hate",
  "fear",
  "hope",
  "joy",
  "pain",
  "peace",
  "anxiety",
  "stress",
  "calm",
  "excited",
  "nervous",
  "proud",
  "shame",
  "guilt",
  "surprise",
  "disgust",
  "trust",
  "doubt",
  "confidence",
  "worry",
  "relief",
  // Actions (verbs)
  "be",
  "have",
  "do",
  "say",
  "go",
  "get",
  "make",
  "know",
  "think",
  "take",
  "see",
  "come",
  "want",
  "look",
  "use",
  "find",
  "give",
  "tell",
  "work",
  "call",
  "try",
  "ask",
  "need",
  "feel",
  "become",
  "leave",
  "put",
  "mean",
  "keep",
  "let",
  "begin",
  "seem",
  "help",
  "show",
  "hear",
  "play",
  "run",
  "move",
  "live",
  "believe",
  "hold",
  "bring",
  "happen",
  "write",
  "provide",
  "sit",
  "stand",
  "lose",
  "pay",
  "meet",
  "include",
  "continue",
  "set",
  "learn",
  "change",
  "lead",
  "understand",
  "watch",
  "follow",
  "stop",
  "create",
  "speak",
  "read",
  "allow",
  "add",
  "spend",
  "grow",
  "open",
  "walk",
  "win",
  "offer",
  "remember",
  "love",
  "consider",
  "appear",
  "buy",
  "wait",
  "serve",
  "die",
  "send",
  "expect",
  "build",
  "stay",
  "fall",
  "cut",
  "reach",
  // Adjectives
  "good",
  "new",
  "first",
  "last",
  "long",
  "great",
  "little",
  "own",
  "other",
  "old",
  "right",
  "big",
  "high",
  "different",
  "small",
  "large",
  "next",
  "early",
  "young",
  "important",
  "few",
  "public",
  "bad",
  "same",
  "able",
  "beautiful",
  "wonderful",
  "difficult",
  "easy",
  "hard",
  "strong",
  "weak",
  "fast",
  "slow",
  "hot",
  "cold",
  "rich",
  "poor",
  "free",
  "full",
  "empty",
  "safe",
  "dangerous",
  "clean",
  "dirty",
  // Daily life
  "food",
  "breakfast",
  "lunch",
  "dinner",
  "water",
  "coffee",
  "tea",
  "bread",
  "rice",
  "meat",
  "fish",
  "fruit",
  "vegetable",
  "milk",
  "sugar",
  "salt",
  "oil",
  "butter",
  "clothes",
  "shirt",
  "pants",
  "dress",
  "shoes",
  "hat",
  "coat",
  "bag",
  "phone",
  "computer",
  "television",
  "radio",
  "camera",
  "clock",
  "watch",
  "key",
  "money",
  // Nature & environment
  "sun",
  "moon",
  "star",
  "sky",
  "cloud",
  "rain",
  "snow",
  "wind",
  "storm",
  "weather",
  "tree",
  "flower",
  "grass",
  "plant",
  "animal",
  "bird",
  "fish",
  "dog",
  "cat",
  "mountain",
  "river",
  "lake",
  "ocean",
  "sea",
  "beach",
  "forest",
  "desert",
  // Body parts
  "head",
  "face",
  "eye",
  "ear",
  "nose",
  "mouth",
  "tooth",
  "tongue",
  "hair",
  "neck",
  "shoulder",
  "arm",
  "hand",
  "finger",
  "chest",
  "stomach",
  "back",
  "leg",
  "foot",
  // Time
  "today",
  "tomorrow",
  "yesterday",
  "morning",
  "afternoon",
  "evening",
  "night",
  "week",
  "month",
  "year",
  "century",
  "moment",
  "minute",
  "hour",
  "second",
  // Abstract concepts
  "truth",
  "reality",
  "freedom",
  "justice",
  "peace",
  "war",
  "democracy",
  "culture",
  "tradition",
  "religion",
  "science",
  "technology",
  "art",
  "music",
  "literature",
  "education",
  "knowledge",
  "wisdom",
  "experience",
  "success",
  "failure",
]);

// Category keywords for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  emotions: [
    "feel",
    "emotion",
    "mood",
    "happy",
    "sad",
    "angry",
    "love",
    "hate",
    "fear",
    "joy",
    "anxiety",
    "stress",
    "calm",
    "excited",
    "nervous",
    "feeling",
    "sentiment",
    "passion",
    "mental",
    "psychological",
    "心情",
    "cảm xúc",
    "tâm trạng",
  ],
  daily_life: [
    "home",
    "house",
    "food",
    "eat",
    "drink",
    "sleep",
    "work",
    "family",
    "cook",
    "clean",
    "shop",
    "travel",
    "morning",
    "evening",
    "routine",
    "daily",
    "everyday",
    "life",
    "living",
    "household",
    "domestic",
    "đời sống",
    "hàng ngày",
  ],
  business: [
    "business",
    "company",
    "market",
    "trade",
    "commerce",
    "economy",
    "finance",
    "profit",
    "investment",
    "entrepreneur",
    "kinh doanh",
    "thương mại",
  ],
  office: [
    "office",
    "meeting",
    "project",
    "team",
    "manager",
    "employee",
    "deadline",
    "report",
    "email",
    "colleague",
    "boss",
    "salary",
    "corporate",
    "văn phòng",
  ],
  society: [
    "social",
    "community",
    "government",
    "politics",
    "law",
    "rights",
    "culture",
    "tradition",
    "public",
    "citizen",
    "vote",
    "democracy",
    "equality",
    "justice",
    "xã hội",
    "cộng đồng",
  ],
  science: [
    "science",
    "scientific",
    "research",
    "experiment",
    "theory",
    "hypothesis",
    "data",
    "analysis",
    "laboratory",
    "khoa học",
    "nghiên cứu",
  ],
  technology: [
    "technology",
    "computer",
    "software",
    "hardware",
    "internet",
    "digital",
    "electronic",
    "device",
    "application",
    "công nghệ",
    "máy tính",
  ],
  travel: [
    "travel",
    "journey",
    "trip",
    "tour",
    "vacation",
    "holiday",
    "destination",
    "airport",
    "hotel",
    "tourist",
    "du lịch",
    "chuyến đi",
  ],
  food: [
    "food",
    "meal",
    "cook",
    "recipe",
    "ingredient",
    "taste",
    "flavor",
    "dish",
    "restaurant",
    "kitchen",
    "ẩm thực",
    "món ăn",
    "nấu ăn",
  ],
  health: [
    "health",
    "medical",
    "doctor",
    "hospital",
    "medicine",
    "disease",
    "symptom",
    "treatment",
    "patient",
    "nurse",
    "sức khỏe",
    "y tế",
  ],
  flora_fauna: [
    "animal",
    "plant",
    "tree",
    "flower",
    "bird",
    "fish",
    "insect",
    "mammal",
    "species",
    "wildlife",
    "nature",
    "động vật",
    "thực vật",
  ],
};

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
 * Parse Vietnamese definition from avdict HTML/description
 * The description field contains the main Vietnamese translation
 * The HTML field contains detailed definitions with markup
 */
function parseVietnameseDefinition(entry: AvdictEntry): string {
  // The description field usually has the main definition
  if (entry.description && entry.description.trim()) {
    // Clean up HTML entities and tags
    let def = entry.description
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // Take first meaningful part (before any semicolon or long explanation)
    const parts = def.split(/[;،]/);
    if (parts[0] && parts[0].length > 2) {
      def = parts[0].trim();
    }

    // Limit length
    if (def.length > 200) {
      def = def.substring(0, 200) + "...";
    }

    return def;
  }

  // Fallback: parse from HTML
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
 * Parse phonetic from avdict
 */
function parsePhonetic(entry: AvdictEntry): string {
  if (entry.pronounce) {
    // Clean up phonetic - remove slashes if present
    return entry.pronounce.replace(/^\/|\/$/g, "").trim();
  }
  return "";
}

/**
 * Fetch English definition from Free Dictionary API
 */
async function fetchEnglishDefinition(
  word: string,
): Promise<DictionaryApiResponse | null> {
  try {
    const response = await fetch(
      `${DICTIONARY_API}/${encodeURIComponent(word.toLowerCase())}`,
    );
    if (!response.ok) {
      return null;
    }
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
      `${DATAMUSE_API}?rel_syn=${encodeURIComponent(word)}&max=6`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: { word: string }) => item.word);
  } catch {
    return [];
  }
}

/**
 * Fetch antonyms from Datamuse API
 */
async function fetchAntonyms(word: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${DATAMUSE_API}?rel_ant=${encodeURIComponent(word)}&max=4`,
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
 * Auto-categorize word based on definition
 */
function categorizeWord(
  word: string,
  definitionEn: string,
  definitionVi: string,
  pos: string,
): string {
  const text = `${word} ${definitionEn} ${definitionVi}`.toLowerCase();

  // Check POS-based categories first
  if (pos === "verb") return "verbs";
  if (pos === "adj") return "adjectives";
  if (pos === "noun") {
    // Try to find a more specific category
    let bestMatch = { category: "nouns", score: 0 };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const score = keywords.filter((kw) => text.includes(kw)).length;
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }

    if (bestMatch.score > 0) {
      return bestMatch.category;
    }
    return "nouns";
  }

  // Default categorization
  let bestMatch = { category: "daily_life", score: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }

  return bestMatch.category;
}

/**
 * Determine word level based on commonality
 */
function determineLevel(word: string): string {
  if (COMMON_WORDS.has(word.toLowerCase())) {
    return "beginner";
  }
  if (word.length <= 6) {
    return "beginner";
  }
  if (word.length >= 10) {
    return "advanced";
  }
  return "intermediate";
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process a single word
 */
async function processWord(
  avEntry: AvdictEntry,
  vocabDb: Database,
  existingTerms: Set<string>,
  stats: { success: number; skipped: number; failed: number },
): Promise<boolean> {
  const word = avEntry.word.toLowerCase().trim();

  // Skip if already exists
  if (existingTerms.has(word)) {
    stats.skipped++;
    return false;
  }

  // Skip invalid entries
  if (!word || word.length < 2 || /[^a-z\-']/.test(word)) {
    stats.skipped++;
    return false;
  }

  // Parse Vietnamese from avdict
  const definitionVi = parseVietnameseDefinition(avEntry);
  if (!definitionVi) {
    stats.failed++;
    return false;
  }

  let phonetic = parsePhonetic(avEntry);

  // Fetch English data from API
  const englishData = await fetchEnglishDefinition(word);

  let definitionEn = "";
  let pos = "noun";
  let exampleEn = "";
  let audioUrl: string | null = null;
  let apiSynonyms: string[] = [];
  let apiAntonyms: string[] = [];

  if (englishData) {
    // Get phonetic from API if not from avdict
    if (!phonetic) {
      phonetic =
        englishData.phonetic ||
        englishData.phonetics?.find((p) => p.text)?.text ||
        "";
    }

    // Get audio URL
    audioUrl = englishData.phonetics?.find((p) => p.audio)?.audio || null;

    // Get first meaning
    const firstMeaning = englishData.meanings[0];
    if (firstMeaning) {
      pos = mapPartOfSpeech(firstMeaning.partOfSpeech);
      const firstDef = firstMeaning.definitions[0];
      definitionEn = firstDef?.definition || "";
      exampleEn =
        firstDef?.example ||
        firstMeaning.definitions.find((d) => d.example)?.example ||
        "";

      // Get synonyms/antonyms from API response
      apiSynonyms = [
        ...new Set([
          ...(firstDef?.synonyms || []),
          ...(firstMeaning.synonyms || []),
        ]),
      ].slice(0, 6);
      apiAntonyms = [
        ...new Set([
          ...(firstDef?.antonyms || []),
          ...(firstMeaning.antonyms || []),
        ]),
      ].slice(0, 4);
    }
  }

  // If no English definition from API, create a basic one
  if (!definitionEn) {
    definitionEn = `Definition of ${word}`;
  }

  // Fetch additional synonyms/antonyms from Datamuse if needed
  if (apiSynonyms.length === 0) {
    apiSynonyms = await fetchSynonyms(word);
  }
  if (apiAntonyms.length === 0) {
    apiAntonyms = await fetchAntonyms(word);
  }

  // Generate example if none
  if (!exampleEn) {
    exampleEn = `The word "${word}" is commonly used in English.`;
  }

  // Auto-categorize and determine level
  const categoryId = categorizeWord(word, definitionEn, definitionVi, pos);
  const level = determineLevel(word);

  // Insert into database
  try {
    const wordId = generateId();

    const insertWord = vocabDb.prepare(`
      INSERT INTO words (id, term, phonetic, pos, definition_en, definition_vi, examples, synonyms, antonyms, origin, audio_url, level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertWord.run(
      wordId,
      word,
      phonetic || "",
      pos,
      definitionEn,
      definitionVi,
      JSON.stringify([{ en: exampleEn, vi: "" }]),
      apiSynonyms.length > 0 ? JSON.stringify(apiSynonyms) : null,
      apiAntonyms.length > 0 ? JSON.stringify(apiAntonyms) : null,
      null,
      audioUrl,
      level,
    );

    // Insert word-category relationship
    const insertWordCategory = vocabDb.prepare(`
      INSERT INTO word_categories (word_id, category_id) VALUES (?, ?)
    `);
    insertWordCategory.run(wordId, categoryId);

    existingTerms.add(word);
    stats.success++;
    return true;
  } catch (error) {
    console.error(`  ❌ Error inserting "${word}":`, error);
    stats.failed++;
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let limit = 0;
  let filterFile = "";
  let commonOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--file" && args[i + 1]) {
      filterFile = args[i + 1];
      i++;
    } else if (args[i] === "--common") {
      commonOnly = true;
    }
  }

  console.log("📚 AVDict Import Script\n");

  // Check if avdict database exists
  if (!existsSync(AVDICT_DB_PATH)) {
    console.error("❌ AVDict database not found at:", AVDICT_DB_PATH);
    console.error("\nPlease download it first:");
    console.error("  mkdir -p scripts/data");
    console.error(
      '  curl -L -o scripts/data/dict_hh.db "https://github.com/yenthanh132/avdict-database-sqlite-converter/raw/master/dict_hh.db"',
    );
    process.exit(1);
  }

  // Check if vocab database exists
  if (!existsSync(VOCAB_DB_PATH)) {
    console.error("❌ Vocab database not found. Run build-vocab-db.ts first:");
    console.error("   bun run scripts/build-vocab-db.ts");
    process.exit(1);
  }

  // Open databases
  const avdictDb = new Database(AVDICT_DB_PATH, { readonly: true });
  const vocabDb = new Database(VOCAB_DB_PATH);

  // Get existing words from vocab database
  const existingWords = vocabDb.query("SELECT term FROM words").all() as {
    term: string;
  }[];
  const existingTerms = new Set(existingWords.map((w) => w.term.toLowerCase()));

  console.log(`📊 Existing words in vocab database: ${existingTerms.size}`);

  // Get filter words if file specified
  let filterWords: Set<string> | null = null;
  if (filterFile) {
    if (!existsSync(filterFile)) {
      console.error(`❌ Filter file not found: ${filterFile}`);
      process.exit(1);
    }
    filterWords = new Set(
      readFileSync(filterFile, "utf-8")
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w),
    );
    console.log(`📁 Filter words loaded: ${filterWords.size}`);
  }

  if (commonOnly) {
    filterWords = COMMON_WORDS;
    console.log(`📁 Using common words filter: ${filterWords.size} words`);
  }

  // Query avdict database
  let query = "SELECT word, html, description, pronounce FROM av";
  if (limit > 0) {
    query += ` LIMIT ${limit}`;
  }

  const avdictEntries = avdictDb.query(query).all() as AvdictEntry[];
  console.log(`📖 AVDict entries loaded: ${avdictEntries.length}`);

  // Filter entries if needed
  let entriesToProcess = avdictEntries;
  if (filterWords) {
    entriesToProcess = avdictEntries.filter((e) =>
      filterWords!.has(e.word.toLowerCase().trim()),
    );
    console.log(`📋 Entries after filter: ${entriesToProcess.length}`);
  }

  // Filter out already existing
  entriesToProcess = entriesToProcess.filter(
    (e) => !existingTerms.has(e.word.toLowerCase().trim()),
  );
  console.log(`📋 New entries to process: ${entriesToProcess.length}`);

  if (entriesToProcess.length === 0) {
    console.log("\n✅ No new words to import!");
    avdictDb.close();
    vocabDb.close();
    return;
  }

  // Process entries
  const stats = { success: 0, skipped: 0, failed: 0 };
  const startTime = Date.now();

  console.log("\n🚀 Starting import...\n");

  for (let i = 0; i < entriesToProcess.length; i++) {
    const entry = entriesToProcess[i];
    const progress = `[${i + 1}/${entriesToProcess.length}]`;

    process.stdout.write(`${progress} Processing "${entry.word}"...`);

    const success = await processWord(entry, vocabDb, existingTerms, stats);

    if (success) {
      process.stdout.write(" ✅\n");
    } else {
      process.stdout.write(" ⏭️\n");
    }

    // Rate limiting
    if (i < entriesToProcess.length - 1) {
      await sleep(API_DELAY_MS);
    }

    // Progress report every batch
    if ((i + 1) % BATCH_SIZE === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = ((i + 1) / parseFloat(elapsed)).toFixed(1);
      console.log(
        `\n📊 Progress: ${i + 1}/${entriesToProcess.length} (${rate} words/sec)\n`,
      );
    }
  }

  // Final stats
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalWords = (
    vocabDb.query("SELECT COUNT(*) as count FROM words").get() as {
      count: number;
    }
  ).count;

  const categoryStats = vocabDb
    .query(
      `
    SELECT c.name_en, COUNT(wc.word_id) as count
    FROM categories c
    LEFT JOIN word_categories wc ON wc.category_id = c.id
    GROUP BY c.id
    HAVING count > 0
    ORDER BY count DESC
    LIMIT 10
  `,
    )
    .all() as { name_en: string; count: number }[];

  // Close databases
  avdictDb.close();
  vocabDb.close();

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Import complete in ${totalTime}s`);
  console.log(`   Success: ${stats.success}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`\n📊 Total words in database: ${totalWords}`);

  if (categoryStats.length > 0) {
    console.log(`\n📂 Top categories:`);
    for (const { name_en, count } of categoryStats) {
      console.log(`   ${name_en}: ${count}`);
    }
  }
}

main().catch(console.error);
