# NextStory

Swipe-based book discovery app — Group 2. Built with Expo (React Native) and TypeScript.

This is the **Sprint 3 demo build**: a runnable version of the core flow from the Figma wireframes, using a built-in sample catalogue. There is no backend yet.

## Run it

You need [Node.js](https://nodejs.org) 20.19 or newer (22 LTS recommended). Check with `node -v`.

```bash
npm install
npx expo start
```

Then either:

- **On a phone:** install **Expo Go** (App Store / Google Play) and scan the QR code shown in the terminal. The phone and the computer must be on the same Wi-Fi. If the QR code will not connect (common on school Wi-Fi), run `npx expo start --tunnel` instead.
- **iOS simulator / Android emulator:** press `i` or `a` in the terminal.
- **Browser:** press `w`.

## Demo script

1. **Login** — tap **Log in** (the fields are not checked yet). *Create an account* opens the sign-up screen; the name you type there appears on the Profile tab.
2. **Discover** — swipe a card right to like it, left to skip it, or use the three buttons. The bookmark saves a book without moving on. *Filters* narrows the deck to one genre.
3. Tap a card to open **Book details**, then **Save to my reading list**.
4. **Saved** tab — the reading list, with *Saved* and *Liked* lists. The ✕ removes a book.
5. **Search** tab — search by title or author, or tap a genre.
6. **Profile** tab — **Reset demo data** clears everything so the deck starts from the first book again. Do this before presenting.

Likes, saves and skips are stored on the device, so they survive closing the app.

## What is real and what is a placeholder

| Area | Status in this build |
| --- | --- |
| Swipe deck, like / skip / save | Working |
| Book details, reading list, search, genre filter | Working, on the sample catalogue |
| Book data | 25 real books bundled in `src/data/books.ts`. Ratings are sample values. |
| Book covers | Loaded from Open Library when online. Offline, a grey placeholder with the title is shown instead. |
| Login / Create account | Interface only. Nothing is checked or sent anywhere. |
| Reading preferences, Reviews & ratings, Library availability, "Read" list | Not built yet. Shown as disabled or empty where the wireframes include them. |
| Recommendations | Not built yet. The deck shows the catalogue in a fixed order. |

## Project structure

```
src/
  app/                    Screens (Expo Router: one file = one screen)
    _layout.tsx           Root navigator
    index.tsx             01 Login
    signup.tsx            02 Create account
    (tabs)/
      _layout.tsx         Bottom tab bar
      discover.tsx        04 Main screen — swipe deck
      search.tsx          05 Search
      saved.tsx           07 Saved books
      profile.tsx         10 Profile (minimal)
    book/[id].tsx         06 Book details
  components/
    swipe-deck.tsx        Swipe card, gestures, Skip / Save / Like buttons
    book-cover.tsx        Cover image with placeholder fallback
    book-row.tsx          List card (search results, reading list)
    app-tab-bar.tsx       Wireframe-style tab bar
    ui.tsx                Screen, titles, buttons, text field, option bar
  constants/theme.ts      Colours, spacing, radii (change here for the hi-fi design)
  data/books.ts           Sample catalogue + data access functions
  store/library.tsx       Saved / liked / skipped state, stored on the device
```

## Where the next sprints plug in

- **Firebase Authentication:** replace `handleLogin` in `src/app/index.tsx` and `handleCreate` in `src/app/signup.tsx`.
- **Firestore:** `src/store/library.tsx` is the only file that reads and writes user data. Swap AsyncStorage for Firestore there and keep the same actions (`like`, `skip`, `toggleSaved`, …).
- **Google Books API:** screens only use `getAllBooks`, `getBookById` and `searchBooks` from `src/data/books.ts`. Replace those implementations.
- **Recommendations:** change how `deck` is ordered in `src/app/(tabs)/discover.tsx`.
- **High-fidelity design:** update `src/constants/theme.ts`.

## Useful commands

```bash
npx expo start          # start the dev server
npm run typecheck       # TypeScript check
npx expo install <pkg>  # add a package at the version that matches this Expo SDK
```
