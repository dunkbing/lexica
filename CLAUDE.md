# React Native Expo Boilerplate

## Project Overview

A React Native boilerplate with Expo SDK 54, featuring i18n, theming, SQLite database, and modern navigation patterns.

## Tech Stack

- **Framework**: React Native with Expo (SDK 54)
- **Router**: Expo Router (file-based routing)
- **Database**: expo-sqlite
- **State**: Zustand
- **i18n**: i18next (English, Japanese, Vietnamese)
- **Gestures**: react-native-gesture-handler + react-native-reanimated

## Project Structure

```
app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   └── index.tsx      # Home screen
│   ├── settings.tsx       # Settings modal screen
│   └── _layout.tsx        # Root layout
├── components/
│   ├── ui/                # Button, Card, ProgressBar, etc.
│   ├── navigation/        # Sidebar for tablets
│   ├── themed-text.tsx    # Theme-aware text component
│   └── themed-view.tsx    # Theme-aware view component
├── constants/
│   └── theme.ts           # Color theme definitions
├── db/
│   ├── database.ts        # Database initialization
│   └── schema.ts          # User data schema
├── hooks/
│   ├── use-theme-color.ts # Theme color hook
│   └── use-responsive.ts  # Responsive design hook
├── i18n/
│   ├── index.ts           # i18n setup
│   └── locales/           # Translation files (en, ja, vi)
├── lib/
│   ├── notifications.ts   # Push notifications
│   ├── purchases.ts       # In-app purchases (RevenueCat)
│   └── store-review.ts    # App Store review requests
├── store/
│   ├── appStore.ts        # App settings store
│   └── purchaseStore.ts   # Purchase state store
└── types/                 # TypeScript types
```

## Code Style

- **Never use `any` type** - Always use proper TypeScript types. Use `unknown` if the type is truly unknown, then narrow it with type guards.
- Use kebab-case for file names.
- Always use `bun` instead of node/npm. Use `bunx` instead of npx.

## Key Commands

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on iOS simulator
bun ios

# Run on Android emulator
bun android

# Type check
bun run tsc --noEmit

# Lint
bun run lint
```

## Features

### Theming

Light/dark mode with system detection:

```typescript
import { useThemeColor } from "@/hooks/use-theme-color";

const backgroundColor = useThemeColor({}, "background");
const tintColor = useThemeColor({}, "tint");
```

Theme colors are defined in `constants/theme.ts`.

### Internationalization (i18n)

Multi-language support with i18next:

```typescript
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
// Usage: t("common.save")
```

Translation files are in `i18n/locales/{en,ja,vi}.ts`.

### Database

SQLite database with expo-sqlite:

```typescript
import { initUserDatabase, getUserDatabase } from "@/db/database";

// Initialize database
await initUserDatabase();

// Get database instance
const db = await getUserDatabase();

// Run queries
const result = await db.getAllAsync<YourType>("SELECT * FROM your_table");
```

### State Management

Zustand store with persistence:

```typescript
import { useAppStore } from "@/store";

const { theme, setTheme } = useAppStore();
```

### Responsive Design

Phone/tablet responsive layout:

```typescript
import { useResponsive } from "@/hooks/use-responsive";

const { isTablet, contentPadding, sidebarWidth } = useResponsive();
```

### Navigation

Expo Router file-based navigation with tab bar (phone) or sidebar (tablet).

## Environment

- Bun
- iOS Simulator or Android Emulator
- Expo Go app for physical device testing

## Getting Started

1. Clone this repository
2. Run `bun install`
3. Run `bun start`
4. Press `i` for iOS or `a` for Android

## Customization

1. Update `app.json` with your app name, slug, and identifiers
2. Replace icons and splash screen in `assets/images/`
3. Update translations in `i18n/locales/`
4. Modify theme colors in `constants/theme.ts`
5. Add your own screens in `app/` directory
