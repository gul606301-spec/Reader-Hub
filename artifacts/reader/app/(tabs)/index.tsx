import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { featuredBooks, formatMinutes } from '@/data/catalog';
import { Cover, LibraryRow, PrimaryButton, Screen, SectionTitle, Wordmark } from '@/components/ReaderUI';

export default function HomeScreen() {
  const colors = useColors();
  const { profile, library, recordReading, logReading } = useReader();
  const [pagesValue, setPagesValue] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  if (!profile) return null;
  const current = library.find((book) => book.status === 'reading') ?? library[0];
  const activeBooks = library.filter((book) => book.status === 'reading');
  const goalProgress = Math.min(100, Math.round((profile.todayPages / Math.max(profile.dailyGoal, 1)) * 100));
  const openBook = (book: typeof featuredBooks[number]) =>
    router.push({ pathname: '/book/[id]', params: { id: book.id, title: book.title, author: book.author, cover: book.cover ?? '', pages: String(book.pages), description: book.description ?? '' } });
  const saveQuickReading = () => {
    const pages = Math.max(0, Math.floor(Number(pagesValue)));
    if (!Number.isFinite(pages) || pages === 0) return;
    const bookId = activeBooks.some((book) => book.id === selectedBookId)
      ? selectedBookId
      : activeBooks.length === 1
        ? activeBooks[0].id
        : undefined;
    recordReading(pages, bookId);
    setPagesValue('');
    Alert.alert('Kaydedildi', `${pages} sayfa bugünkü toplamına eklendi.`);
  };

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

      <View style={[styles.heroCard, { backgroundColor: colors.foreground }]}>
        <View style={styles.heroTop}>
          <View style={[styles.streakIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="flame" size={20} color={colors.primaryForeground} />
          </View>
          <Text style={[styles.streakText, { color: colors.background }]}>{profile.streak} günlük seri</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.background }]}>
          Bugün okumaya{'\n'}{profile.dailyGoal} sayfa ayır.
        </Text>
        <View style={styles.goalRow}>
          <View style={[styles.goalTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.goalFill, { backgroundColor: colors.primary, width: `${goalProgress}%` }]} />
          </View>
          <Text style={[styles.goalText, { color: colors.background }]}>{profile.todayPages}/{profile.dailyGoal}</Text>
        </View>
        <Text style={[styles.goalHint, { color: colors.mutedForeground }]}>
          {profile.todayPages >= profile.dailyGoal ? 'Harika, bugünkü hedef tamamlandı.' : `${profile.dailyGoal - profile.todayPages} sayfa daha. Sen yaparsın.`}
        </Text>
      </View>

      <View style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.quickHeader}>
          <View>
            <Text style={[styles.quickTitle, { color: colors.foreground }]}>Bugün okuduğun sayfaları ekle</Text>
            <Text style={[styles.quickSubtitle, { color: colors.mutedForeground }]}>Yeni kayıt mevcut toplamın üzerine eklenir.</Text>
          </View>
          <Ionicons name="flash-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.quickInputRow}>
          <View style={[styles.quickInputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              value={pagesValue}
              onChangeText={setPagesValue}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.quickInput, { color: colors.foreground }]}
              accessibilityLabel="Bugün okunan sayfa"
            />
            <Text style={[styles.quickUnit, { color: colors.mutedForeground }]}>sayfa</Text>
          </View>
          <Pressable
            onPress={saveQuickReading}
            disabled={!pagesValue}
            style={({ pressed }) => [
              styles.quickSave,
              { backgroundColor: colors.primary, opacity: !pagesValue ? 0.45 : pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
            <Text style={[styles.quickSaveText, { color: colors.primaryForeground }]}>Kaydet</Text>
          </Pressable>
        </View>
        {activeBooks.length > 1 ? (
          <View style={styles.quickBookPicker}>
            <Text style={[styles.quickPickerLabel, { color: colors.mutedForeground }]}>Kitap</Text>
            <View style={styles.quickBookOptions}>
              {activeBooks.map((book) => (
                <Pressable
                  key={book.id}
                  onPress={() => setSelectedBookId(book.id)}
                  style={[
                    styles.quickBookOption,
                    {
                      backgroundColor: selectedBookId === book.id ? colors.foreground : colors.background,
                      borderColor: selectedBookId === book.id ? colors.foreground : colors.border,
                    },
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.quickBookText, { color: selectedBookId === book.id ? colors.background : colors.foreground }]}>
                    {book.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : activeBooks.length === 1 ? (
          <Text style={[styles.quickAutoLink, { color: colors.mutedForeground }]}>“{activeBooks[0].title}” kitabına otomatik eklenir.</Text>
        ) : null}
      </View>

      {current ? (
        <View>
          <SectionTitle title="Şu an okuyorum" action="Detay" onAction={() => openBook(current)} />
          <LibraryRow book={current} onPress={() => openBook(current)} onLog={() => logReading(current.id, 10, 15)} />
        </View>
      ) : (
        <View style={styles.firstBook}>
          <Text style={[styles.firstBookTitle, { color: colors.foreground }]}>İlk kitabını seçmeye hazır mısın?</Text>
          <Text style={[styles.firstBookText, { color: colors.mutedForeground }]}>Aramadan bir kitap bul ve okuma yolculuğunu başlat.</Text>
          <PrimaryButton label="Kitap keşfet" icon="search" onPress={() => router.push('/search')} />
        </View>
      )}

      <View style={styles.statsHeader}>
        <SectionTitle title="Bugünün özeti" />
        <View style={styles.miniStats}>
          <View style={[styles.miniStat, { backgroundColor: colors.card }]}>
            <Ionicons name="book-outline" size={18} color={colors.primary} />
            <Text style={[styles.miniNumber, { color: colors.foreground }]}>{profile.todayPages}</Text>
            <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>sayfa</Text>
          </View>
          <View style={[styles.miniStat, { backgroundColor: colors.card }]}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={[styles.miniNumber, { color: colors.foreground }]}>{formatMinutes(profile.todayMinutes)}</Text>
            <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>okuma</Text>
          </View>
        </View>
      </View>

      <SectionTitle title="Senin için seçtiklerimiz" action="Tümünü gör" onAction={() => router.push('/search')} />
      <View style={styles.featuredRow}>
        {featuredBooks.slice(0, 3).map((book) => (
          <Pressable key={book.id} onPress={() => openBook(book)} style={({ pressed }) => [styles.featuredBook, { opacity: pressed ? 0.8 : 1 }]}>
            <Cover book={book} size="medium" />
            <Text style={[styles.featuredTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
            <Text style={[styles.featuredAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>
          </Pressable>
        ))}
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
  heroCard: { borderRadius: 24, padding: 20, marginBottom: 26, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  streakIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  streakText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 31, marginTop: 18, letterSpacing: -0.5 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 22 },
  goalTrack: { height: 8, flex: 1, borderRadius: 8, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 8 },
  goalText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  goalHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 10 },
  quickCard: { borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 24 },
  quickHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  quickTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  quickSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  quickInputRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  quickInputWrap: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  quickInput: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 17, paddingVertical: 0 },
  quickUnit: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  quickSave: { minHeight: 46, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 5 },
  quickSaveText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  quickBookPicker: { marginTop: 11 },
  quickPickerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 6 },
  quickBookOptions: { flexDirection: 'row', gap: 7 },
  quickBookOption: { flex: 1, borderWidth: 1, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 8 },
  quickBookText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  quickAutoLink: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 9 },
  firstBook: { padding: 18, borderRadius: 20, marginBottom: 22, gap: 8 },
  firstBookTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  firstBookText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginBottom: 5 },
  statsHeader: { marginBottom: 25 },
  miniStats: { flexDirection: 'row', gap: 10 },
  miniStat: { flex: 1, borderRadius: 18, padding: 14, gap: 7 },
  miniNumber: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  miniLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  featuredRow: { flexDirection: 'row', gap: 12 },
  featuredBook: { flex: 1, minWidth: 0 },
  featuredTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, marginTop: 9 },
  featuredAuthor: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
});
