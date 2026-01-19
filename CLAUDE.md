# English Vocabulary Learning App

An English vocabulary app with swipeable flashcards, spaced repetition, and practice games. UI supports English and Vietnamese.

## Commands

```bash
bun install              # Install dependencies
bun start                # Start dev server (i for iOS, a for Android)
bun run tsc --noEmit     # Type check
bun run lint             # Lint
```

## Code Style

- **Never use `any`** - Use proper types or `unknown` with type guards
- **kebab-case** for file names
- **Use `bun`** instead of npm/node, `bunx` instead of npx

## App Architecture

### Screens

| Screen | Path | Description |
|--------|------|-------------|
| Home | `app/index.tsx` | Swipeable word cards. Right = know, Left = review. Shows daily progress. |
| Categories | `app/categories.tsx` | Browse 32 categories in 8 groups. Filter words by topic/level/test. |
| Practice | `app/practice.tsx` | 4 games: Meaning Match, Fill Gap, Guess Word, Match Synonyms |
| Stats | `app/stats.tsx` | Streak, weekly activity, mastered/learning/new word counts |
| Profile | `app/profile.tsx` | Favorites, saved words, collections, settings shortcuts |
| Word Detail | `app/word/[id].tsx` | Full word info with examples |

### Data Model

**Vocab Database** (`vocab_data.db` - bundled, read-only via Drizzle ORM):

```
words
├── id, term, phonetic
├── pos (noun, verb, adj, adv, prep, conj, pron, interj)
├── definition_en, definition_vi
├── examples: [{en, vi}]  (JSON)
├── synonyms, antonyms     (JSON, nullable)
├── level (beginner, intermediate, advanced)
└── category_id → categories.id

categories
├── id, name_en, name_vi
└── group_id → category_groups.id

category_groups
└── id, name_en, name_vi
```

**Category Groups**: About ourselves, By parts of speech, Culture, Lexicon, The world around us, By level, By test, By origin

**User State** (Zustand + AsyncStorage, not SQLite):

```typescript
// useUserStore - Learning progress
wordStates: Record<wordId, {
  familiarityScore: 0-6,        // SRS level
  lastSeenAt, nextReviewAt,     // Timestamps for spaced repetition
  isFavorite, isSaved: boolean,
  correctCount, incorrectCount,
  collections: string[]
}>
stats: { totalRead, currentStreak, longestStreak, weeklyActivity, totalPractices }
collections: Collection[]
history: string[]               // Last 100 word IDs
gameResults: GameResult[]       // Last 50 game results

// useAppStore - Settings
theme: "light" | "dark" | "system"
language: "vi" | "en"
dailyGoal: 3 | 5 | 7 | 10
soundEnabled, hapticsEnabled, notificationsEnabled

// useWordStore - Vocab data (in-memory)
words, categories, categoryGroups
todayWords: Word[]              // Current session (5-10 shuffled)
selectedCategoryId: string | null
```

### Spaced Repetition (SRS)

Familiarity levels 0-6 with intervals: `[1, 3, 7, 14, 30, 60, 120]` days
- `recordCorrectAnswer()`: Increases score, schedules next review
- `recordIncorrectAnswer()`: Decreases score, schedules review soon

### Key Components

- **WordCard** (`components/word-card.tsx`): Swipeable card with pan gestures. Shows term, phonetic, definition, POS. Actions: info, share, favorite, save.
- **Bottom Sheet Modals**: Categories/Practice/Stats/Profile use `@gorhom/bottom-sheet` at 95% height with collapsing header animation.

### Data Flow

```
App Init (_layout.tsx)
  → initVocabDatabase() (import bundled vocab_data.db)
  → initUserDatabase() (create app_user.db)
  → wordStore.loadWords() via repositories
  → Screens access via useWordStore/useUserStore

Swipe Interaction
  → onSwipeRight/Left
  → userStore.recordCorrectAnswer/recordIncorrectAnswer
  → Updates familiarityScore, nextReviewAt
  → Persisted to AsyncStorage
```

### Database Access

```typescript
// Repositories in db/repositories/
const words = await wordRepository.getWordsByCategory(categoryId);
const categories = await categoryRepository.getCategoriesGrouped(); // Map<Group, Category[]>
await wordRepository.searchWords(term);
```

### i18n

UI in English or Vietnamese. Translations in `i18n/locales/{en,vi}.ts`.
```typescript
const { t } = useTranslation();
t("common.save")  // or t("home.swipeHint")
```

Word content is bilingual: `definition_en`, `definition_vi`, `examples[].en`, `examples[].vi`

### Theming

```typescript
const bg = useThemeColor({}, "background");
```
Colors in `constants/theme.ts`: primary, background, text, success, error, wordCardBg, etc.
