# React Native Expo Boilerplate

A production-ready React Native boilerplate with Expo SDK 54, featuring internationalization, theming, SQLite database, and modern navigation patterns.

## Features

- **Expo SDK 54** with React 19
- **Expo Router** - File-based routing
- **Internationalization** - i18next with English, Japanese, and Vietnamese
- **Theming** - Light/dark mode with system detection
- **SQLite Database** - expo-sqlite for local storage
- **State Management** - Zustand with persistence
- **Responsive Design** - Phone and tablet layouts
- **Push Notifications** - expo-notifications setup
- **UI Components** - Button, Card, ProgressBar, and more

## Getting Started

1. Install dependencies

   ```bash
   bun install
   ```

2. Start the app

   ```bash
   bun start
   ```

3. Press `i` for iOS or `a` for Android

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   └── index.tsx      # Home screen
│   ├── settings.tsx       # Settings modal
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── constants/             # Theme colors
├── db/                    # SQLite database
├── hooks/                 # Custom hooks
├── i18n/                  # Translations
├── lib/                   # Utilities
├── store/                 # Zustand stores
└── types/                 # TypeScript types
```

## Customization

1. Update `app.json` with your app name and identifiers
2. Replace icons in `assets/images/`
3. Modify translations in `i18n/locales/`
4. Customize theme in `constants/theme.ts`

## Commands

```bash
bun install     # Install dependencies
bun start       # Start dev server
bun ios         # Run on iOS
bun android     # Run on Android
bun run lint    # Lint code
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [i18next](https://www.i18next.com/)
- [Zustand](https://github.com/pmndrs/zustand)
