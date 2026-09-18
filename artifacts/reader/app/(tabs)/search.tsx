import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { Book, featuredBooks } from '@/data/catalog';
import {
  Cover,
  EmptyState,
  LoadingState,
  PrimaryButton,
  Screen,
  SearchField,
  SectionTitle,
} from '@/components/ReaderUI';

type SearchError = 'timeout' | 'network' | 'empty_response' | 'unknown';

type SearchDoc = Record<string, unknown>;

type RankedBook = Book & {
  score: number;
  groupKey: string;
};

const SEARCH_FIELDS = [
  'key',
  'work_key',
  'title',
  'subtitle',
  'title_suggest',
  'alternative_title',
  'other_titles',
  'translated_titles',
  'author_name',
  'isbn',
  'cover_i',
  'cover_edition_key',
  'number_of_pages_median',
  'number_of_pages',
  'first_publish_year',
  'first_sentence',
].join(',');

const normalizeText = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9x]+/g, ' ')
    .trim();

const toTextList = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
};

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(number) && number > 0) return Math.round(number);
  }
  return 0;
};

const isLikelyIsbn = (value: string) => {
  const compact = value.replace(/[-\s]/g, '');
  return /^\d{9}[\dX]$/.test(compact) || /^\d{13}$/.test(compact);
};

const scoreDocument = (doc: SearchDoc, query: string) => {
  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const titles = [
    ...toTextList(doc.title),
    ...toTextList(doc.subtitle),
    ...toTextList(doc.title_suggest),
    ...toTextList(doc.alternative_title),
    ...toTextList(doc.other_titles),
    ...toTextList(doc.translated_titles),
  ];
  const authors = toTextList(doc.author_name);
  const isbns = toTextList(doc.isbn).map((isbn) => normalizeText(isbn));
  const normalizedTitles = titles.map(normalizeText);
  const normalizedAuthors = authors.map(normalizeText);
  let score = 0;

  if (normalizedTitles.some((title) => title === normalizedQuery)) score += 140;
  if (normalizedTitles.some((title) => title.startsWith(normalizedQuery))) score += 80;
  if (normalizedTitles.some((title) => title.includes(normalizedQuery))) score += 55;
  if (normalizedAuthors.some((author) => author.includes(normalizedQuery))) score += 50;
  if (isbns.some((isbn) => isbn.includes(normalizedQuery))) score += 180;
  for (const token of queryTokens) {
    if (normalizedTitles.some((title) => title.includes(token))) score += 14;
    if (normalizedAuthors.some((author) => author.includes(token))) score += 10;
  }
  if (doc.cover_i || doc.cover_edition_key || doc.isbn) score += 3;
  if (firstNumber(doc.number_of_pages_median, doc.number_of_pages)) score += 2;
  return score;
};

const selectBestEdition = (current: RankedBook, candidate: RankedBook) => {
  const currentCompleteness =
    Number(Boolean(current.cover)) +
    Number(current.pages > 0) +
    Number(Boolean(current.year)) +
    Number(Boolean(current.description));
  const candidateCompleteness =
    Number(Boolean(candidate.cover)) +
    Number(candidate.pages > 0) +
    Number(Boolean(candidate.year)) +
    Number(Boolean(candidate.description));
  return candidate.score > current.score ||
    (candidate.score === current.score && candidateCompleteness > currentCompleteness)
    ? candidate
    : current;
};

const mapAndRankResults = (docs: SearchDoc[], query: string): Book[] => {
  const grouped = new Map<string, RankedBook>();
  docs.forEach((doc, index) => {
    const title = toTextList(doc.title)[0] ?? 'İsimsiz kitap';
    const author = toTextList(doc.author_name)[0] ?? 'Bilinmeyen yazar';
    const coverId = firstNumber(doc.cover_i);
    const isbn = toTextList(doc.isbn)[0];
    const workKey = toTextList(doc.work_key)[0] ?? toTextList(doc.key)[0];
    const groupKey = workKey?.startsWith('/works/')
      ? workKey
      : `${normalizeText(title)}-${normalizeText(author)}`;
    const description = toTextList(doc.first_sentence)[0];
    const candidate: RankedBook = {
      id: workKey ?? `${normalizeText(title)}-${index}`,
      title,
      author,
      cover: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
        : isbn
          ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg`
          : undefined,
      pages: firstNumber(doc.number_of_pages_median, doc.number_of_pages),
      year: firstNumber(doc.first_publish_year) || undefined,
      description,
      score: scoreDocument(doc, query),
      groupKey,
    };
    const existing = grouped.get(groupKey);
    grouped.set(groupKey, existing ? selectBestEdition(existing, candidate) : candidate);
  });

  return [...grouped.values()]
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, 'tr'))
    .map(({ score: _score, groupKey: _groupKey, ...book }) => book);
};

const searchOpenLibrary = async (
  query: string,
  signal: AbortSignal,
): Promise<{ books: Book[]; error?: SearchError }> => {
  const searchParam = isLikelyIsbn(query)
    ? `isbn=${encodeURIComponent(query.replace(/[-\s]/g, ''))}`
    : `q=${encodeURIComponent(query)}`;
  const url = `https://openlibrary.org/search.json?${searchParam}&limit=50&fields=${encodeURIComponent(SEARCH_FIELDS)}`;
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) return { books: [], error: 'network' };
    const payload = (await response.json()) as { docs?: SearchDoc[] };
    if (!Array.isArray(payload.docs)) return { books: [], error: 'empty_response' };
    return { books: mapAndRankResults(payload.docs, query) };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { books: [], error: 'timeout' };
    }
    return { books: [], error: 'network' };
  }
};

