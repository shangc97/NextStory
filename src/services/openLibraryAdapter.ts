
import { type Book, type Genre } from '@/data/books';
import {
  type OpenLibrarySearchBook,
  type OpenLibraryWork,
} from '@/services/openLibrary';

function getGenre(subjects: string[] = []): Genre {
  const text = subjects.join(' ').toLowerCase();

  if (text.includes('science fiction') || text.includes('sci-fi')) {
    return 'Sci-fi';
  }
  if (text.includes('fantasy')) return 'Fantasy';
  if (text.includes('mystery') || text.includes('thriller')) {
    return 'Mystery';
  }
  if (text.includes('romance')) return 'Romance';
  if (text.includes('biography')) return 'Biography';
  if (text.includes('history')) return 'History';
  if (text.includes('self-help') || text.includes('self help')) {
    return 'Self-help';
  }

  return 'Fiction';
}

function getDescription(
  value?: string | { type?: string; value?: string }
): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'object' && value?.value?.trim()) {
    return value.value.trim();
  }

  return 'No description is available for this book.';
}

export function openLibrarySearchToBook(
  item: OpenLibrarySearchBook
): Book {
  const description =
    typeof item.first_sentence === 'string'
      ? item.first_sentence
      : Array.isArray(item.first_sentence)
        ? item.first_sentence.join(' ')
        : 'No description is available for this book.';

  const rating = item.ratings_average;

  return {
    id: `openlibrary:${item.key.split('/').pop()}`,
    title: item.title?.trim() || 'Untitled',
    author: item.author_name?.join(', ') || 'Unknown author',
    genre: getGenre(item.subject),
    rating:
      typeof rating === 'number' &&
      Number.isFinite(rating) &&
      rating >= 0 &&
      rating <= 5
        ? rating
        : 0,
    year: item.first_publish_year ?? 0,
    hook: description.slice(0, 150),
    description,
    coverId: item.cover_i,
    source: 'openlibrary',
  };
}

export function openLibraryWorkToBook(
  item: OpenLibraryWork,
  previous?: Book
): Book {
  const description = getDescription(item.description);
  const year = Number.parseInt(
    item.first_publish_date?.slice(0, 4) ?? '',
    10
  );

  return {
    id: `openlibrary:${item.key.split('/').pop()}`,
    title: item.title?.trim() || previous?.title || 'Untitled',
    author: previous?.author || 'Unknown author',
    genre: item.subjects
      ? getGenre(item.subjects)
      : previous?.genre || 'Fiction',
    rating: previous?.rating ?? 0,
    year: Number.isFinite(year)
      ? year
      : previous?.year ?? 0,
    hook:
      description === 'No description is available for this book.'
        ? previous?.hook ?? description
        : description.slice(0, 150),
    description:
      description === 'No description is available for this book.'
        ? previous?.description ?? description
        : description,
    coverId: item.covers?.[0] ?? previous?.coverId,
    source: 'openlibrary',
  };
}
