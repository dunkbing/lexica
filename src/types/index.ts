// Word data types
export interface LocalizedText {
  en: string;
  vi: string;
}

export type WordLevel = "beginner" | "intermediate" | "advanced";

export interface Word {
  id: string;
  term: string;
  phonetic: string;
  pos: "noun" | "verb" | "adj" | "adv" | "prep" | "conj" | "pron" | "interj";
  definition: LocalizedText;
  examples: LocalizedText[];
  synonyms?: string[];
  antonyms?: string[];
  origin?: string;
  audioUrl?: string;
  level?: WordLevel;
  categoryIds: string[];
}

// User state for each word
export interface UserWordState {
  wordId: string;
  familiarityScore: number; // 0-5, higher = more familiar
  lastSeenAt: number | null; // timestamp
  nextReviewAt: number | null; // timestamp
  isFavorite: boolean;
  isSaved: boolean;
  collections: string[];
  correctCount: number;
  incorrectCount: number;
}

// Category Group
export interface CategoryGroup {
  id: string;
  name_en: string;
  name_vi: string;
}

// Category
export interface Category {
  id: string;
  groupId: string;
  name_vi: string;
  name_en: string;
  wordCount: number;
}

// User settings
export interface Settings {
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  dailyGoal: 3 | 5 | 7 | 10;
  reminderTime: string | null; // HH:mm format
  voiceGender: "male" | "female";
}

// User stats
export interface UserStats {
  totalRead: number;
  totalFavorited: number;
  totalSaved: number;
  totalPractices: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD format
  weeklyActivity: boolean[]; // 7 days, index 0 = today
}

// Collection
export interface Collection {
  id: string;
  name: string;
  wordIds: string[];
  createdAt: number;
}

// Game types
export type GameType =
  | "meaning_match"
  | "fill_gap"
  | "match_synonyms"
  | "guess_word";

export interface GameQuestion {
  word: Word;
  options: string[];
  correctAnswer: string;
  type: GameType;
  sentence?: string; // For fill in the gap
}

export interface GameResult {
  gameType: GameType;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number; // in seconds
  wordsToReview: string[]; // word IDs
  completedAt: number;
}

// SRS intervals in days
export const SRS_INTERVALS = [1, 3, 7, 14, 30, 60, 120];

// Practice session
export interface PracticeSession {
  words: Word[];
  currentIndex: number;
  results: { wordId: string; correct: boolean }[];
  startedAt: number;
}
