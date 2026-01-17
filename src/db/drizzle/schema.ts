import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Category groups table
export const categoryGroups = sqliteTable("category_groups", {
  id: text("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameVi: text("name_vi").notNull(),
});

// Categories table
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => categoryGroups.id),
  nameEn: text("name_en").notNull(),
  nameVi: text("name_vi").notNull(),
});

// Words table
export const words = sqliteTable("words", {
  id: text("id").primaryKey(),
  term: text("term").notNull(),
  phonetic: text("phonetic").notNull(),
  pos: text("pos").notNull(), // noun, verb, adj, etc.
  definitionEn: text("definition_en").notNull(),
  definitionVi: text("definition_vi").notNull(),
  examples: text("examples").notNull(), // JSON string: Array<{ en: string, vi: string }>
  synonyms: text("synonyms"), // JSON string, nullable
  antonyms: text("antonyms"), // JSON string, nullable
  origin: text("origin"),
  audioUrl: text("audio_url"),
  level: text("level"), // beginner, intermediate, advanced
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
});

// Type inference helpers
export type CategoryGroupRow = typeof categoryGroups.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type WordRow = typeof words.$inferSelect;
export type NewCategoryGroup = typeof categoryGroups.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
export type NewWord = typeof words.$inferInsert;
