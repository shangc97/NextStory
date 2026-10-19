# NextStory

Swipe-based book discovery app by Group 2 (Pilgyu Kim, Hrishikesh Deepak More, Chuhan Shang). Built with Expo (React Native), TypeScript, Firebase Authentication and Cloud Firestore.

You see one book at a time: swipe right to like it, swipe left to skip it, or bookmark it to your reading list.

- **Jira board:** [SCRUM project](https://georgebrown-team-lbx5p4ml.atlassian.net/jira/software/projects/SCRUM/boards/1)
- **Figma wireframes:** [NextStory](https://www.figma.com/design/44u1Lg6rlgpoLCA7mSSMeo/NextStory)

## Project status

Midterm build (Sprint 5, October 2026). Accounts, the swipe deck, reading lists and search run against the shared Firebase project. The book catalogue is a seeded sample of 25 books; the external Books API, recommendations, and library availability are not built yet.

| Sprint | Focus | Status |
| --- | --- | --- |
| 1 | Project planning and proposal | Done |
| 2 | UX design and Figma wireframes | Done |
| 3 | Screen implementation with sample data | Done, except Reading Preferences (see below) |
| 4 | Firebase and live data | Firebase, sign-in and per-user lists done; Books API in progress (SCRUM-43) |
| 5 | Midterm presentation | In progress |
| 6–12 | Personalization, lists, AI assist, community, testing, final delivery | Planned |

## Features

| Feature | Status | Jira |
| --- | --- | --- |
| Sign up, log in, log out (email and password) | Working, Firebase Authentication | SCRUM-37, SCRUM-42 |
| Swipe deck: like, skip, save | Working | SCRUM-39 |
| Saved and Liked lists, kept per user between sessions | Working, Cloud Firestore | SCRUM-44, SCRUM-45 |
| Book catalogue | 25 sample books in Firestore `book`; ratings are sample values | SCRUM-43 (Books API in progress) |
| Book details, Search, genre filter | Working on the catalogue | SCRUM-38 |
| Reviews & ratings | Screen built: rating and review input, sample reviews. **Post review is disabled** and nothing is saved yet | SCRUM-40 |
| Profile | Name, email, activity counts, clear activity, log out | SCRUM-37 |
| Reading Preferences | Not built. "Edit reading preferences" on Profile is disabled | SCRUM-37, SCRUM-13 |
| Library availability | Not built. The button on Book details is disabled | SCRUM-41 |
| "Read" list | Shown as an empty list | SCRUM-15 |
| Personalized recommendations | Not built. The deck uses a fixed order | SCRUM-14 |

Book covers load from Open Library when online. Offline, a grey placeholder with the title is shown.

## Getting started

### 1. Requirements

- [Node.js](https://nodejs.org) 22.13 or newer (`node -v` to check).
- Access to the shared Firebase project `nextstory-1555a`. Ask the project maintainer to add your Google account under Project settings → Users and permissions.
- To run on a phone: the latest **Expo Go** from the App Store or Google Play. The project uses Expo SDK 57.

### 2. Install

```bash
git clone https://github.com/shangc97/NextStory.git
cd NextStory
npm install
```

Run `npm install` again whenever a `git pull` changes `package.json`.

### 3. Configure Firebase

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the six `EXPO_PUBLIC_FIREBASE_*` values from the Firebase console: Project settings → General → Your apps → the Web app's `firebaseConfig`. Write them as `KEY=value`, with no spaces or quotes. Leave the two `EXPO_PUBLIC_FIRESTORE_*_ENABLED` flags set to `true`.

- Put the values in `.env.local`, not `.env.example`. Expo does not read `.env.example`, and it is committed to Git.
- `.env.local` is ignored by Git. Every team member keeps their own copy.

Full details: [Firebase setup](docs/firebase-setup.md).

### 4. Run

```bash
npx expo start --clear
```

Use `--clear` the first time and after any change to `.env.local`; the values are built into the app.

- **iPhone (Expo Go):** with SDK 57, Expo Go only opens a project when the terminal and the Expo Go app are signed in to the same Expo account. Run `npx expo login`, sign in to Expo Go with the same account, then scan the QR code. On school Wi-Fi, use `npx expo start --tunnel` if the QR code does not connect.
- **Android (Expo Go):** scan the QR code from Expo Go. Expo has said the same sign-in rule will come to Android, so sign in there too if Expo Go asks.
- **iOS simulator / Android emulator:** press `i` or `a` in the terminal. No Expo login is needed. The iOS simulator needs Xcode with an iOS runtime installed.
- **Browser:** press `w`.

## Demo walkthrough

1. **Create account** with a name, email and password, or **Log in**.
2. **Discover:** swipe right to like, left to skip, or use the buttons. The bookmark saves a book without moving on. **Filters** narrows the deck to one genre.
3. Tap a card to open **Book details**, then **Save to my reading list**.
4. On Book details, open **Reviews & ratings** to see the review screen.
5. **Saved** tab: the Saved and Liked lists. The ✕ removes a book.
6. **Search** tab: search by title or author, or tap a genre.
7. **Profile** tab: **Clear reading activity** removes your saves and swipes so the deck starts again from the first book.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `Unable to resolve "firebase/app"` | Dependencies are out of date. Run `npm install`, then `npx expo start --clear`. |
| "Account service is not configured yet" and Log in is disabled | `.env.local` is missing or incomplete. Follow step 3, then restart with `--clear`. |
| "Account service is not ready" | Email/Password sign-in is not enabled in the Firebase project. Ask the maintainer. |
| Expo Go asks for `npx expo login` | Expected on iPhone with SDK 57. See step 4. |
| `git` asks you to agree to the Xcode license | Run `sudo xcodebuild -license`, scroll to the end and type `agree`. |

## Project structure

```
src/
  app/                      Screens (Expo Router: one file = one screen)
    _layout.tsx             Root navigator; app screens require sign-in
    index.tsx               01 Login
    signup.tsx              02 Create account
    (tabs)/
      _layout.tsx           Bottom tab bar
      discover.tsx          04 Swipe deck
      search.tsx            05 Search
      saved.tsx             07 Saved books
      profile.tsx           10 Profile
    book/[id].tsx           06 Book details
    reviews/[id].tsx        08 Reviews & ratings
  components/               Swipe deck, book cover, list row, tab bar, shared UI
  constants/theme.ts        Colours, spacing, radii
  data/
    books.ts                Book type and bundled fallback catalogue
    books.seed.json         The 25 sample books used to seed Firestore
  services/firebase*.ts     Firebase app, Auth and Firestore setup
  store/
    auth.tsx                Sign-up, log-in, log-out
    catalogue.tsx           Book catalogue from Firestore `book`
    library.tsx             Saved books, swipes and likes, synced to Firestore
docs/                       Firebase setup, book and like collection notes
scripts/                    Firebase checks, tests and catalogue seeding
firestore.rules             Firestore security rules
```

## Firestore data

| Path | Contents |
| --- | --- |
| `users/{uid}` | Profile: display name and reading preferences (preferences not used by the app yet) |
| `users/{uid}/savedBooks/{bookId}` | Reading list |
| `users/{uid}/swipes/{bookId}` | Latest like or skip per book |
| `like/{uid}_{bookId}` | Likes, for future recommendations |
| `book/{bookId}` | Shared catalogue, read-only for the app |
| `books/{bookId}/reviews/{uid}` | Reserved for reviews (rating 1–5, text). Not used yet |

See [book collection](docs/firestore-books.md) and [like collection](docs/firestore-likes.md) for details.

## Commands

```bash
npx expo start --clear     # start the dev server
npm run typecheck          # TypeScript check
npm run lint               # ESLint
npm run firebase:check     # read-only check of the Firebase setup in .env.local
npm run firebase:test      # end-to-end check; creates and then deletes temporary test accounts and data
npx expo install <pkg>     # add a package at the version that matches Expo SDK 57
```
