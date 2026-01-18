/**
 * Word Crawling Script
 * Fetches English definitions from Free Dictionary API, synonyms from Datamuse,
 * and Vietnamese translations from Gemini API
 * Directly inserts into vocab_data.db
 *
 * Usage:
 *   GEMINI_API_KEY=xxx bun run scripts/crawl-words.ts                    # Build 50 test words
 *   GEMINI_API_KEY=xxx bun run scripts/crawl-words.ts word1 word2 ...   # Crawl specific words
 *   GEMINI_API_KEY=xxx bun run scripts/crawl-words.ts --file words.txt  # Crawl from file
 *
 * Make sure to run build-vocab-db.ts first to create the database structure
 */

import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");
const DB_PATH = join(ROOT_DIR, "src/assets/data/vocab_data.db");

// API endpoints
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";
const DATAMUSE_API = "https://api.datamuse.com/words";
const GEMINI_API =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Get Gemini API key from environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 50 common English words for testing - distributed across categories
const TEST_WORDS = [
  // Emotions (10)
  "happiness",
  "anxiety",
  "excitement",
  "frustration",
  "contentment",
  "melancholy",
  "enthusiasm",
  "serenity",
  "irritation",
  "compassion",
  // Daily Life (10)
  "breakfast",
  "commute",
  "grocery",
  "laundry",
  "relaxation",
  "schedule",
  "routine",
  "household",
  "leisure",
  "errand",
  // Office (10)
  "deadline",
  "collaboration",
  "presentation",
  "productivity",
  "negotiation",
  "strategy",
  "efficiency",
  "promotion",
  "delegation",
  "innovation",
  // Society (10)
  "democracy",
  "equality",
  "diversity",
  "community",
  "citizenship",
  "justice",
  "advocacy",
  "tolerance",
  "solidarity",
  "integrity",
  // Verbs (5)
  "accomplish",
  "persevere",
  "contemplate",
  "illuminate",
  "transform",
  // Adjectives (5)
  "magnificent",
  "resilient",
  "authentic",
  "profound",
  "versatile",
];

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
  ],
  office: [
    "work",
    "job",
    "office",
    "business",
    "meeting",
    "project",
    "team",
    "manager",
    "employee",
    "company",
    "career",
    "professional",
    "deadline",
    "report",
    "email",
    "colleague",
    "boss",
    "salary",
    "corporate",
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
    "society",
    "people",
    "group",
    "civic",
  ],
};

interface DictionaryResponse {
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

// Translate text to Vietnamese using Gemini API
async function translateToVietnamese(
  text: string,
  context?: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `[VI: ${text}]`;
  }

  try {
    const prompt = context
      ? `Translate this English text to Vietnamese. Context: "${context}"\n\nText to translate: "${text}"\n\nProvide only the Vietnamese translation, nothing else.`
      : `Translate this English text to Vietnamese: "${text}"\n\nProvide only the Vietnamese translation, nothing else.`;

    const response = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      console.log(`  ⚠️  Gemini API error: ${response.status}`);
      return `[VI: ${text}]`;
    }

    const data = await response.json();
    const translation = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log({ translation });

    return translation || `[VI: ${text}]`;
  } catch (error) {
    console.log(`  ⚠️  Translation error:`, error);
    return `[VI: ${text}]`;
  }
}

// Fetch definition from Free Dictionary API
async function fetchDefinition(
  word: string,
): Promise<DictionaryResponse | null> {
  try {
    const response = await fetch(
      `${DICTIONARY_API}/${encodeURIComponent(word)}`,
    );
    if (!response.ok) {
      console.log(`  ⚠️  No definition found for "${word}"`);
      return null;
    }
    const data = await response.json();
    return data[0] as DictionaryResponse;
  } catch (error) {
    console.error(`  ❌ Error fetching definition for "${word}":`, error);
    return null;
  }
}

