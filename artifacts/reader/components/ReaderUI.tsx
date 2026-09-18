import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  Book,
  LibraryBook,
  ReadingStatus,
  statusLabel,
} from '@/data/catalog';

export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  const colors = useColors();
  const Container = scroll ? require('react-native').ScrollView : View;
  return (
    <Container
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={scroll ? styles.screenContent : undefined}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </Container>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.wordmarkRow}>
      <View style={[styles.wordmarkMark, { backgroundColor: colors.primary }]}>
        <Ionicons name="bookmark" size={compact ? 14 : 17} color={colors.primaryForeground} />
      </View>
      <Text style={[styles.wordmark, { color: colors.foreground, fontSize: compact ? 20 : 25 }]}>
        READER
      </Text>
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Cover({
  book,
  size = 'medium',
}: {
  book: Book;
  size?: 'small' | 'medium' | 'large';
}) {
  const colors = useColors();
  const dimensions =
    size === 'small'
      ? { width: 64, height: 92 }
      : size === 'large'
        ? { width: 132, height: 194 }
        : { width: 100, height: 146 };
  return (
    <View style={[styles.coverWrap, dimensions, { backgroundColor: colors.secondary }]}>
      {book.cover ? (
        <Image source={book.cover} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <Ionicons name="book-outline" size={28} color={colors.mutedForeground} />
      )}
    </View>
  );
}

export function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const colors = useColors();
  const percentage = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  return (
    <View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${percentage}%` }]} />
      </View>
      <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
        {percentage}% tamamlandı
      </Text>
    </View>
  );
}

export function StatusPill({ status }: { status: ReadingStatus }) {
  const colors = useColors();
  const palette = status === 'reading' ? colors.primary : status === 'finished' ? colors.accent : colors.secondary;
  const foreground = status === 'reading' ? colors.primaryForeground : colors.foreground;
  return (
    <View style={[styles.pill, { backgroundColor: palette }]}>
      <Text style={[styles.pillText, { color: foreground }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function LibraryRow({
  book,
  onPress,
  onLog,
}: {
  book: LibraryBook;
  onPress: () => void;
  onLog?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.libraryRow, { backgroundColor: colors.card, opacity: pressed ? 0.82 : 1 }]}
    >
      <Cover book={book} size="small" />
      <View style={styles.libraryInfo}>
        <View style={styles.libraryTitleRow}>
          <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
            {book.title}
          </Text>
          <StatusPill status={book.status} />
        </View>
        <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
          {book.author}
        </Text>
        <ProgressBar progress={book.progress} total={book.pages} />
        {onLog && book.status !== 'finished' ? (
          <Pressable onPress={onLog} style={[styles.quickLog, { borderColor: colors.border }]} hitSlop={6}>
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={[styles.quickLogText, { color: colors.primary }]}>Okuma ekle</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.primaryForeground} /> : null}
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.mutedForeground }]}>{message}</Text>
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmitEditing?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.searchField, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.searchInput, { color: colors.foreground }]}
        returnKeyType="search"
        autoCapitalize="none"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Yükleniyor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { padding: 22, paddingBottom: 120 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmarkMark: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontFamily: 'Inter_700Bold', letterSpacing: 2.5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  sectionAction: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  coverWrap: { borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  progressTrack: { height: 6, borderRadius: 6, overflow: 'hidden', marginTop: 9 },
  progressFill: { height: '100%', borderRadius: 6 },
  progressLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 6 },
  pill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  pillText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  libraryRow: { flexDirection: 'row', padding: 12, borderRadius: 18, gap: 13, marginBottom: 12 },
  libraryInfo: { flex: 1, minWidth: 0 },
  libraryTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  bookTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20, flex: 1 },
  bookAuthor: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 5 },
  quickLog: { borderWidth: 1, alignSelf: 'flex-start', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
  quickLogText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  primaryButton: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  emptyState: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', padding: 24, marginTop: 6 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  emptyMessage: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6, maxWidth: 270 },
  searchField: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, paddingVertical: 0 },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 9 },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