const getErrorCopy = (error: SearchError) => {
  if (error === 'timeout') {
    return { title: 'Arama zaman aşımına uğradı', message: 'Bağlantı biraz uzun sürdü. Tekrar deneyebilirsin.' };
  }
  if (error === 'empty_response') {
    return { title: 'Sonuç alınamadı', message: 'Bu aramada kullanılabilir bir sonuç dönmedi. Tekrar deneyebilirsin.' };
  }
  if (error === 'unknown') {
    return { title: 'Arama tamamlanamadı', message: 'Arama şu anda kullanılamıyor. Tekrar deneyebilirsin.' };
  }
  return { title: 'Bağlantı kurulamadı', message: 'İnternet bağlantını kontrol edip tekrar deneyebilirsin.' };
};

export default function SearchScreen() {
  const colors = useColors();
  const { isInLibrary } = useReader();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const [retryVersion, setRetryVersion] = useState(0);
  const cache = useRef(new Map<string, Book[]>());
  const forceSearch = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let controller: AbortController | undefined;
    const timer = setTimeout(() => {
      const currentRequest = ++requestId.current;
      const cachedResults = cache.current.get(normalizedQuery);
      const shouldForceSearch = forceSearch.current;
      forceSearch.current = false;
      if (cachedResults && !shouldForceSearch) {
        setResults(cachedResults);
        setError(null);
        setLoading(false);
        return;
      }

      const requestController = new AbortController();
      controller = requestController;
      const timeout = setTimeout(() => requestController.abort(), 8000);
      setLoading(true);
      setError(null);
      void searchOpenLibrary(query.trim(), requestController.signal)
        .then(({ books, error: searchError }) => {
          if (currentRequest !== requestId.current) return;
          if (searchError) {
            setResults([]);
            setError(searchError);
            return;
          }
          cache.current.set(normalizedQuery, books);
          setResults(books);
          setError(null);
        })
        .catch(() => {
          if (currentRequest === requestId.current) {
            setResults([]);
            setError('unknown');
          }
        })
        .finally(() => {
          clearTimeout(timeout);
          if (currentRequest === requestId.current) setLoading(false);
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller?.abort();
    };
  }, [query, retryVersion]);

  const retrySearch = () => {
    forceSearch.current = true;
    setRetryVersion((version) => version + 1);
  };

  const openBook = (book: Book) =>
    router.push({
      pathname: '/book/[id]',
      params: {
        id: book.id,
        title: book.title,
        author: book.author,
        cover: book.cover ?? '',
        pages: String(book.pages),
        description: book.description ?? '',
      },
    });
  const visibleBooks = query.trim() ? results : featuredBooks;
  const errorCopy = error ? getErrorCopy(error) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>KEŞFET</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Bir sonraki{'\n'}kitabını bul.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Başlık, yazar, ISBN veya farklı dildeki adını ara.
        </Text>
      </View>
      <SearchField value={query} onChangeText={setQuery} placeholder="Kitap, yazar veya ISBN ara" />
      <View style={styles.section}>
        <SectionTitle title={query ? 'Arama sonuçları' : 'Bugün popüler'} />
        {loading ? (
          <LoadingState />
        ) : errorCopy ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.errorIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="cloud-offline-outline" size={23} color={colors.primary} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.foreground }]}>{errorCopy.title}</Text>
            <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>{errorCopy.message}</Text>
            <PrimaryButton label="Tekrar dene" icon="refresh" onPress={retrySearch} />
          </View>
        ) : visibleBooks.length === 0 ? (
          <EmptyState icon="search-outline" title="Sonuç bulunamadı" message="Başka bir başlık, yazar adı veya ISBN dene." />
        ) : (
          visibleBooks.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => openBook(book)}
              style={({ pressed }) => [
                styles.resultRow,
                { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Cover book={book} size="small" />
              <View style={styles.resultInfo}>
                <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
                <Text style={[styles.resultAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>
                <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
                  {book.pages > 0 ? `${book.pages} sayfa` : 'Sayfa bilgisi yok'}{book.year ? ` · ${book.year}` : ''}
                </Text>
              </View>
              {isInLibrary(book.id) ? <IonIconMark color={colors.primary} /> : <Text style={[styles.addMark, { color: colors.primary }]}>+</Text>}
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

function IonIconMark({ color }: { color: string }) {
  return (
    <View style={[styles.inLibrary, { backgroundColor: color }]}>
      <Text style={styles.check}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 22 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 34, marginTop: 7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 8, lineHeight: 19 },
  section: { marginTop: 28 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 11, marginBottom: 11 },
  resultInfo: { flex: 1, minWidth: 0 },
  resultTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 19 },
  resultAuthor: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  resultMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 7 },
  addMark: { fontFamily: 'Inter_400Regular', fontSize: 28, paddingHorizontal: 7 },
  inLibrary: { width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
  errorCard: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 8 },
  errorIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  errorTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' },
  errorMessage: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 6 },
});