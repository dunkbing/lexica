/**
 * Generate word lists for empty categories using Gemini API
 *
 * Usage:
 *   GEMINI_API_KEY=your_key bun run scripts/generate-wordlists.ts
 *   GEMINI_API_KEY=your_key bun run scripts/generate-wordlists.ts --category art
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

const ROOT_DIR = join(import.meta.dir, "..");
const VOCAB_DB_PATH = join(ROOT_DIR, "src/assets/data/vocab_data.db");
const WORDLISTS_DIR = join(ROOT_DIR, "scripts/data/wordlists");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is required");
  process.exit(1);
}

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface CategoryInfo {
  id: string;
  name_en: string;
  group_name: string;
}

/**
 * Get category description for better prompts
 */
function getCategoryDescription(category: CategoryInfo): string {
  const descriptions: Record<string, string> = {
    art: "visual arts, painting, sculpture, artistic techniques and movements",
    beautiful_words: "elegant, poetic, and aesthetically pleasing English words",
    environment: "ecology, climate, nature, pollution, sustainability",
    expressions: "common English idioms, phrases, and expressions",
    human_body: "anatomy, body parts, organs, medical terminology related to the body",
    legal: "law, courts, legal procedures, contracts, rights",
    literature: "literary terms, genres, writing techniques, famous works",
    medicine: "medical conditions, treatments, healthcare, diseases",
    people: "professions, relationships, personality types, social roles",
    slang: "informal English, colloquialisms, modern slang terms",
    sexology: "human sexuality, reproductive health, relationships, anatomy (clinical/educational terms)",
    // Test prep categories
    gre: "advanced vocabulary commonly tested on the GRE exam",
    sat: "vocabulary commonly tested on the SAT exam",
    ielts: "vocabulary useful for the IELTS English proficiency test",
    toefl: "vocabulary useful for the TOEFL English proficiency test",
    // Level categories
    beginner: "basic, everyday English words for beginners (A1-A2 level)",
    intermediate: "intermediate level English vocabulary (B1-B2 level)",
    advanced: "sophisticated, advanced English vocabulary (C1-C2 level)",
    // Origin categories
    french_root: "English words with French origins or roots",
    germanic_root: "English words with Germanic/Old English origins",
    greek_root: "English words with Greek origins or roots",
    latin_root: "English words with Latin origins or roots",
  };

  return descriptions[category.id] || `words related to ${category.name_en.toLowerCase()}`;
}

/**
 * Generate words using Gemini API
 */
async function generateWords(category: CategoryInfo): Promise<string[]> {
  const description = getCategoryDescription(category);

  const prompt = `Generate a list of 80-100 English vocabulary words for the category: "${category.name_en}"

Description: ${description}

Requirements:
- One word per line
- Single words only (no phrases, no compound words with spaces)
- Only common, real English words
- Words should be appropriate for language learning
- Include a mix of common and less common words
- Words should be lowercase
- No numbers, no special characters
- No duplicates

Return ONLY the word list, nothing else. No explanations, no numbering, no bullets.`;

  const response = await fetch(`${GEMINI_API}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse words from response
  const words = text
    .split("\n")
    .map((line: string) => line.trim().toLowerCase())
    .filter((word: string) => {
      // Filter valid words
      return (
        word &&
        word.length > 1 &&
        word.length < 30 &&
        /^[a-z]+$/.test(word) &&
        !word.includes(" ")
      );
    });

  // Remove duplicates
  return [...new Set(words)];
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const categoryFilter = args.find((a) => a.startsWith("--category="))?.split("=")[1];
  const singleCategory = args.includes("--category")
    ? args[args.indexOf("--category") + 1]
    : categoryFilter;

  console.log("🤖 Word List Generator using Gemini\n");

  // Ensure wordlists directory exists
  if (!existsSync(WORDLISTS_DIR)) {
    mkdirSync(WORDLISTS_DIR, { recursive: true });
  }

  // Open database
  const db = new Database(VOCAB_DB_PATH, { readonly: true });

  // Get empty categories
  const emptyCategories = db
    .query(
      `
    SELECT c.id, c.name_en, cg.name_en as group_name
    FROM categories c
    JOIN category_groups cg ON c.group_id = cg.id
    WHERE c.id NOT IN (SELECT DISTINCT category_id FROM word_categories)
    ORDER BY c.name_en
  `
    )
    .all() as CategoryInfo[];

  db.close();

  let categoriesToProcess = emptyCategories;

  if (singleCategory) {
    categoriesToProcess = emptyCategories.filter((c) => c.id === singleCategory);
    if (categoriesToProcess.length === 0) {
      console.error(`❌ Category "${singleCategory}" not found or already has words`);
      console.log("Empty categories:", emptyCategories.map((c) => c.id).join(", "));
      process.exit(1);
    }
  }

  console.log(`📋 Found ${categoriesToProcess.length} categories to generate:\n`);
  for (const cat of categoriesToProcess) {
    console.log(`   - ${cat.id}: ${cat.name_en} (${cat.group_name})`);
  }
  console.log();

  const results: { category: string; file: string; count: number }[] = [];

  for (const category of categoriesToProcess) {
    process.stdout.write(`🔄 Generating ${category.id}...`);

    try {
      const words = await generateWords(category);
      const fileName = `${category.id}.txt`;
      const filePath = join(WORDLISTS_DIR, fileName);

      writeFileSync(filePath, words.join("\n") + "\n");

      results.push({ category: category.id, file: fileName, count: words.length });
      console.log(` ✅ ${words.length} words`);

      // Rate limiting - 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(` ❌ ${error}`);
    }
  }

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log("📊 Summary:\n");

  for (const result of results) {
    console.log(`   ${result.category}: ${result.count} words → ${result.file}`);
  }

  // Generate mapping update
  console.log("\n📝 Add to category-mapping.json:\n");
  const mappings = results.map((r) => ({
    category: r.category,
    files: [r.file],
    description: getCategoryDescription({ id: r.category, name_en: r.category, group_name: "" }),
  }));
  console.log(JSON.stringify(mappings, null, 2));
}

main().catch(console.error);
