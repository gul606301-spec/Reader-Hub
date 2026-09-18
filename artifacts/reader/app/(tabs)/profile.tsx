import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { formatMinutes } from '@/data/catalog';
import { LibraryBook, ReaderProfile } from '@/data/catalog';
import { DailyReadingModal } from '@/components/DailyReadingModal';
import { Cover, PrimaryButton, ProgressBar, Screen, SectionTitle, Wordmark } from '@/components/ReaderUI';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, library, readingLogs, updateProfile, recordReading, updateReadingLog, signOut } = useReader();
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);
  const [pagesValue, setPagesValue] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  if (!profile) return null;
  const finished = library.filter((book) => book.status === 'finished').length;
  const totalPages = library.reduce((sum, book) => sum + book.progress, 0);
  const totalMinutes = library.reduce((sum, book) => sum + book.minutes, 0);
  const activeBooks = library.filter((book) => book.status === 'reading');
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthLogs = readingLogs.filter((log) => log.date.startsWith(monthKey));
  const monthPages = monthLogs.reduce((sum, log) => sum + log.pages, 0);
  const monthBooks = new Set(monthLogs.map((log) => log.bookId).filter(Boolean)).size;
  const progress = Math.min(100, Math.round((profile.todayPages / Math.max(profile.dailyGoal, 1)) * 100));
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
    <Screen>
      <View style={styles.topBar}><Wordmark compact /><Text style={[styles.topLabel, { color: colors.mutedForeground }]}>PROFİL</Text></View>
      <View style={[styles.profileCard, { backgroundColor: colors.foreground }]}>
        <View style={styles.profileIdentity}>
          <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}><Text style={[styles.bigAvatarText, { color: colors.primaryForeground }]}>{profile.name.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.identityInfo}>
            <Text style={[styles.profileName, { color: colors.background }]}>{profile.name}</Text>
            <Text style={[styles.profileUsername, { color: colors.mutedForeground }]}>@{profile.username ?? 'reader'}</Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{profile.email}</Text>
            <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>{profile.phone ?? 'Telefon eklenmedi'}</Text>
          </View>
          <Pressable onPress={() => setAccountModalVisible(true)} style={[styles.editButton, { backgroundColor: colors.secondary }]} hitSlop={8}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <View style={styles.verificationRow}>
          <Text style={[styles.verificationText, { color: colors.mutedForeground }]}>
            {profile.emailVerified ? 'E-posta doğrulandı' : 'E-posta doğrulanmadı'}
          </Text>
          <Text style={[styles.verificationText, { color: colors.mutedForeground }]}>
            {profile.phoneVerified ? 'Telefon doğrulandı' : 'Telefon eklenmedi'}
          </Text>
        </View>
        <View style={styles.profileStats}>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{library.length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>kitap</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{finished}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>tamamlandı</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{profile.streak}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>seri</Text></View>
        </View>
      </View>

      <SectionTitle title="Günlük okuma" />
      <View style={[styles.dailyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.dailyHeader}>
          <View>
            <Text style={[styles.dailyTitle, { color: colors.foreground }]}>{profile.todayPages}/{profile.dailyGoal} sayfa</Text>
            <Text style={[styles.dailySubtitle, { color: colors.mutedForeground }]}>
              {profile.todayPages >= profile.dailyGoal ? 'Bugünkü hedef tamamlandı.' : `${Math.max(0, profile.dailyGoal - profile.todayPages)} sayfa kaldı.`}
            </Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={colors.primary} />
            <Text style={[styles.streakBadgeText, { color: colors.primary }]}>{profile.streak}</Text>
          </View>
        </View>
        <View style={[styles.dailyTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.dailyFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
        </View>
        <Text style={[styles.dailyPercent, { color: colors.mutedForeground }]}>{progress}% tamamlandı</Text>
        <View style={[styles.quickLogRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <TextInput
            value={pagesValue}
            onChangeText={setPagesValue}
            keyboardType="number-pad"
            placeholder="Bugün okunan sayfa"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.quickLogInput, { color: colors.foreground }]}
            accessibilityLabel="Bugün okunan sayfa"
          />
          <Pressable
            onPress={saveQuickReading}
            disabled={!pagesValue}
            style={[styles.quickLogButton, { backgroundColor: colors.primary, opacity: pagesValue ? 1 : 0.45 }]}
          >
            <Ionicons name="checkmark" size={17} color={colors.primaryForeground} />
            <Text style={[styles.quickLogButtonText, { color: colors.primaryForeground }]}>Kaydet</Text>
          </Pressable>
        </View>
        {activeBooks.length > 1 ? (
          <View style={styles.bookPicker}>
            <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Kayıt yapılacak kitap</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bookOptions}>
              {activeBooks.map((book) => (
                <Pressable
                  key={book.id}
                  onPress={() => setSelectedBookId(book.id)}
                  style={[
                    styles.bookOption,
                    {
                      backgroundColor: selectedBookId === book.id ? colors.foreground : colors.background,
                      borderColor: selectedBookId === book.id ? colors.foreground : colors.border,
                    },
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.bookOptionText, { color: selectedBookId === book.id ? colors.background : colors.foreground }]}>{book.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : activeBooks.length === 1 ? (
          <Text style={[styles.autoLink, { color: colors.mutedForeground }]}>Kayıt “{activeBooks[0].title}” kitabına otomatik eklenir.</Text>
        ) : (
          <Text style={[styles.autoLink, { color: colors.mutedForeground }]}>Aktif kitabın yok; kayıt yalnızca günlük toplamına eklenir.</Text>
        )}
        <Pressable onPress={() => setGoalModalVisible(true)} style={styles.detailLink} hitSlop={8}>
          <Text style={[styles.detailLinkText, { color: colors.primary }]}>Hedefi ve kayıtları yönet</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <SectionTitle title="Şu an okuyorum" />
      {activeBooks.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeBooksRow}>
          {activeBooks.map((book) => (
            <Pressable key={book.id} onPress={() => openBook(book)} style={[styles.activeBookCard, { backgroundColor: colors.card }]}>
              <Cover book={book} size="small" />
              <View style={styles.activeBookInfo}>
                <Text style={[styles.activeBookTitle, { color: colors.foreground }]} numberOfLines={2}>{book.title}</Text>
                <Text style={[styles.activeBookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>{book.author}</Text>
                <ProgressBar progress={book.progress} total={book.pages} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.emptyReading, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyReadingText, { color: colors.mutedForeground }]}>Aktif bir kitabın yok.</Text>
          <Pressable onPress={() => router.push('/search')}><Text style={[styles.detailLinkText, { color: colors.primary }]}>Kitap keşfet</Text></Pressable>
        </View>
      )}

      <SectionTitle title="Bugünün özeti" />
      <View style={styles.summaryGrid}>
        <SummaryTile icon="book-outline" value={`${profile.todayPages}`} label="okunan sayfa" colors={colors} />
        <SummaryTile icon="time-outline" value={formatMinutes(profile.todayMinutes)} label="okuma süresi" colors={colors} />
        <SummaryTile icon="flag-outline" value={profile.todayPages >= profile.dailyGoal ? 'Tamamlandı' : 'Devam ediyor'} label="günlük hedef" colors={colors} />
        <SummaryTile icon="flame-outline" value={profile.streak > 0 ? `${profile.streak} gün` : 'Başla'} label="streak durumu" colors={colors} />
      </View>

      <SectionTitle title="İstatistikler" />
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <StatLine label="Toplam okunan kitap" value={`${finished}`} colors={colors} />
        <StatLine label="Toplam okunan sayfa" value={`${totalPages}`} colors={colors} />
        <StatLine label="Toplam okuma süresi" value={formatMinutes(totalMinutes)} colors={colors} />
        <StatLine label="En uzun streak" value={`${profile.longestStreak ?? profile.streak} gün`} colors={colors} />
        <StatLine label="Bu ay okunan kitap" value={`${monthBooks}`} colors={colors} />
        <StatLine label="Bu ay okunan sayfa" value={`${monthPages}`} colors={colors} />
      </View>

      <SectionTitle title="Okuma ayarları" />
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <SettingRow icon="flag-outline" title="Günlük hedef" value={`${profile.dailyGoal} sayfa`} onPress={() => setGoalModalVisible(true)} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.settingRow}>
          <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Ionicons name="notifications-outline" size={18} color={colors.primary} /></View>
          <View style={styles.settingText}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Okuma hatırlatması</Text><Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{profile.reminderTime} · Her gün</Text></View>
          <Switch value={profile.reminderEnabled} onValueChange={(value) => updateProfile({ reminderEnabled: value })} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor={colors.card} />
        </View>
      </View>
      <SectionTitle title="Hesap" />
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <SettingRow icon="person-outline" title="Hesap bilgileri" value="İsim, kullanıcı adı, e-posta ve telefon" onPress={() => setAccountModalVisible(true)} />
      </View>
      <View style={[styles.tipCard, { backgroundColor: colors.secondary }]}>
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <View style={styles.tipText}><Text style={[styles.tipTitle, { color: colors.foreground }]}>Küçük adımlar, büyük hikâyeler.</Text><Text style={[styles.tipBody, { color: colors.mutedForeground }]}>Hedefini düşük tutmak sorun değil. Önemli olan her gün geri dönmek.</Text></View>
      </View>
      <PrimaryButton label="Oturumu kapat" onPress={signOut} />
      <DailyReadingModal
        visible={isGoalModalVisible}
        profile={profile}
        activeBooks={library.filter((book) => book.status === 'reading')}
        allBooks={library}
        logs={readingLogs}
        onClose={() => setGoalModalVisible(false)}
        onGoalChange={(goal) => updateProfile({ dailyGoal: goal })}
        onSaveReading={(pages, bookId) => recordReading(pages, bookId)}
        onEditLog={updateReadingLog}
      />
      <AccountEditModal
        visible={isAccountModalVisible}
        profile={profile}
        onClose={() => setAccountModalVisible(false)}
        onSave={(changes) => updateProfile(changes)}
      />
    </Screen>
  );
}

function SettingRow({ icon, title, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: colors.secondary }]}><Ionicons name={icon} size={18} color={colors.primary} /></View>
      <View style={styles.settingText}><Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text></View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 23 },
  topLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 },
  profileCard: { borderRadius: 24, padding: 22, alignItems: 'center', marginBottom: 28 },
  bigAvatar: { width: 70, height: 70, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  bigAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 28 },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  profileEmail: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  profileStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' },
  statNumber: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  settingsCard: { borderRadius: 20, paddingHorizontal: 15, marginBottom: 18 },
  settingRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1 },
  settingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  settingValue: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  divider: { height: 1 },
  tipCard: { borderRadius: 20, padding: 16, flexDirection: 'row', gap: 11, marginBottom: 18 },
  tipText: { flex: 1 },
  tipTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  tipBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 4 },
});
