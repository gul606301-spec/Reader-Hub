export type ReadingStatus = 'reading' | 'finished' | 'want';

export type Book = {
  id: string;
  title: string;
  author: string;
  cover?: string;
  pages: number;
  description?: string;
  year?: number;
};

export type LibraryBook = Book & {
  status: ReadingStatus;
  progress: number;
  minutes: number;
  addedAt: string;
  lastReadAt?: string;
};

export type ReadingLog = {
  id: string;
  date: string;
  pages: number;
  minutes: number;
  bookId?: string;
  createdAt: string;
};

export type ReaderProfile = {
  name: string;
  email: string;
  dailyGoal: number;
  reminderEnabled: boolean;
  reminderTime: string;
  streak: number;
  todayPages: number;
  todayMinutes: number;
  todayPagesDate?: string;
  lastActiveDate?: string;
};

export const featuredBooks: Book[] = [
  {
    id: 'ol-the-little-prince',
    title: 'Küçük Prens',
    author: 'Antoine de Saint-Exupéry',
    cover: 'https://covers.openlibrary.org/b/isbn/9780156012195-M.jpg',
    pages: 96,
    year: 1943,
    description:
      'Bir çocuğun gözünden büyümeyi, dostluğu ve hayatta gerçekten önemli olanı anlatan zamansız bir hikâye.',
  },
  {
    id: 'ol-atomic-habits',
    title: 'Atomik Alışkanlıklar',
    author: 'James Clear',
    cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-M.jpg',
    pages: 320,
    year: 2018,
    description:
      'Küçük değişikliklerle kalıcı davranışlar oluşturmak için pratik ve anlaşılır bir rehber.',
  },
  {
    id: 'ol-kite-runner',
    title: 'Uçurtma Avcısı',
    author: 'Khaled Hosseini',
    cover: 'https://covers.openlibrary.org/b/isbn/9781594631931-M.jpg',
    pages: 371,
    year: 2003,
    description:
      'Dostluk, ihanet ve kefaret üzerine güçlü bir büyüme hikâyesi.',
  },
];

export const getBookKey = (book: Book) => book.id;

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const formatMinutes = (minutes: number) => {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} sa ${remaining} dk` : `${hours} sa`;
};

export const statusLabel = (status: ReadingStatus) => {
  if (status === 'reading') return 'Okuyorum';
  if (status === 'finished') return 'Okudum';
  return 'Okuyacağım';
};

export const statusColorKey = (status: ReadingStatus) => {
  if (status === 'reading') return 'primary' as const;
  if (status === 'finished') return 'accent' as const;
  return 'secondary' as const;
};
