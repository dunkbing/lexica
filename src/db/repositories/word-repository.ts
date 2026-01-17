import { eq, sql } from "drizzle-orm";
import { getVocabDrizzle } from "../database";
import { words, type WordRow } from "../drizzle/schema";
import type { Word, LocalizedText, WordLevel } from "@/types";

// Convert database row to Word type
const rowToWord = (row: WordRow): Word => ({
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
  categoryId: row.categoryId,
});

// Get all words
export const getAllWords = async (): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words);
  return rows.map(rowToWord);
};

// Get word by ID
export const getWordById = async (id: string): Promise<Word | undefined> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.id, id));
  return rows.length > 0 ? rowToWord(rows[0]) : undefined;
};

// Get words by category
export const getWordsByCategory = async (categoryId: string): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.categoryId, categoryId));
  return rows.map(rowToWord);
};

// Get random words
export const getRandomWords = async (
  count: number,
  excludeIds: string[] = []
): Promise<Word[]> => {
  const db = await getVocabDrizzle();

  let query = db.select().from(words);

  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => "?").join(",");
    query = db
      .select()
      .from(words)
      .where(sql`${words.id} NOT IN (${sql.raw(placeholders)})`) as typeof query;
  }

  const rows = await query.orderBy(sql`RANDOM()`).limit(count);
  return rows.map(rowToWord);
};

// Search words by term
export const searchWords = async (searchTerm: string): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db
    .select()
    .from(words)
    .where(sql`${words.term} LIKE ${"%" + searchTerm + "%"}`);
  return rows.map(rowToWord);
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
    .from(words)
    .where(eq(words.categoryId, categoryId));
  return result[0]?.count ?? 0;
};

// Get words by level
export const getWordsByLevel = async (level: WordLevel): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.level, level));
  return rows.map(rowToWord);
};

// Get words by part of speech
export const getWordsByPartOfSpeech = async (pos: Word["pos"]): Promise<Word[]> => {
  const db = await getVocabDrizzle();
  const rows = await db.select().from(words).where(eq(words.pos, pos));
  return rows.map(rowToWord);
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
