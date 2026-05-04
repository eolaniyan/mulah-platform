# Mobile App Testing & QA

## What & Why
With all 17 screens built, the mobile app needs a full testing pass to catch TypeScript errors, broken imports, missing props, navigation flow issues, and API integration problems. This ensures the app is actually runnable in Expo Go and that all screens connect correctly to the backend.

## Done looks like
- The app boots in Expo Go without crashes on the GetStarted screen
- Authentication flow (GetStarted → Home) works end-to-end with Replit Auth
- Subscription Hub tab navigation: Dashboard, Add Subscription, USW, Virtual Cards, Family, Calendar, Concierge all load without errors
- Finance Hub tab navigation: Cashflow, Insights, Analytics all load without errors
- IRIS AI chat screen is reachable from Home and sends/receives messages
- Profile screen loads user data correctly
- All API calls use correct endpoint paths matching the web app's Express routes
- TypeScript compiles with no errors (`tsc --noEmit` passes)
- No unresolved import errors or missing module references

## Out of scope
- End-to-end automated testing (manual validation only)
- Performance profiling or production bundle optimization
- Real payment processing (Stripe) flows within the mobile app

## Tasks
1. **TypeScript audit** — Run the TypeScript compiler on the mobile project and resolve all type errors, missing imports, and incorrect prop types across all screens and shared files.

2. **API endpoint alignment** — Audit every API call in `api.ts` against the web app's Express routes (`server/routes.ts`) to confirm all paths, HTTP methods, and request/response shapes match.

3. **Navigation flow fixes** — Walk through every navigation action (tab switches, stack pushes, back navigation) in AppNavigator.tsx and fix any broken routes, missing screen registrations, or incorrect param types.

4. **Screen-level fixes** — For each of the 14 screens, fix any runtime-obvious issues: missing required props, broken state initialization, incorrect hook usage, or render errors.

5. **AuthContext + API integration** — Validate that the authentication context correctly handles the Replit Auth OAuth flow, token storage via SecureStore, and the 401 interceptor logout behavior.

## Relevant files
- `mobile/src/lib/api.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/navigation/AppNavigator.tsx`
- `mobile/src/screens/HomeScreen.tsx`
- `mobile/src/screens/GetStartedScreen.tsx`
- `mobile/src/screens/SubscriptionDashboard.tsx`
- `mobile/src/screens/AddSubscriptionScreen.tsx`
- `mobile/src/screens/USWScreen.tsx`
- `mobile/src/screens/VirtualCardsScreen.tsx`
- `mobile/src/screens/FamilyScreen.tsx`
- `mobile/src/screens/CalendarScreen.tsx`
- `mobile/src/screens/ConciergeScreen.tsx`
- `mobile/src/screens/CashflowScreen.tsx`
- `mobile/src/screens/InsightsScreen.tsx`
- `mobile/src/screens/AnalyticsScreen.tsx`
- `mobile/src/screens/ProfileScreen.tsx`
- `mobile/src/screens/IRISScreen.tsx`
- `mobile/src/lib/theme.ts`
- `mobile/src/types/index.ts`
- `mobile/tsconfig.json`
- `server/routes.ts`
