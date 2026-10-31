
const OPEN_LIBRARY_URL = 'https://openlibrary.org';

export type OpenLibrarySearchBook = {
  key: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  subject?: string[];
  ratings_average?: number;
  first_sentence?: string | string[];
};

export type OpenLibraryWork = {
  key: string;
  title?: string;
  description?: string | { type?: string; value?: string };
  first_publish_date?: string;
  covers?: number[];
  subjects?: string[];
};

type SearchResponse = {
  numFound?: number;
  num_found?: number;
  docs?: OpenLibrarySearchBook[];
};

export type OpenLibraryPage = {
  books: OpenLibrarySearchBook[];
  totalItems: number;
};

export async function searchOpenLibrary(
  searchTerm: string,
  startIndex = 0,
  maxResults = 20,
  signal?: AbortSignal
): Promise<OpenLibraryPage> {
  const term = searchTerm.trim();

  if (!term) {
    return { books: [], totalItems: 0 };
  }

  const params = [
    `q=${encodeURIComponent(term)}`,
    `offset=${Math.max(0, Math.floor(startIndex))}`,
    `limit=${Math.min(40, Math.max(1, Math.floor(maxResults)))}`,
    'fields=key,title,author_name,first_publish_year,cover_i,subject,ratings_average,first_sentence',
  ];

  const response = await fetch(
    `${OPEN_LIBRARY_URL}/search.json?${params.join('&')}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Open Library search failed (${response.status})`
    );
  }

  const data = (await response.json()) as SearchResponse;

  return {
    books: (data.docs ?? []).filter(
      (item) =>
        /^\/works\/OL\d+W$/.test(item.key) &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0
    ),
    totalItems: data.numFound ?? data.num_found ?? 0,
  };
}

export async function getOpenLibraryWork(
  workId: string,
  signal?: AbortSignal
): Promise<OpenLibraryWork> {
  if (!/^OL\d+W$/.test(workId)) {
    throw new Error('Invalid Open Library work ID');
  }

  const response = await fetch(
    `${OPEN_LIBRARY_URL}/works/${workId}.json`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load Open Library book (${response.status})`
    );
  }

  return (await response.json()) as OpenLibraryWork;
}
