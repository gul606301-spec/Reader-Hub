import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Book,
  LibraryBook,
  ReaderProfile,
  ReadingLog,
  ReadingStatus,
  todayKey,
} from '@/data/catalog';

const PROFILE_KEY = '@reader/profile';
const LIBRARY_KEY = '@reader/library';
const READING_LOGS_KEY = '@reader/reading-logs';

type ReaderContextValue = {
  profile: ReaderProfile | null;
  library: LibraryBook[];
  readingLogs: ReadingLog[];
  isReady: boolean;
  completeOnboarding: (profile: Pick<ReaderProfile, 'name' | 'email'>) => void;
  updateProfile: (changes: Partial<ReaderProfile>) => void;
  addToLibrary: (book: Book, status?: ReadingStatus) => void;
  updateBook: (id: string, changes: Partial<LibraryBook>) => void;
  removeFromLibrary: (id: string) => void;
  recordReading: (pages: number, bookId?: string, minutes?: number) => void;
  updateReadingLog: (id: string, pages: number) => void;
  logReading: (id: string, pages: number, minutes: number) => void;
  signOut: () => void;
  isInLibrary: (id: string) => boolean;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

const persist = async (key: string, value: unknown) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ReaderProfile | null>(null);
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(LIBRARY_KEY),
      AsyncStorage.getItem(READING_LOGS_KEY),
    ])
      .then(([storedProfile, storedLibrary, storedReadingLogs]) => {
        if (storedProfile) setProfile(JSON.parse(storedProfile) as ReaderProfile);
        if (storedLibrary) setLibrary(JSON.parse(storedLibrary) as LibraryBook[]);
        if (storedReadingLogs) setReadingLogs(JSON.parse(storedReadingLogs) as ReadingLog[]);
      })
      .finally(() => setIsReady(true));
  }, []);

  const completeOnboarding = useCallback(
    (details: Pick<ReaderProfile, 'name' | 'email'>) => {
      const nextProfile: ReaderProfile = {
        ...details,
        dailyGoal: 20,
        reminderEnabled: true,
        reminderTime: '20:30',
        streak: 0,
        todayPages: 0,
        todayMinutes: 0,
        todayPagesDate: todayKey(),
      };
      setProfile(nextProfile);
      void persist(PROFILE_KEY, nextProfile);
    },
    [],
  );

  const updateProfile = useCallback((changes: Partial<ReaderProfile>) => {
    setProfile((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      void persist(PROFILE_KEY, next);
      return next;
    });
  }, []);

  const addToLibrary = useCallback((book: Book, status: ReadingStatus = 'want') => {
    setLibrary((current) => {
      if (current.some((item) => item.id === book.id)) return current;
      const isFinished = status === 'finished';
      const next: LibraryBook[] = [
        ...current,
        {
          ...book,
          status,
          progress: isFinished ? book.pages : 0,
          minutes: 0,
          addedAt: new Date().toISOString(),
        },
      ];
      void persist(LIBRARY_KEY, next);
      return next;
    });
  }, []);

  const updateBook = useCallback((id: string, changes: Partial<LibraryBook>) => {
    setLibrary((current) => {
      const next = current.map((item) => {
        if (item.id !== id) return item;
        const normalizedChanges =
          changes.status === 'finished'
            ? { ...changes, progress: item.pages }
            : changes;
        return { ...item, ...normalizedChanges };
      });
      void persist(LIBRARY_KEY, next);
      return next;
    });
  }, []);

  const removeFromLibrary = useCallback((id: string) => {
    setLibrary((current) => {
      const next = current.filter((item) => item.id !== id);
      void persist(LIBRARY_KEY, next);
      return next;
    });
  }, []);

  const recordReading = useCallback((pages: number, bookId?: string, minutes = 0) => {
    const normalizedPages = Math.max(0, Math.floor(pages));
    const normalizedMinutes = Math.max(0, Math.floor(minutes));
    if (normalizedPages === 0) return;
    const today = todayKey();
    const log: ReadingLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: today,
      pages: normalizedPages,
      minutes: normalizedMinutes,
      bookId,
      createdAt: new Date().toISOString(),
    };
    setReadingLogs((current) => {
      const next = [...current, log];
      void persist(READING_LOGS_KEY, next);
      return next;
    });
    setLibrary((current) => {
      const currentBook = bookId ? current.find((item) => item.id === bookId) : undefined;
      if (!currentBook) return current;
      const nextProgress = Math.min(
        currentBook.pages,
        Math.max(currentBook.progress, currentBook.progress + normalizedPages),
      );
      const next: LibraryBook[] = current.map((item) =>
        item.id === bookId
          ? {
              ...item,
              progress: nextProgress,
              minutes: item.minutes + normalizedMinutes,
              status: (item.pages > 0 && nextProgress >= item.pages ? 'finished' : 'reading') as ReadingStatus,
              lastReadAt: new Date().toISOString(),
            }
          : item,
      );
      void persist(LIBRARY_KEY, next);
      return next;
    });
    setProfile((current) => {
      if (!current) return current;
      const previousDate = current.lastActiveDate;
      const isToday = current.todayPagesDate === today || (!current.todayPagesDate && previousDate === today);
      const nextTodayPages = isToday ? current.todayPages + normalizedPages : normalizedPages;
      const goalReached = nextTodayPages >= current.dailyGoal;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      const nextStreak =
        !goalReached || previousDate === today
          ? current.streak
          : previousDate === yesterdayKey
            ? current.streak + 1
            : 1;
      const next = {
        ...current,
        todayPages: nextTodayPages,
        todayMinutes: isToday ? current.todayMinutes + normalizedMinutes : normalizedMinutes,
        todayPagesDate: today,
        streak: nextStreak,
        lastActiveDate: goalReached ? today : previousDate,
      };
      void persist(PROFILE_KEY, next);
      return next;
    });
  }, []);

  const updateReadingLog = useCallback((id: string, pages: number) => {
    const normalizedPages = Math.max(0, Math.floor(pages));
    setReadingLogs((current) => {
      const existing = current.find((log) => log.id === id);
      if (!existing || normalizedPages === existing.pages) return current;
      const delta = normalizedPages - existing.pages;
      const next = current.map((log) => (log.id === id ? { ...log, pages: normalizedPages } : log));
      void persist(READING_LOGS_KEY, next);

      const today = todayKey();
      if (existing.date === today) {
        setProfile((currentProfile) => {
          if (!currentProfile) return currentProfile;
          const isToday = currentProfile.todayPagesDate === today ||
            (!currentProfile.todayPagesDate && currentProfile.lastActiveDate === today);
          const nextProfile = {
            ...currentProfile,
            todayPages: isToday ? Math.max(0, currentProfile.todayPages + delta) : currentProfile.todayPages,
          };
          void persist(PROFILE_KEY, nextProfile);
          return nextProfile;
        });
      }

      if (existing.bookId) {
        setLibrary((currentLibrary) => {
          const nextLibrary = currentLibrary.map((book) => {
            if (book.id !== existing.bookId) return book;
            const nextProgress = Math.min(book.pages, Math.max(0, book.progress + delta));
            return {
              ...book,
              progress: nextProgress,
              status: (book.pages > 0 && nextProgress >= book.pages ? 'finished' : nextProgress < book.pages && book.status === 'finished' ? 'reading' : book.status) as ReadingStatus,
            };
          });
          void persist(LIBRARY_KEY, nextLibrary);
          return nextLibrary;
        });
      }
      return next;
    });
  }, []);

  const logReading = useCallback((id: string, pages: number, minutes: number) => {
    recordReading(pages, id, minutes);
  }, [recordReading]);

  const signOut = useCallback(() => {
    setProfile(null);
    setLibrary([]);
    setReadingLogs([]);
    void AsyncStorage.multiRemove([PROFILE_KEY, LIBRARY_KEY, READING_LOGS_KEY]);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      library,
        readingLogs,
      isReady,
      completeOnboarding,
      updateProfile,
      addToLibrary,
      updateBook,
      removeFromLibrary,
        recordReading,
        updateReadingLog,
      logReading,
      signOut,
      isInLibrary: (id: string) => library.some((item) => item.id === id),
    }),
    [
      profile,
      library,
      readingLogs,
      isReady,
      completeOnboarding,
      updateProfile,
      addToLibrary,
      updateBook,
      removeFromLibrary,
      recordReading,
      updateReadingLog,
      logReading,
      signOut,
    ],
  );

  return <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>;
}

export function useReader() {
  const value = useContext(ReaderContext);
  if (!value) throw new Error('useReader must be used within ReaderProvider');
  return value;
}
