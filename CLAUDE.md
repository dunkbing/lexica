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

Expo Router file-based navigation with custom bottom nav and bottom sheet modals.

### Bottom Sheet Pattern

Secondary screens (Categories, Practice, Stats, Profile) use `@gorhom/bottom-sheet` for a native sheet experience.

**Key characteristics:**
- Fixed height at 95% of screen
- Pan down to close gesture enabled
- Collapsible header with animated title transition
- Close button (X) in top-left corner

**Title animation behavior:**
- Large title (32px, bold, left-aligned) visible at the top when not scrolled
- When scrolling past 50px, large title fades out
- Small title (FontSizes.lg, centered) fades in at the header
- Uses `react-native-reanimated` for smooth opacity interpolation

**Implementation pattern:**
```typescript
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

const SCROLL_THRESHOLD = 50;

export default function SheetScreen() {
  const scrollY = useSharedValue(0);
  const snapPoints = useMemo(() => ["95%"], []);

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const smallTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [SCROLL_THRESHOLD - 20, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        onClose={() => router.back()}
        backgroundStyle={{ backgroundColor }}
        handleIndicatorStyle={{ backgroundColor: textSecondary }}
      >
        {/* Fixed header with close button and animated small title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="xmark" size={16} />
          </TouchableOpacity>
          <Animated.Text style={[styles.smallTitle, smallTitleStyle]}>
            Title
          </Animated.Text>
          <View style={styles.headerSpacer} />
        </View>

        <BottomSheetScrollView
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Large title that fades out on scroll */}
          <Animated.Text style={[styles.largeTitle, largeTitleStyle]}>
            Title
          </Animated.Text>
          {/* Content */}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
```

**Route configuration in _layout.tsx:**
```typescript
<Stack.Screen
  name="categories"
  options={{
    presentation: "transparentModal",
    animation: "slide_from_bottom",
  }}
/>
```

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
