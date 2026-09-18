import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { formatMinutes } from '@/data/catalog';
import { DailyReadingModal } from '@/components/DailyReadingModal';
import { PrimaryButton, Screen, SectionTitle, Wordmark } from '@/components/ReaderUI';

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, library, readingLogs, updateProfile, recordReading, updateReadingLog, signOut } = useReader();
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  if (!profile) return null;
  const finished = library.filter((book) => book.status === 'finished').length;
  const totalPages = library.reduce((sum, book) => sum + book.progress, 0);
  return (
    <Screen>
      <View style={styles.topBar}><Wordmark compact /><Text style={[styles.topLabel, { color: colors.mutedForeground }]}>PROFİL</Text></View>
      <View style={[styles.profileCard, { backgroundColor: colors.foreground }]}>
        <View style={[styles.bigAvatar, { backgroundColor: colors.primary }]}><Text style={[styles.bigAvatarText, { color: colors.primaryForeground }]}>{profile.name.charAt(0).toUpperCase()}</Text></View>
        <Text style={[styles.profileName, { color: colors.background }]}>{profile.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{profile.email}</Text>
        <View style={styles.profileStats}>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{library.length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>kitap</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{finished}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>tamamlandı</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.background }]}>{profile.streak}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>seri</Text></View>
        </View>
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
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow icon="analytics-outline" title="Toplam okuma" value={`${totalPages} sayfa · ${formatMinutes(library.reduce((sum, book) => sum + book.minutes, 0))}`} />
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
