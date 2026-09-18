import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { LibraryBook } from '@/data/catalog';
import { EmptyState } from '@/components/ReaderUI';

const SHELF_COUNT = 4;

function chunkBooks(books: LibraryBook[], capacity: number) {
  const pages: LibraryBook[][] = [];
  for (let index = 0; index < books.length; index += capacity) {
    pages.push(books.slice(index, index + capacity));
  }
  return pages;
}

function ShelfBook({
  book,
  width,
  height,
  onPress,
}: {
  book: LibraryBook;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${book.title} kitabını aç`}
      style={({ pressed }) => [
        styles.shelfBook,
        {
          width,
          height,
          backgroundColor: colors.secondary,
          opacity: pressed ? 0.72 : 1,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}
    >
      {book.cover ? (
        <Image source={book.cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
      ) : (
        <Ionicons name="book-outline" size={20} color={colors.mutedForeground} />
      )}
      <View style={[styles.bookSpine, { backgroundColor: colors.foreground }]} />
      {book.progress >= book.pages ? (
        <View style={[styles.finishedMark, { backgroundColor: colors.accent }]}>
          <Ionicons name="checkmark" size={10} color={colors.foreground} />
        </View>
      ) : null}
    </Pressable>
  );
}

function ShelfRow({
  books,
  bookWidth,
  bookHeight,
  onBookPress,
}: {
  books: LibraryBook[];
  bookWidth: number;
  bookHeight: number;
  onBookPress: (book: LibraryBook) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.shelfRow}>
      <View style={styles.booksRow}>
        {books.map((book) => (
          <ShelfBook
            key={book.id}
            book={book}
            width={bookWidth}
            height={bookHeight}
            onPress={() => onBookPress(book)}
          />
        ))}
      </View>
      <View style={[styles.shelfBoard, { backgroundColor: colors.primary }]} />
    </View>
  );
}

function BookcasePage({
  books,
  bookWidth,
  bookHeight,
  onBookPress,
}: {
  books: LibraryBook[];
  bookWidth: number;
  bookHeight: number;
  onBookPress: (book: LibraryBook) => void;
}) {
  const colors = useColors();
  const shelves = Array.from({ length: SHELF_COUNT }, (_, shelfIndex) =>
    books.slice(shelfIndex * Math.ceil(books.length / SHELF_COUNT), (shelfIndex + 1) * Math.ceil(books.length / SHELF_COUNT)),
  );

  return (
    <View style={[styles.bookcase, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.bookcaseTop, { backgroundColor: colors.foreground }]} />
      <View style={styles.shelves}>
        {shelves.map((shelfBooks, index) => (
          <ShelfRow
            key={`shelf-${index}`}
            books={shelfBooks}
            bookWidth={bookWidth}
            bookHeight={bookHeight}
            onBookPress={onBookPress}
          />
        ))}
      </View>
      <View style={[styles.bookcaseFoot, { backgroundColor: colors.foreground }]} />
    </View>
  );
}

export default function LibraryScreen() {
  const colors = useColors();
  const { library } = useReader();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);

  const layout = useMemo(() => {
    const horizontalPadding = 34;
    const availableWidth = Math.max(260, width - horizontalPadding * 2);
    const columns = availableWidth < 330 ? 4 : 5;
    const gap = columns === 4 ? 7 : 5;
    const bookWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);
    const bookHeight = Math.min(104, Math.max(78, Math.round(bookWidth * 1.42)));
    return { columns, capacity: columns * SHELF_COUNT, bookWidth, bookHeight, gap };
  }, [width]);

  const pages = useMemo(
    () => chunkBooks(library, layout.capacity),
    [layout.capacity, library],
  );

  const openBook = (book: LibraryBook) =>
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

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 84 : 76),
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KİTAPLARIN</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Kitaplığım</Text>
        </View>
        <Pressable
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel="Kitap ekle"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.78 : 1 },
          ]}
          hitSlop={8}
        >
          <Ionicons name="add" size={23} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {library.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="library-outline"
            title="Kitaplığın henüz boş"
            message="Arama sekmesinden bir kitap bulup ilk rafını oluşturmaya başlayabilirsin."
          />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const nextPage = Math.round(event.nativeEvent.contentOffset.x / width);
              setActivePage(Math.max(0, Math.min(nextPage, pages.length - 1)));
            }}
            style={styles.pages}
            contentContainerStyle={styles.pagesContent}
          >
            {pages.map((books, index) => (
              <View key={`library-page-${index}`} style={{ width }}>
                <BookcasePage
                  books={books}
                  bookWidth={layout.bookWidth}
                  bookHeight={layout.bookHeight}
                  onBookPress={openBook}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.pageFooter}>
            <Text style={[styles.pageLabel, { color: colors.mutedForeground }]}>
              Kitaplık {activePage + 1} / {pages.length}
            </Text>
            <View style={styles.dots}>
              {pages.map((_, index) => (
                <View
                  key={`page-dot-${index}`}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: index === activePage ? colors.primary : colors.border,
                      width: index === activePage ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
            {pages.length > 1 ? (
              <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                Kaydır
              </Text>
            ) : (
              <Text style={[styles.swipeHint, { color: colors.mutedForeground }]}>
                {library.length} kitap
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, marginTop: 5 },
  addButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pages: { flex: 1 },
  pagesContent: { alignItems: 'stretch' },
  bookcase: {
    flex: 1,
    marginHorizontal: 17,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 11,
    overflow: 'hidden',
  },
  bookcaseTop: { height: 8, borderRadius: 6, opacity: 0.92, marginBottom: 5 },
  shelves: { flex: 1 },
  shelfRow: { flex: 1, justifyContent: 'flex-end' },
  booksRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 5 },
  shelfBoard: { height: 9, borderRadius: 5, opacity: 0.94, marginTop: 5 },
  bookcaseFoot: { height: 10, borderRadius: 6, marginTop: 8 },
  shelfBook: {
    borderRadius: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 2 },
    elevation: 3,
  },
  bookSpine: { position: 'absolute', left: 3, top: 0, bottom: 0, width: 3, opacity: 0.2 },
  finishedMark: { position: 'absolute', right: 4, top: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingBottom: 40 },
  pageFooter: { height: 48, alignItems: 'center', justifyContent: 'center', gap: 6 },
  pageLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 6 },
  dot: { height: 6, borderRadius: 6 },
  swipeHint: { position: 'absolute', right: 22, bottom: 7, fontFamily: 'Inter_400Regular', fontSize: 10 },
});