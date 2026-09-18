import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { featuredBooks } from '@/data/catalog';
import { Cover, PrimaryButton, Screen, SectionTitle } from '@/components/ReaderUI';

export default function HomeScreen() {
  const colors = useColors();
  const { profile, library } = useReader();
  if (!profile) return null;
  const activeBook = library.find((book) => book.status === 'reading');
  const goalProgress = Math.min(100, Math.round((profile.todayPages / Math.max(profile.dailyGoal, 1)) * 100));
  const openBook = (book: typeof featuredBooks[number]) =>
    router.push({ pathname: '/book/[id]', params: { id: book.id, title: book.title, author: book.author, cover: book.cover ?? '', pages: String(book.pages), description: book.description ?? '' } });

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Günaydın,</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
        </View>
        <Pressable onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: colors.primary }]} hitSlop={8}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{profile.name.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusHeader}>
          <View style={styles.statusHeading}>
            <View style={[styles.statusIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>Bugünün durumu</Text>
          </View>
          <Text style={[styles.statusStreak, { color: colors.primary }]}>{profile.streak} gün seri</Text>
        </View>
        <View style={styles.statusProgressRow}>
          <View style={[styles.statusTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.statusFill, { backgroundColor: colors.primary, width: `${goalProgress}%` }]} />
          </View>
          <Text style={[styles.statusCount, { color: colors.foreground }]}>{profile.todayPages}/{profile.dailyGoal}</Text>
        </View>
        <Text style={[styles.statusHint, { color: colors.mutedForeground }]}>
          {activeBook ? `Şu an: ${activeBook.title}` : 'Kitaplığından bir kitap seçerek başla.'}
        </Text>
      </View>

      {!activeBook ? (
        <View style={styles.firstBook}>
          <Text style={[styles.firstBookTitle, { color: colors.foreground }]}>İlk kitabını seçmeye hazır mısın?</Text>
          <Text style={[styles.firstBookText, { color: colors.mutedForeground }]}>Aramadan bir kitap bul ve okuma yolculuğunu başlat.</Text>
          <PrimaryButton label="Kitap keşfet" icon="search" onPress={() => router.push('/search')} />
        </View>
      ) : null}

      <SectionTitle title="Keşfet" action="Tümünü gör" onAction={() => router.push('/search')} />
      <View style={styles.featuredRow}>
        {featuredBooks.slice(0, 3).map((book) => (
          <Pressable key={book.id} onPress={() => openBook(book)} style={({ pressed }) => [styles.featuredBook, { opacity: pressed ? 0.8 : 1 }]}>
            <Cover book={book} size="medium" />
            <Text style={[styles.featuredTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
            <Text style={[styles.featuredAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.discoveryNote, { backgroundColor: colors.secondary }]}>
        <Ionicons name="book-outline" size={20} color={colors.primary} />
        <View style={styles.discoveryText}>
          <Text style={[styles.discoveryTitle, { color: colors.foreground }]}>Kitap dünyasına göz at</Text>
          <Text style={[styles.discoveryBody, { color: colors.mutedForeground }]}>Başlık, yazar veya ISBN ile yeni kitaplar keşfet.</Text>
        </View>
        <Pressable onPress={() => router.push('/search')} hitSlop={8}>
          <Ionicons name="arrow-forward" size={19} color={colors.primary} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 3 },
  avatar: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  statusCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 25 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  statusStreak: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  statusProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  statusTrack: { flex: 1, height: 7, borderRadius: 7, overflow: 'hidden' },
  statusFill: { height: '100%', borderRadius: 7 },
  statusCount: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  statusHint: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 9 },
  firstBook: { padding: 18, borderRadius: 20, marginBottom: 22, gap: 8 },
  firstBookTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  firstBookText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 5 },
  featuredRow: { flexDirection: 'row', gap: 12 },
  featuredBook: { flex: 1, minWidth: 0 },
  featuredTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 9 },
  featuredAuthor: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  discoveryNote: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 27 },
  discoveryText: { flex: 1 },
  discoveryTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  discoveryBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
});
