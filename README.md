# NextStory

Swipe-based book discovery app — Group 2. Built with Expo (React Native) and TypeScript.

This is the **Sprint 3 demo build**: a runnable version of the core flow from the Figma wireframes, using a sample catalogue that can now load from Firestore. Firebase Authentication and Firestore user activity are now connected in the code; configure your project using [Firebase setup](docs/firebase-setup.md).

## Firestore book catalogue

The shared Firebase project contains 25 sample books in the singular `book` collection. Set `EXPO_PUBLIC_FIRESTORE_BOOKS_ENABLED=true` (included in `.env.example`) and restart Expo to read them from Firestore. Discover, Search, Saved, and Book details use the same catalogue subscription. Ratings remain sample values.

Set the flag to `false` to use the bundled demo catalogue. See [book collection setup](docs/firestore-books.md) for schema, import, rules, and checks.

## Firestore likes

Set `EXPO_PUBLIC_FIRESTORE_LIKES_ENABLED=true` (included in `.env.example`) to synchronize likes to top-level `like/{userId}_{bookId}`. This flag is independent of the book catalogue flag. Existing swipe-based likes remain visible; new like/skip operations update both paths atomically. See [like collection setup](docs/firestore-likes.md) for access rules, compatibility, and checks.

## Run it

You need [Node.js](https://nodejs.org) 22.13 or newer. Check with `node -v`.

```bash
npm install
npx expo start
```

Then either:

- **On a phone:** install **Expo Go** (App Store / Google Play) and scan the QR code shown in the terminal. The phone and the computer must be on the same Wi-Fi. If the QR code will not connect (common on school Wi-Fi), run `npx expo start --tunnel` instead.
- **iOS simulator / Android emulator:** press `i` or `a` in the terminal.
- **Browser:** press `w`.

## Demo script

1. **Login** — create an email/password account or log in with an existing account after completing Firebase setup.
2. **Discover** — swipe a card right to like it, left to skip it, or use the three buttons. The bookmark saves a book without moving on. *Filters* narrows the deck to one genre.
3. Tap a card to open **Book details**, then **Save to my reading list**.
4. **Saved** tab — the reading list, with *Saved* and *Liked* lists. The ✕ removes a book.
5. **Search** tab — search by title or author, or tap a genre.
6. **Profile** tab — **Clear reading activity** clears everything so the deck starts from the first book again. Do this before presenting.

Likes, saves and skips are synchronized to Firestore per authenticated user. See [Firebase setup](docs/firebase-setup.md) for console steps and the schema.

## What is real and what is a placeholder

| Area | Status in this build |
| --- | --- |
| Swipe deck, like / skip / save | Working |
| Book details, reading list, search, genre filter | Working, on the sample catalogue |
| Book data | 25 books seeded from `src/data/books.seed.json` into Firestore `book`; bundled fallback when the flag is false. Ratings are sample values. |
| Book covers | Loaded from Open Library when online. Offline, a grey placeholder with the title is shown instead. |
| Login / Create account | Firebase email/password authentication; requires console setup. |
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
  store/library.tsx       Saved / liked / skipped state, synchronized to Firestore
```

## Where the next sprints plug in

- **Firebase Authentication:** connected through `src/store/auth.tsx`; finish [console setup](docs/firebase-setup.md).
- **Firestore:** `src/store/library.tsx` synchronizes user activity. Preferences and reviews have reserved schemas/rules for future screens.
- **Google Books API:** import additional metadata into `book` with a trusted administrative tool; screens read through `useCatalogue` in `src/store/catalogue.tsx`.
- **Recommendations:** change how `deck` is ordered in `src/app/(tabs)/discover.tsx`.
- **High-fidelity design:** update `src/constants/theme.ts`.

## Useful commands

```bash
npx expo start          # start the dev server
npm run typecheck       # TypeScript check
npx expo install <pkg>  # add a package at the version that matches this Expo SDK
```