// Fetch synonyms from Datamuse API
async function fetchSynonyms(word: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${DATAMUSE_API}?rel_syn=${encodeURIComponent(word)}&max=10`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: { word: string }) => item.word);
  } catch {
    return [];
  }
}

// Fetch antonyms from Datamuse API
async function fetchAntonyms(word: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${DATAMUSE_API}?rel_ant=${encodeURIComponent(word)}&max=5`,
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((item: { word: string }) => item.word);
  } catch {
    return [];
  }
}

// Auto-categorize word based on definition and part of speech
function categorizeWord(definition: string, word: string, pos: string): string {
  const text = `${word} ${definition}`.toLowerCase();

  // Check POS-based categories first
  if (pos === "verb") return "verbs";
  if (pos === "adj") return "adjectives";
  if (pos === "noun") return "nouns";

  let bestMatch = { category: "daily_life", score: 0 };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }

  return bestMatch.category;
}

// Generate unique ID
function generateId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Map part of speech to our format
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

// Determine word level based on word frequency/complexity
function determineLevel(word: string, definition: string): string {
  const simpleWords = [
    "breakfast",
    "happiness",
    "routine",
    "schedule",
    "community",
  ];
  const advancedWords = [
    "melancholy",
    "persevere",
    "contemplate",
    "solidarity",
    "advocacy",
  ];

  if (simpleWords.includes(word) || word.length <= 6) return "beginner";
  if (advancedWords.includes(word) || definition.length > 100)
    return "advanced";
  return "intermediate";
}

