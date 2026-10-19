import seedBooks from './books.seed.json';

/**
 * Built-in sample catalogue for the Sprint 3 demo.
 *
 * Seed data is used by the administrative importer. App screens read the
 * Firestore catalogue through useCatalogue. Ratings remain sample values.
 */

export type Genre =
  | 'Fiction'
  | 'Fantasy'
  | 'Sci-fi'
  | 'Mystery'
  | 'Romance'
  | 'Biography'
  | 'History'
  | 'Self-help';

export const GENRES: Genre[] = [
  'Fiction',
  'Fantasy',
  'Sci-fi',
  'Mystery',
  'Romance',
  'Biography',
  'History',
  'Self-help',
];

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  /** Sample rating out of 5. */
  rating: number;
  year: number;
  /** One line shown on the swipe card. */
  hook: string;
  /** Short summary shown on the details screen. */
  description: string;
  /** Open Library cover id. The app falls back to a placeholder if it fails to load. */
  coverId?: number;
};

const BOOKS: Book[] = seedBooks as Book[];

/**
 * Bundled sample access for offline demo mode. App screens use useCatalogue
 * so the same flow can read from Firestore without changing book IDs.
 */
export function getAllBooks(): Book[] {
  return BOOKS;
}

export function getBookById(id: string): Book | undefined {
  return BOOKS.find((book) => book.id === id);
}

export function searchBooks(query: string, genre?: Genre | null): Book[] {
  const q = query.trim().toLowerCase();
  return BOOKS.filter((book) => {
    if (genre && book.genre !== genre) return false;
    if (!q) return true;
    return book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
  });
}

export function coverUrl(book: Book, size: 'M' | 'L' = 'L'): string | null {
  if (!book.coverId) return null;
  return `https://covers.openlibrary.org/b/id/${book.coverId}-${size}.jpg`;
}

export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} / 5`;
}
