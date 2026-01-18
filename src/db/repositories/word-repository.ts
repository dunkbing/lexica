import { eq, sql } from "drizzle-orm";
import { getVocabDrizzle } from "../database";
import { words, wordCategories, type WordRow } from "../drizzle/schema";
import type { Word, LocalizedText, WordLevel } from "@/types";

// Convert database row to Word type (without categoryIds, will be added separately)
const rowToWordBase = (row: WordRow): Omit<Word, "categoryIds"> => ({
  id: row.id,
  term: row.term,
  phonetic: row.phonetic,
  pos: row.pos as Word["pos"],
  definition: {
    en: row.definitionEn,
    vi: row.definitionVi,
  },
  examples: JSON.parse(row.examples) as LocalizedText[],
  synonyms: row.synonyms ? JSON.parse(row.synonyms) : undefined,
  antonyms: row.antonyms ? JSON.parse(row.antonyms) : undefined,
  origin: row.origin ?? undefined,
  audioUrl: row.audioUrl ?? undefined,
  level: row.level as WordLevel | undefined,
});

// Get category IDs for a list of word IDs
const getCategoryIdsForWords = async (
  db: Awaited<ReturnType<typeof getVocabDrizzle>>,
  wordIds: string[]
): Promise<Map<string, string[]>> => {
  if (wordIds.length === 0) return new Map();

  const rows = await db
    .select()
    .from(wordCategories)
    .where(sql`${wordCategories.wordId} IN (${sql.join(wordIds.map(id => sql`${id}`), sql`, `)})`);

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const existing = map.get(row.wordId) || [];
    existing.push(row.categoryId);
    map.set(row.wordId, existing);
  }
  return map;
};

// Get all words
export const getAllWords = async (): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words);

  const wordIds = rows.map((r) => r.id);
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Get word by ID
export const getWordById = async (id: string): Promise<Word | undefined> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.id, id));
  if (rows.length === 0) return undefined;

  const categoryMap = await getCategoryIdsForWords(db, [id]);
  return {
    ...rowToWordBase(rows[0]),
    categoryIds: categoryMap.get(id) || [],
  };
};

// Get words by category (words that belong to a specific category)
export const getWordsByCategory = async (categoryId: string): Promise<Word[]> => {
  const db = await getVocabDrizzle();

  // Get word IDs for this category
  const wordCategoryRows = await db
    .select({ wordId: wordCategories.wordId })
    .from(wordCategories)
    .where(eq(wordCategories.categoryId, categoryId));

  if (wordCategoryRows.length === 0) return [];

  const wordIds = wordCategoryRows.map((r) => r.wordId);

  // Get the words
  const rows = await db
    .select()
    .from(words)
    .where(sql`${words.id} IN (${sql.join(wordIds.map(id => sql`${id}`), sql`, `)})`);

  // Get all category IDs for these words
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Get random words
export const getRandomWords = async (
  count: number,
  excludeIds: string[] = []
): Promise<Word[]> => {
  const db = await getVocabDrizzle();

  let query = db.select().from(words);

  if (excludeIds.length > 0) {
    query = db
      .select()
      .from(words)
      .where(sql`${words.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`) as typeof query;
  }

  const rows = await query.orderBy(sql`RANDOM()`).limit(count);

  const wordIds = rows.map((r) => r.id);
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Search words by term
export const searchWords = async (searchTerm: string): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db
    .select()
    .from(words)
    .where(sql`${words.term} LIKE ${"%" + searchTerm + "%"}`);

  const wordIds = rows.map((r) => r.id);
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Get total word count
export const getWordCount = async (): Promise<number> => {
  const db = await getVocabDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(words);
  return result[0]?.count ?? 0;
};

// Get word count by category
export const getWordCountByCategory = async (categoryId: string): Promise<number> => {
  const db = await getVocabDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(wordCategories)
    .where(eq(wordCategories.categoryId, categoryId));
  return result[0]?.count ?? 0;
};

// Get words by level
export const getWordsByLevel = async (level: WordLevel): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.level, level));

  const wordIds = rows.map((r) => r.id);
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Get words by part of speech
export const getWordsByPartOfSpeech = async (pos: Word["pos"]): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.pos, pos));

  const wordIds = rows.map((r) => r.id);
  const categoryMap = await getCategoryIdsForWords(db, wordIds);

  return rows.map((row) => ({
    ...rowToWordBase(row),
    categoryIds: categoryMap.get(row.id) || [],
  }));
};

// Get word count by level
export const getWordCountByLevel = async (level: WordLevel): Promise<number> => {
  const db = await getVocabDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(words)
    .where(eq(words.level, level));
  return result[0]?.count ?? 0;
};

// Get word count by part of speech
export const getWordCountByPartOfSpeech = async (pos: Word["pos"]): Promise<number> => {
  const db = await getVocabDrizzle();
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(words)
    .where(eq(words.pos, pos));
  return result[0]?.count ?? 0;
};
