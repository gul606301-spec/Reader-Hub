import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { LibraryBook, ReadingStatus, statusLabel } from '@/data/catalog';
import { EmptyState, LibraryRow, Screen, SectionTitle } from '@/components/ReaderUI';

const filters: Array<{ value: ReadingStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'reading', label: 'Okuyorum' },
  { value: 'want', label: 'Okuyacağım' },
  { value: 'finished', label: 'Okudum' },
];

export default function LibraryScreen() {
  const colors = useColors();
  const { library, logReading } = useReader();
  const [filter, setFilter] = useState<ReadingStatus | 'all'>('all');
  const filtered = useMemo(
    () => filter === 'all' ? library : library.filter((book) => book.status === filter),
    [filter, library],
  );
  const openBook = (book: LibraryBook) =>
    router.push({ pathname: '/book/[id]', params: { id: book.id, title: book.title, author: book.author, cover: book.cover ?? '', pages: String(book.pages), description: book.description ?? '' } });
  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KİTAPLARIN</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Kitaplığım</Text>
        </View>
        <Pressable onPress={() => router.push('/search')} style={[styles.addButton, { backgroundColor: colors.primary }]} hitSlop={8}>
          <Text style={[styles.addText, { color: colors.primaryForeground }]}>+</Text>
        </Pressable>
      </View>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, { backgroundColor: filter === item.value ? colors.foreground : colors.card, borderColor: colors.border }]}>
            <Text style={[styles.filterText, { color: filter === item.value ? colors.background : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle title={`${filtered.length} kitap`} />
      {filtered.length === 0 ? (
        <EmptyState icon="library-outline" title="Kitaplığın henüz boş" message="Arama sekmesinden bir kitap bulup kişisel rafına ekleyebilirsin." />
      ) : (
        filtered.map((book) => <LibraryRow key={book.id} book={book} onPress={() => openBook(book)} onLog={() => logReading(book.id, 10, 15)} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 29, marginTop: 6 },
  addButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: 'Inter_400Regular', fontSize: 28, lineHeight: 28 },
  filterRow: { flexDirection: 'row', gap: 7, marginBottom: 25, flexWrap: 'wrap' },
  filter: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});
