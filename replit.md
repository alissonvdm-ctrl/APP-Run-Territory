# Territory Runner

## Overview
A running/fitness app with territorial conquest mechanics. Users track their runs via GPS, and when they complete a closed loop (running in a circuit), the enclosed area becomes their "territory" displayed on a map. The app combines real-world fitness tracking with gamified territory control.

## Project Architecture

### Frontend (Expo React Native)
- **Routing**: Expo Router with file-based routing, 4 tabs (Run, Map, History, Profile)
- **State**: DataContext for shared data (runs, territories, stats), AsyncStorage for persistence
- **Maps**: react-native-maps (v1.18.0 pinned for Expo Go) with platform-specific files (.web.tsx fallback)
- **Styling**: Dark theme (midnight blue), Outfit font family, teal accent (#00D4AA)
- **Location**: expo-location for GPS tracking during runs

### Backend (Express)
- Minimal Express server on port 5000 serving landing page and API routes
- Not heavily used - app is primarily client-side with AsyncStorage

### Key Files
- `app/(tabs)/index.tsx` - Main run tracking screen with map, GPS, metrics
- `app/(tabs)/territories.tsx` - Dominance map showing claimed territories
- `app/(tabs)/history.tsx` - Past run history list
- `app/(tabs)/profile.tsx` - User stats and profile
- `app/run-detail.tsx` - Detailed view of a single run
- `components/NativeMap.tsx` - Native map components (MapView, Polyline, Polygon)
- `components/NativeMap.web.tsx` - Web fallback for maps
- `contexts/DataContext.tsx` - Shared data context for runs, territories, stats
- `lib/territory.ts` - Territory detection algorithms, distance calculations, formatters
- `lib/storage.ts` - AsyncStorage CRUD operations
- `lib/types.ts` - TypeScript type definitions and constants

### Core Features
1. **GPS Run Tracking** - Real-time location tracking, route drawing on map
2. **Fitness Metrics** - Speed, pace, distance, duration, calories
3. **Territory Claiming** - Closed loop detection → polygon territory
4. **Vehicle Detection** - Speed filter (>7 m/s pauses tracking)
5. **Dominance Map** - All territories displayed with colors
6. **Run History** - Browse past runs with details
7. **Profile Stats** - Aggregate statistics

## Recent Changes
- 2026-02-19: Initial build of Territory Runner app

## User Preferences
- None recorded yet
