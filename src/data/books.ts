/**
 * Built-in sample catalogue for the Sprint 3 demo.
 *
 * Everything here is bundled with the app, so the demo does not depend on a
 * backend. Ratings are sample values. Later this file is replaced by the
 * Google Books API + Firestore (see `getAllBooks` / `getBookById` below —
 * screens only talk to those functions, never to the array directly).
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

const BOOKS: Book[] = [
  {
    id: 'dune',
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Sci-fi',
    rating: 4.3,
    year: 1965,
    hook: 'A desert planet, a prophecy, and a war over the most valuable substance in the universe.',
    description:
      'When his family takes control of the desert planet Arrakis, young Paul Atreides is pulled into a struggle between noble houses, an empire, and the people who call the desert home. A story about power, ecology, and the cost of becoming a legend.',
    coverId: 11481354,
  },
  {
    id: 'circe',
    title: 'Circe',
    author: 'Madeline Miller',
    genre: 'Fantasy',
    rating: 4.2,
    year: 2018,
    hook: 'The witch from the Odyssey finally tells her own side of the story.',
    description:
      'Banished to a lonely island for a power the gods fear, Circe hones her witchcraft and crosses paths with heroes and monsters of Greek myth. Over centuries she has to decide whether she belongs with the gods or with the mortals she has come to love.',
    coverId: 8739376,
  },
  {
    id: 'thursday-murder-club',
    title: 'The Thursday Murder Club',
    author: 'Richard Osman',
    genre: 'Mystery',
    rating: 3.9,
    year: 2020,
    hook: 'Four retirees meet weekly to solve cold cases. Then a real one lands on their doorstep.',
    description:
      'In a quiet retirement village, four unlikely friends spend their Thursdays poring over unsolved murders. When a local developer turns up dead, they get the chance to investigate a live case, and they turn out to be far sharper than the police expect.',
    coverId: 10201431,
  },
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Romance',
    rating: 4.3,
    year: 1813,
    hook: 'First impressions, sharp tongues, and one of the most famous slow-burn romances ever written.',
    description:
      'Elizabeth Bennet has no patience for the proud Mr. Darcy, and he seems to think little of her family. As misunderstandings pile up and are slowly undone, both have to face how wrong their first judgments were.',
    coverId: 14348537,
  },
  {
    id: 'a-gentleman-in-moscow',
    title: 'A Gentleman in Moscow',
    author: 'Amor Towles',
    genre: 'Fiction',
    rating: 4.3,
    year: 2016,
    hook: 'Sentenced to spend the rest of his life inside a grand hotel, a count decides to live well anyway.',
    description:
      'In 1922, Count Alexander Rostov is placed under house arrest in the Metropol hotel in Moscow. Decades of Russian history unfold outside its doors while he builds an unexpectedly full life within them, through friendships, work, and a child left in his care.',
    coverId: 11326818,
  },
  {
    id: 'educated',
    title: 'Educated',
    author: 'Tara Westover',
    genre: 'Biography',
    rating: 4.5,
    year: 2018,
    hook: 'She first set foot in a classroom at seventeen. A memoir about what learning can cost.',
    description:
      'Raised by survivalist parents in rural Idaho, Tara Westover grew up without school or doctors. Her memoir follows her path from the family scrapyard to a PhD at Cambridge, and the painful distance that education put between her and home.',
    coverId: 8314077,
  },
  {
    id: 'sapiens',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    genre: 'History',
    rating: 4.4,
    year: 2011,
    hook: 'How one unremarkable ape ended up running the planet, told in 400 pages.',
    description:
      'A sweeping history of our species, from the first humans to the present day. Harari argues that our ability to believe in shared stories, such as money, nations, and religions, is what allowed strangers to cooperate at scale.',
    coverId: 8634250,
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-help',
    rating: 4.4,
    year: 2018,
    hook: 'Tiny changes, repeated daily, add up to results that look like overnight success.',
    description:
      'A practical guide to building good habits and breaking bad ones. Clear focuses on small adjustments to your environment and routines, and on designing systems that make the right behaviour the easy one.',
    coverId: 12539702,
  },
  {
    id: 'the-hobbit',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    rating: 4.3,
    year: 1937,
    hook: 'A comfort-loving hobbit is talked into a quest involving thirteen dwarves and one dragon.',
    description:
      'Bilbo Baggins would rather stay home, but a wizard and a company of dwarves sweep him off to help reclaim a stolen treasure. Along the way he meets trolls, elves, a riddling creature in the dark, and a courage he did not know he had.',
    coverId: 14627509,
  },
  {
    id: 'project-hail-mary',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Sci-fi',
    rating: 4.5,
    year: 2021,
    hook: 'He wakes up alone on a spaceship with no memory and the fate of Earth in his hands.',
    description:
      'Ryland Grace comes to on a ship far from home, with two dead crewmates and no idea why he is there. As his memory returns, he realises he is humanity’s last chance, and that he may not be as alone out there as he thought.',
    coverId: 11200092,
  },
  {
    id: 'and-then-there-were-none',
    title: 'And Then There Were None',
    author: 'Agatha Christie',
    genre: 'Mystery',
    rating: 4.3,
    year: 1939,
    hook: 'Ten strangers on an island. One by one, they start to die.',
    description:
      'Ten people are invited to an isolated island by a host who never appears. Each is accused of a past crime, and then the guests begin to be killed in the manner of a nursery rhyme. With no one else on the island, the murderer has to be one of them.',
    coverId: 11172296,
  },
  {
    id: 'normal-people',
    title: 'Normal People',
    author: 'Sally Rooney',
    genre: 'Romance',
    rating: 3.8,
    year: 2018,
    hook: 'Two people who keep finding, and losing, each other from school through university.',
    description:
      'Connell and Marianne grow up in the same small Irish town but in very different circumstances. Their on-and-off relationship follows them to Dublin, shaped by class, insecurity, and everything they fail to say to one another.',
    coverId: 8794265,
  },
  {
    id: 'to-kill-a-mockingbird',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    genre: 'Fiction',
    rating: 4.3,
    year: 1960,
    hook: 'A child watches her father defend an innocent man in a town that has already decided.',
    description:
      'In 1930s Alabama, Scout Finch’s father, a lawyer, agrees to defend a Black man falsely accused of a crime. Seen through a child’s eyes, the trial exposes the prejudice of her town and teaches her what courage and decency look like.',
    coverId: 14351077,
  },
  {
    id: 'born-a-crime',
    title: 'Born a Crime',
    author: 'Trevor Noah',
    genre: 'Biography',
    rating: 4.5,
    year: 2016,
    hook: 'Growing up in South Africa when his very existence was against the law.',
    description:
      'Trevor Noah was born to a Black mother and a white father under apartheid, when that union was illegal. In funny and often moving stories, he describes a childhood spent hiding, hustling, and being raised by a fiercely independent mother.',
    coverId: 8294078,
  },
  {
    id: 'the-silk-roads',
    title: 'The Silk Roads',
    author: 'Peter Frankopan',
    genre: 'History',
    rating: 4.2,
    year: 2015,
    hook: 'World history retold with its centre moved east, to the trade routes of Asia.',
    description:
      'Frankopan shifts the focus of world history away from Europe to the networks linking East and West. Following goods, ideas, religions, and armies along these routes, he shows how they shaped empires for more than two thousand years.',
    coverId: 8963642,
  },
  {
    id: 'deep-work',
    title: 'Deep Work',
    author: 'Cal Newport',
    genre: 'Self-help',
    rating: 4.2,
    year: 2016,
    hook: 'Why focus is becoming rare, and how to train it like a skill.',
    description:
      'Newport argues that the ability to concentrate without distraction is increasingly valuable and increasingly uncommon. The book offers rules and routines for protecting long stretches of focused time in a world of constant notifications.',
    coverId: 7988607,
  },
  {
    id: 'a-wizard-of-earthsea',
    title: 'A Wizard of Earthsea',
    author: 'Ursula K. Le Guin',
    genre: 'Fantasy',
    rating: 4.0,
    year: 1968,
    hook: 'A gifted young wizard lets something loose, and has to spend years facing it.',
    description:
      'Ged is a proud and talented student of magic who, in a moment of arrogance, releases a shadow into the world. His journey across the islands of Earthsea becomes a hunt, and then a reckoning with the part of himself he would rather not see.',
    coverId: 13617691,
  },
  {
    id: 'klara-and-the-sun',
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    genre: 'Sci-fi',
    rating: 3.8,
    year: 2021,
    hook: 'An artificial friend watches the humans she serves and tries to understand love.',
    description:
      'Klara is a solar-powered companion built to keep a teenager company. Observant and devoted, she tries to make sense of the family that chooses her, and of what it would really mean to care for someone completely.',
    coverId: 10648686,
  },
  {
    id: 'gone-girl',
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    genre: 'Mystery',
    rating: 4.1,
    year: 2012,
    hook: 'On their fifth anniversary his wife vanishes, and every clue points at him.',
    description:
      'When Amy Dunne disappears, suspicion quickly falls on her husband Nick. Told in alternating voices, the story keeps shifting what you think you know about their marriage, and about which of them is telling the truth.',
    coverId: 8368314,
  },
  {
    id: 'evelyn-hugo',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    genre: 'Romance',
    rating: 4.4,
    year: 2017,
    hook: 'A reclusive Hollywood icon decides to reveal which of her marriages actually mattered.',
    description:
      'Ageing film star Evelyn Hugo chooses an unknown reporter to write her life story. As she recounts her rise in old Hollywood and her seven marriages, the real love of her life emerges, along with the reason she picked this reporter.',
    coverId: 8354226,
  },
  {
    id: 'the-great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    genre: 'Fiction',
    rating: 3.9,
    year: 1925,
    hook: 'Lavish parties, a mysterious millionaire, and a dream that money cannot buy back.',
    description:
      'Nick Carraway moves next door to Jay Gatsby, whose extravagant parties hide a single obsession: winning back Daisy Buchanan. Set in the summer of 1922, the novel is a short, sharp look at wealth, longing, and illusion.',
    coverId: 10590366,
  },
  {
    id: 'becoming',
    title: 'Becoming',
    author: 'Michelle Obama',
    genre: 'Biography',
    rating: 4.5,
    year: 2018,
    hook: 'From the South Side of Chicago to the White House, in her own words.',
    description:
      'Michelle Obama reflects on her childhood in Chicago, her career as a lawyer and executive, and her years as First Lady. The memoir is candid about balancing work, family, and public life while holding on to a sense of self.',
    coverId: 8824664,
  },
  {
    id: 'the-name-of-the-wind',
    title: 'The Name of the Wind',
    author: 'Patrick Rothfuss',
    genre: 'Fantasy',
    rating: 4.5,
    year: 2007,
    hook: 'A legendary figure, now hiding as an innkeeper, agrees to tell the true story of his life.',
    description:
      'Kvothe was once the most notorious wizard, musician, and adventurer of his age. Over one day he recounts his childhood among travelling players, his years as a street orphan, and his entry into a university of magic.',
    coverId: 11480483,
  },
  {
    id: 'the-left-hand-of-darkness',
    title: 'The Left Hand of Darkness',
    author: 'Ursula K. Le Guin',
    genre: 'Sci-fi',
    rating: 4.1,
    year: 1969,
    hook: 'An envoy arrives on a frozen world whose people have no fixed gender.',
    description:
      'Genly Ai is sent alone to the planet Gethen to persuade its nations to join an interstellar alliance. To succeed, he has to learn to trust a people very different from himself, and one exiled politician in particular.',
    coverId: 10618463,
  },
  {
    id: 'the-kite-runner',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    genre: 'Fiction',
    rating: 4.3,
    year: 2003,
    hook: 'A childhood betrayal in Kabul follows a man across continents and decades.',
    description:
      'Amir grows up in Kabul alongside Hassan, the son of his father’s servant and his closest friend. After failing Hassan at a crucial moment, Amir carries the guilt into a new life in America, until he is given a chance to make things right.',
    coverId: 14846827,
  },
];

/**
 * Data access layer. Swap these implementations for real API calls later;
 * the screens will not need to change.
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
