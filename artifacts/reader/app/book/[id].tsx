import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { Book, ReadingStatus, statusLabel } from '@/data/catalog';
import { Cover, PrimaryButton, ProgressBar, Screen, StatusPill } from '@/components/ReaderUI';

export default function BookDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string; title?: string; author?: string; cover?: string; pages?: string; description?: string }>();
  const { addToLibrary, updateBook, removeFromLibrary, library, isInLibrary, logReading } = useReader();
  const libraryBook = library.find((item) => item.id === params.id);
  const book: Book = {
    id: params.id,
    title: params.title ?? libraryBook?.title ?? 'Kitap',
    author: params.author ?? libraryBook?.author ?? 'Bilinmeyen yazar',
    cover: params.cover ?? libraryBook?.cover,
    pages: Number(params.pages ?? libraryBook?.pages ?? 240),
    description: params.description ?? libraryBook?.description,
  };
  const [selectedStatus, setSelectedStatus] = useState<ReadingStatus>(libraryBook?.status ?? 'want');
  const handleAdd = () => {
    if (libraryBook) {
      updateBook(book.id, { status: selectedStatus });
      Alert.alert('Kitap güncellendi', `Durumu: ${statusLabel(selectedStatus)}`);
    } else {
      addToLibrary(book, selectedStatus);
      Alert.alert('Kitaplığına eklendi', 'Kitabın kişisel rafına kaydedildi.');
    }
  };
  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
      <View style={styles.bookHero}>
        <Cover book={book} size="large" />
        <View style={styles.heroInfo}>
          <Text style={[styles.title, { color: colors.foreground }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.mutedForeground }]}>{book.author}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{book.pages} sayfa{book.year ? ` · ${book.year}` : ''}</Text>
        </View>
      </View>
      {libraryBook ? (
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}><Text style={[styles.progressTitle, { color: colors.foreground }]}>Okuma ilerlemesi</Text><StatusPill status={libraryBook.status} /></View>
          <ProgressBar progress={libraryBook.progress} total={libraryBook.pages} />
          <Pressable onPress={() => logReading(book.id, 10, 15)} style={[styles.logButton, { borderColor: colors.primary }]}><Ionicons name="add" size={17} color={colors.primary} /><Text style={[styles.logText, { color: colors.primary }]}>10 sayfa oku</Text></Pressable>
        </View>
      ) : null}
      <Text style={[styles.descriptionTitle, { color: colors.foreground }]}>Kitap hakkında</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{book.description ?? 'Bu kitap hakkında daha fazla bilgi için keşfetmeye devam et.'}</Text>
      <Text style={[styles.statusTitle, { color: colors.foreground }]}>Okuma durumun</Text>
      <View style={styles.statusRow}>
        {(['reading', 'finished', 'want'] as ReadingStatus[]).map((status) => (
          <Pressable key={status} onPress={() => setSelectedStatus(status)} style={[styles.statusOption, { backgroundColor: selectedStatus === status ? colors.foreground : colors.card, borderColor: selectedStatus === status ? colors.foreground : colors.border }]}>
            <Text style={[styles.statusOptionText, { color: selectedStatus === status ? colors.background : colors.mutedForeground }]}>{statusLabel(status)}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label={libraryBook ? 'Durumu güncelle' : 'Kitaplığıma ekle'} icon={libraryBook ? 'checkmark' : 'add'} onPress={handleAdd} />
      {isInLibrary(book.id) ? <Pressable onPress={() => { removeFromLibrary(book.id); router.back(); }} style={styles.remove}><Text style={[styles.removeText, { color: colors.destructive }]}>Kitaplıktan kaldır</Text></Pressable> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center', marginBottom: 14 },
  bookHero: { flexDirection: 'row', gap: 18, marginBottom: 25 },
  heroInfo: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, lineHeight: 31, letterSpacing: -0.4 },
  author: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, marginTop: 9 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 13 },
  progressCard: { borderRadius: 20, padding: 16, marginBottom: 25 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  progressTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  logButton: { borderWidth: 1, borderRadius: 12, minHeight: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, marginTop: 14 },
  logText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  descriptionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 8 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginBottom: 26 },
  statusTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 12 },
  statusRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  statusOption: { borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, flex: 1, alignItems: 'center' },
  statusOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  remove: { alignItems: 'center', paddingVertical: 18 },
  removeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
