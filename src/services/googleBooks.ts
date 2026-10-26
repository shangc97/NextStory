
const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

export type GoogleBook = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    categories?: string[];
    publishedDate?: string;
    pageCount?: number;
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
};

type GoogleBooksResponse = {
  totalItems?: number;
  items?: GoogleBook[];
};

export type GoogleBooksPage = {
  books: GoogleBook[];
  totalItems: number;
};

export async function searchGoogleBooks(
  searchTerm: string,
  startIndex = 0,
  maxResults = 20,
  signal?: AbortSignal
): Promise<GoogleBooksPage> {
  const term = searchTerm.trim();

  if (!term) {
    return { books: [], totalItems: 0 };
  }

  const params = [
    `q=${encodeURIComponent(term)}`,
    `startIndex=${Math.max(0, Math.floor(startIndex))}`,
    `maxResults=${Math.min(40, Math.max(1, Math.floor(maxResults)))}`,
    'printType=books',
  ];

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

    if (apiKey) {
    params.push(`key=${encodeURIComponent(apiKey)}`);
    }

  const url = `${GOOGLE_BOOKS_URL}?${params.join('&')}`;

//   console.log('[Google Books] Request:', url);
  const response = await fetch(url, { signal });
  console.log('[Google Books] HTTP status:', response.status);

  if (!response.ok) {
  const errorBody = await response.text();

  console.error('[Google Books] Request failed:', {
    status: response.status,
    body: errorBody,
  });

  throw new Error(
    `Google Books request failed (${response.status})`
  );
}

  const data: GoogleBooksResponse = await response.json();

  console.log(
  '[Google Books] Results:',
  data.totalItems,
  'Items returned:',
  data.items?.length ?? 0
);

  return {
    books: (data.items ?? []).filter(
      (book) => Boolean(book.id && book.volumeInfo?.title)
    ),
    totalItems: data.totalItems ?? 0,
  };
}

export async function getGoogleBookById(
  volumeId: string,
  signal?: AbortSignal
): Promise<GoogleBook> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

  const keyParameter = apiKey
    ? `?key=${encodeURIComponent(apiKey)}`
    : '';

  const response = await fetch(
    `${GOOGLE_BOOKS_URL}/${encodeURIComponent(volumeId)}${keyParameter}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Unable to load book (${response.status})`);
  }

  return (await response.json()) as GoogleBook;
}
