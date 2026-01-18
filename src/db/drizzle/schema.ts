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
});

// Junction table for many-to-many word-category relationship
export const wordCategories = sqliteTable("word_categories", {
  wordId: text("word_id")
    .notNull()
    .references(() => words.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
});

// Type inference helpers
export type CategoryGroupRow = typeof categoryGroups.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type WordRow = typeof words.$inferSelect;
export type WordCategoryRow = typeof wordCategories.$inferSelect;
export type NewCategoryGroup = typeof categoryGroups.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
export type NewWord = typeof words.$inferInsert;

// Insert default category groups and categories
export const categoryGroupsData = [
  { id: "about_ourselves", name_en: "About ourselves", name_vi: "Về bản thân" },
  { id: "by_pos", name_en: "By parts of speech", name_vi: "Theo từ loại" },
  { id: "culture", name_en: "Culture", name_vi: "Văn hóa" },
  { id: "lexicon", name_en: "Lexicon", name_vi: "Từ vựng" },
  {
    id: "world_around",
    name_en: "The world around us",
    name_vi: "Thế giới xung quanh",
  },
  { id: "by_level", name_en: "By level", name_vi: "Theo cấp độ" },
  { id: "by_test", name_en: "By test", name_vi: "Theo bài thi" },
  { id: "by_origin", name_en: "By origin", name_vi: "Theo nguồn gốc" },
];

export const categoriesData = [
  // About ourselves
  {
    id: "emotions",
    groupId: "about_ourselves",
    name_en: "Emotions",
    name_vi: "Cảm xúc",
  },
  {
    id: "human_body",
    groupId: "about_ourselves",
    name_en: "Human body",
    name_vi: "Cơ thể người",
  },
  {
    id: "people",
    groupId: "about_ourselves",
    name_en: "People",
    name_vi: "Con người",
  },
  // By parts of speech
  { id: "verbs", groupId: "by_pos", name_en: "Verbs", name_vi: "Động từ" },
  { id: "nouns", groupId: "by_pos", name_en: "Nouns", name_vi: "Danh từ" },
  {
    id: "adjectives",
    groupId: "by_pos",
    name_en: "Adjectives",
    name_vi: "Tính từ",
  },
  // Culture
  { id: "society", groupId: "culture", name_en: "Society", name_vi: "Xã hội" },
  {
    id: "literature",
    groupId: "culture",
    name_en: "Literature",
    name_vi: "Văn học",
  },
  { id: "art", groupId: "culture", name_en: "Art", name_vi: "Nghệ thuật" },
  { id: "music", groupId: "culture", name_en: "Music", name_vi: "Âm nhạc" },
  { id: "food", groupId: "culture", name_en: "Food", name_vi: "Ẩm thực" },
  { id: "history", groupId: "culture", name_en: "History", name_vi: "Lịch sử" },
  // Lexicon
  {
    id: "beautiful_words",
    groupId: "lexicon",
    name_en: "Beautiful words",
    name_vi: "Từ đẹp",
  },
  { id: "slang", groupId: "lexicon", name_en: "Slang", name_vi: "Tiếng lóng" },
  {
    id: "expressions",
    groupId: "lexicon",
    name_en: "Expressions",
    name_vi: "Thành ngữ",
  },
  {
    id: "office",
    groupId: "lexicon",
    name_en: "Office language",
    name_vi: "Ngôn ngữ văn phòng",
  },
  {
    id: "legal",
    groupId: "lexicon",
    name_en: "Legal terms",
    name_vi: "Thuật ngữ pháp lý",
  },
  { id: "medicine", groupId: "lexicon", name_en: "Medicine", name_vi: "Y học" },
  // The world around us
  {
    id: "daily_life",
    groupId: "world_around",
    name_en: "Daily Life",
    name_vi: "Đời sống",
  },
  {
    id: "business",
    groupId: "world_around",
    name_en: "Business",
    name_vi: "Kinh doanh",
  },
  {
    id: "flora_fauna",
    groupId: "world_around",
    name_en: "Flora and fauna",
    name_vi: "Động thực vật",
  },
  {
    id: "travel",
    groupId: "world_around",
    name_en: "Travel",
    name_vi: "Du lịch",
  },
  {
    id: "science",
    groupId: "world_around",
    name_en: "Science",
    name_vi: "Khoa học",
  },
  {
    id: "technology",
    groupId: "world_around",
    name_en: "Technology",
    name_vi: "Công nghệ",
  },
  {
    id: "environment",
    groupId: "world_around",
    name_en: "Environment",
    name_vi: "Môi trường",
  },
  // By level
  {
    id: "beginner",
    groupId: "by_level",
    name_en: "Beginner",
    name_vi: "Cơ bản",
  },
  {
    id: "intermediate",
    groupId: "by_level",
    name_en: "Intermediate",
    name_vi: "Trung cấp",
  },
  {
    id: "advanced",
    groupId: "by_level",
    name_en: "Advanced",
    name_vi: "Nâng cao",
  },
  // By test
  { id: "gre", groupId: "by_test", name_en: "GRE", name_vi: "GRE" },
  { id: "sat", groupId: "by_test", name_en: "SAT", name_vi: "SAT" },
  { id: "toefl", groupId: "by_test", name_en: "TOEFL", name_vi: "TOEFL" },
  { id: "ielts", groupId: "by_test", name_en: "IELTS", name_vi: "IELTS" },
  // By origin
  {
    id: "latin_root",
    groupId: "by_origin",
    name_en: "Latin root",
    name_vi: "Gốc Latin",
  },
  {
    id: "greek_root",
    groupId: "by_origin",
    name_en: "Greek root",
    name_vi: "Gốc Hy Lạp",
  },
  {
    id: "french_root",
    groupId: "by_origin",
    name_en: "French root",
    name_vi: "Gốc Pháp",
  },
  {
    id: "germanic_root",
    groupId: "by_origin",
    name_en: "Germanic root",
    name_vi: "Gốc Đức",
  },
];
