
import { Book, Genre } from '@/data/books';
import { GoogleBook } from '@/services/googleBooks';

const GENRE_MAPPING: Record<string, Genre> = {
  fiction: 'Fiction',
  fantasy: 'Fantasy',
  'science fiction': 'Sci-fi',
  'sci-fi': 'Sci-fi',
  mystery: 'Mystery',
  thriller: 'Mystery',
  romance: 'Romance',
  biography: 'Biography',
  biographies: 'Biography',
  history: 'History',
  'self-help': 'Self-help',
  'self help': 'Self-help',
};

function getGenre(categories: string[] = []): Genre {
  const values = categories.map((category) =>
    category.toLowerCase()
  );

  for (const [keyword, genre] of Object.entries(GENRE_MAPPING)) {
    if (values.some((category) => category.includes(keyword))) {
      return genre;
    }
  }

  return 'Fiction';
}

function cleanDescription(description?: string): string {
  if (!description) {
    return 'No description is available for this book.';
  }

  return description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function googleBookToBook(item: GoogleBook): Book {
  const info = item.volumeInfo ?? {};
  const description = cleanDescription(info.description);

  const year = Number.parseInt(
    info.publishedDate?.slice(0, 4) ?? '',
    10
  );

  const rating = info.averageRating;

  const coverImageUrl =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail;

  return {
    id: `google:${item.id}`,
    title: info.title?.trim() || 'Untitled',
    author: info.authors?.join(', ') || 'Unknown author',
    genre: getGenre(info.categories),
    rating:
      typeof rating === 'number' &&
      Number.isFinite(rating) &&
      rating >= 0 &&
      rating <= 5
        ? rating
        : 0,
    year: Number.isFinite(year) ? year : 0,
    hook: description.slice(0, 150),
    description,
    coverImageUrl: coverImageUrl?.replace(/^http:/, 'https:'),
    source: 'google',
  };
}
