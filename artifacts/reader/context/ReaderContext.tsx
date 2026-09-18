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
  ReadingStatus,
  todayKey,
} from '@/data/catalog';

const PROFILE_KEY = '@reader/profile';
const LIBRARY_KEY = '@reader/library';

type ReaderContextValue = {
  profile: ReaderProfile | null;
  library: LibraryBook[];
  isReady: boolean;
  completeOnboarding: (profile: Pick<ReaderProfile, 'name' | 'email'>) => void;
  updateProfile: (changes: Partial<ReaderProfile>) => void;
  addToLibrary: (book: Book, status?: ReadingStatus) => void;
  updateBook: (id: string, changes: Partial<LibraryBook>) => void;
  removeFromLibrary: (id: string) => void;
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PROFILE_KEY),
      AsyncStorage.getItem(LIBRARY_KEY),
    ])
      .then(([storedProfile, storedLibrary]) => {
        if (storedProfile) setProfile(JSON.parse(storedProfile) as ReaderProfile);
        if (storedLibrary) setLibrary(JSON.parse(storedLibrary) as LibraryBook[]);
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
      const next: LibraryBook[] = [
        ...current,
        {
          ...book,
          status,
          progress: 0,
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
      const next = current.map((item) => (item.id === id ? { ...item, ...changes } : item));
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

  const logReading = useCallback((id: string, pages: number, minutes: number) => {
    const today = todayKey();
    setLibrary((current) => {
      const currentBook = current.find((item) => item.id === id);
      if (!currentBook) return current;
      const nextProgress = Math.min(
        currentBook.pages,
        Math.max(currentBook.progress, currentBook.progress + Math.max(0, pages)),
      );
      const next: LibraryBook[] = current.map((item) =>
        item.id === id
          ? {
              ...item,
              progress: nextProgress,
              minutes: item.minutes + Math.max(0, minutes),
              status: (nextProgress >= item.pages ? 'finished' : 'reading') as ReadingStatus,
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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().slice(0, 10);
      const nextStreak =
        previousDate === today
          ? current.streak
          : previousDate === yesterdayKey
            ? current.streak + 1
            : 1;
      const next = {
        ...current,
        todayPages: previousDate === today ? current.todayPages + pages : pages,
        todayMinutes: previousDate === today ? current.todayMinutes + minutes : minutes,
        streak: nextStreak,
        lastActiveDate: today,
      };
      void persist(PROFILE_KEY, next);
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    setProfile(null);
    setLibrary([]);
    void AsyncStorage.multiRemove([PROFILE_KEY, LIBRARY_KEY]);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      library,
      isReady,
      completeOnboarding,
      updateProfile,
      addToLibrary,
      updateBook,
      removeFromLibrary,
      logReading,
      signOut,
      isInLibrary: (id: string) => library.some((item) => item.id === id),
    }),
    [
      profile,
      library,
      isReady,
      completeOnboarding,
      updateProfile,
      addToLibrary,
      updateBook,
      removeFromLibrary,
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
