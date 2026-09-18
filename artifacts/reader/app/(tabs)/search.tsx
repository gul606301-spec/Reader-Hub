import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { Book, featuredBooks } from '@/data/catalog';
import { Cover, EmptyState, LoadingState, Screen, SearchField, SectionTitle } from '@/components/ReaderUI';

const searchOpenLibrary = async (query: string): Promise<Book[]> => {
  const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=15`);
  if (!response.ok) throw new Error('Search failed');
  const payload = (await response.json()) as { docs?: Array<Record<string, unknown>> };
  return (payload.docs ?? []).map((item, index) => {
    const isbn = Array.isArray(item.isbn) ? item.isbn[0] : undefined;
    return {
      id: String(item.key ?? `${query}-${index}`),
      title: String(item.title ?? 'İsimsiz kitap'),
      author: Array.isArray(item.author_name) ? String(item.author_name[0]) : 'Bilinmeyen yazar',
      cover: isbn ? `https://covers.openlibrary.org/b/isbn/${String(isbn)}-M.jpg` : undefined,
      pages: Number(item.number_of_pages_median ?? 240),
      year: Number(item.first_publish_year ?? 0) || undefined,
    };
  });
};

export default function SearchScreen() {
  const colors = useColors();
  const { isInLibrary } = useReader();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      void searchOpenLibrary(query.trim())
        .then(setResults)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const openBook = (book: Book) =>
    router.push({ pathname: '/book/[id]', params: { id: book.id, title: book.title, author: book.author, cover: book.cover ?? '', pages: String(book.pages), description: book.description ?? '' } });
  const visibleBooks = query.trim() ? results : featuredBooks;
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>KEŞFET</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Bir sonraki{'\n'}kitabını bul.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Başlık, yazar veya ISBN ile ara.</Text>
      </View>
      <SearchField value={query} onChangeText={setQuery} placeholder="Kitap veya yazar ara" />
      <View style={styles.section}>
        <SectionTitle title={query ? 'Arama sonuçları' : 'Bugün popüler'} />
        {loading ? <LoadingState /> : error ? <EmptyState icon="cloud-offline-outline" title="Arama yapılamadı" message="Bağlantını kontrol edip tekrar deneyebilirsin." /> : visibleBooks.length === 0 ? <EmptyState icon="search-outline" title="Sonuç bulunamadı" message="Başka bir başlık veya yazar adı dene." /> : visibleBooks.map((book) => (
          <Pressable key={book.id} onPress={() => openBook(book)} style={({ pressed }) => [styles.resultRow, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}>
            <Cover book={book} size="small" />
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
              <Text style={[styles.resultAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>
              <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>{book.pages} sayfa{book.year ? ` · ${book.year}` : ''}</Text>
            </View>
            {isInLibrary(book.id) ? <IonIconMark color={colors.primary} /> : <Text style={[styles.addMark, { color: colors.primary }]}>+</Text>}
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function IonIconMark({ color }: { color: string }) {
  return <View style={[styles.inLibrary, { backgroundColor: color }]}><Text style={styles.check}>✓</Text></View>;
}

const styles = StyleSheet.create({
  header: { marginBottom: 22 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 34, marginTop: 7 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 8 },
  section: { marginTop: 28 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 18, padding: 11, marginBottom: 11 },
  resultInfo: { flex: 1, minWidth: 0 },
  resultTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 19 },
  resultAuthor: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  resultMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 7 },
  addMark: { fontFamily: 'Inter_400Regular', fontSize: 28, paddingHorizontal: 7 },
  inLibrary: { width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  check: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
});