// Crawl a single word and insert into database
async function crawlWord(
  word: string,
  db: Database,
  existingTerms: Set<string>,
): Promise<boolean> {
  console.log(`\n📖 Crawling "${word}"...`);

  if (existingTerms.has(word.toLowerCase())) {
    console.log(`  ⏭️  "${word}" already exists, skipping`);
    return false;
  }

  // Fetch definition
  const dictData = await fetchDefinition(word);
  if (!dictData) return false;

  // Get phonetic
  const phonetic =
    dictData.phonetic || dictData.phonetics?.find((p) => p.text)?.text || "";

  // Get audio URL
  const audioUrl = dictData.phonetics?.find((p) => p.audio)?.audio || null;

  // Get first meaning
  const firstMeaning = dictData.meanings[0];
  if (!firstMeaning) {
    console.log(`  ⚠️  No meanings found for "${word}"`);
    return false;
  }

  const pos = mapPartOfSpeech(firstMeaning.partOfSpeech);
  const firstDefinition = firstMeaning.definitions[0];
  const definition_en = firstDefinition.definition;

  // Get example
  const example_en =
    firstDefinition.example ||
    firstMeaning.definitions.find((d) => d.example)?.example ||
    `The ${word} was evident in the situation.`;

  // Fetch synonyms and antonyms in parallel
  const [synonymsFromApi, antonymsFromApi] = await Promise.all([
    fetchSynonyms(word),
    fetchAntonyms(word),
  ]);

  // Combine synonyms/antonyms
  const synonyms = [
    ...new Set([
      ...(firstDefinition.synonyms || []),
      ...(firstMeaning.synonyms || []),
      ...synonymsFromApi,
    ]),
  ].slice(0, 6);

  const antonyms = [
    ...new Set([
      ...(firstDefinition.antonyms || []),
      ...(firstMeaning.antonyms || []),
      ...antonymsFromApi,
    ]),
  ].slice(0, 4);

  // Translate to Vietnamese using Gemini
  console.log(`  🔄 Translating to Vietnamese...`);
  const [definition_vi, example_vi] = await Promise.all([
    translateToVietnamese(definition_en, `Definition of "${word}" (${pos})`),
    translateToVietnamese(example_en, `Example sentence using "${word}"`),
  ]);

  // Auto-categorize and determine level
  const categoryId = categorizeWord(definition_en, word, pos);
  const level = determineLevel(word, definition_en);

  // Insert into database
  const wordId = generateId();
  const insertWord = db.prepare(`
    INSERT INTO words (id, term, phonetic, pos, definition_en, definition_vi, examples, synonyms, antonyms, origin, audio_url, level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertWord.run(
    wordId,
    word,
    phonetic,
    pos,
    definition_en,
    definition_vi,
    JSON.stringify([{ en: example_en, vi: example_vi }]),
    synonyms.length > 0 ? JSON.stringify(synonyms) : null,
    antonyms.length > 0 ? JSON.stringify(antonyms) : null,
    null, // origin
    audioUrl,
    level,
  );

  // Insert word-category relationship into junction table
  const insertWordCategory = db.prepare(`
    INSERT INTO word_categories (word_id, category_id) VALUES (?, ?)
  `);
  insertWordCategory.run(wordId, categoryId);

  existingTerms.add(word.toLowerCase());
  console.log(`  ✅ Crawled "${word}" → ${categoryId} (${level})`);

  return true;
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  // Check if database exists
  if (!existsSync(DB_PATH)) {
    console.error("❌ Database not found. Run build-vocab-db.ts first:");
    console.error("   bun run scripts/build-vocab-db.ts");
    process.exit(1);
  }

  if (!GEMINI_API_KEY) {
    console.log(
      "⚠️  Warning: GEMINI_API_KEY not set. Vietnamese translations will be placeholders.",
    );
    console.log(
      "   Set it with: GEMINI_API_KEY=your_key bun run scripts/crawl-words.ts\n",
    );
  }

  // Open database
  const db = new Database(DB_PATH);

  // Get existing words
  const existingWords = db.query("SELECT term FROM words").all() as {
    term: string;
  }[];
  const existingTerms = new Set(existingWords.map((w) => w.term.toLowerCase()));

  console.log(`📊 Existing words in database: ${existingTerms.size}\n`);

  let wordsToFetch: string[] = [];

  // Parse arguments
  if (args.length === 0) {
    // Default: build 50 test words
    console.log("🔤 Word Crawler - Building 50 test words\n");
    wordsToFetch = TEST_WORDS.filter(
      (w) => !existingTerms.has(w.toLowerCase()),
    );
    console.log(
      `📊 ${wordsToFetch.length} new words to crawl (${TEST_WORDS.length - wordsToFetch.length} already exist)\n`,
    );
  } else if (args[0] === "--file" && args[1]) {
    // File mode
    const filePath = args[1];
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    wordsToFetch = readFileSync(filePath, "utf-8")
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !existingTerms.has(w));
    console.log(
      `📁 Loaded ${wordsToFetch.length} new words from ${filePath}\n`,
    );
  } else {
    // Direct words
    wordsToFetch = args
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !existingTerms.has(w));
    console.log(`🔤 Crawling ${wordsToFetch.length} words\n`);
  }

  if (wordsToFetch.length === 0) {
    console.log("📭 No new words to crawl");
    db.close();
    return;
  }

  let successCount = 0;
  let failCount = 0;

  console.log("🚀 Starting crawl...\n");

  for (let i = 0; i < wordsToFetch.length; i++) {
    const word = wordsToFetch[i];
    console.log(`[${i + 1}/${wordsToFetch.length}]`);

    // Rate limiting - be nice to APIs
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const success = await crawlWord(word, db, existingTerms);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Get final stats
  const totalWords = (
    db.query("SELECT COUNT(*) as count FROM words").get() as { count: number }
  ).count;
  const categoryStats = db
    .query(
      `
    SELECT c.name_en, COUNT(wc.word_id) as count
    FROM categories c
    LEFT JOIN word_categories wc ON wc.category_id = c.id
    GROUP BY c.id
    HAVING count > 0
    ORDER BY count DESC
  `,
    )
    .all() as { name_en: string; count: number }[];

  db.close();

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Successfully added ${successCount} words`);
  if (failCount > 0) console.log(`⚠️  Failed to crawl ${failCount} words`);
  console.log(`📊 Total words in database: ${totalWords}`);

  if (categoryStats.length > 0) {
    console.log(`\n📂 Words by category:`);
    for (const { name_en, count } of categoryStats) {
      console.log(`   ${name_en}: ${count}`);
    }
  }
}

main().catch(console.error);
