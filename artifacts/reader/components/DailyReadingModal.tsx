import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { LibraryBook, ReadingLog, ReaderProfile } from '@/data/catalog';

type DailyReadingModalProps = {
  visible: boolean;
  profile: ReaderProfile;
  activeBooks: LibraryBook[];
  allBooks: LibraryBook[];
  logs: ReadingLog[];
  onClose: () => void;
  onGoalChange: (goal: number) => void;
  onSaveReading: (pages: number, bookId?: string) => void;
  onEditLog: (id: string, pages: number) => void;
};

export function DailyReadingModal({
  visible,
  profile,
  activeBooks,
  allBooks,
  logs,
  onClose,
  onGoalChange,
  onSaveReading,
  onEditLog,
}: DailyReadingModalProps) {
  const colors = useColors();
  const [goalValue, setGoalValue] = useState(String(profile.dailyGoal));
  const [pagesValue, setPagesValue] = useState('');
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>(activeBooks[0]?.id);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const todayLogs = useMemo(() => logs.filter((log) => log.date === new Date().toISOString().slice(0, 10)).slice(-5).reverse(), [logs]);
  const bookById = useMemo(() => new Map(allBooks.map((book) => [book.id, book])), [allBooks]);

  const saveGoal = () => {
    const nextGoal = Math.max(1, Math.floor(Number(goalValue)));
    if (Number.isFinite(nextGoal)) onGoalChange(nextGoal);
  };

  const saveReading = () => {
    const pages = Math.max(0, Math.floor(Number(pagesValue)));
    if (!Number.isFinite(pages) || pages === 0) return;
    onSaveReading(pages, selectedBookId);
    setPagesValue('');
  };

  const beginEdit = (log: ReadingLog) => {
    setEditingLogId(log.id);
    setEditingValue(String(log.pages));
  };

  const saveEdit = () => {
    if (!editingLogId) return;
    const pages = Math.max(0, Math.floor(Number(editingValue)));
    if (!Number.isFinite(pages)) return;
    onEditLog(editingLogId, pages);
    setEditingLogId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAwareScrollViewCompat
          contentContainerStyle={styles.scrollContent}
          bottomOffset={24}
        >
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>BUGÜN</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>Okuma hedefin</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.metrics}>
              <Metric label="Hedef" value={`${profile.dailyGoal} sayfa`} colors={colors} />
              <Metric label="Okunan" value={`${profile.todayPages} sayfa`} colors={colors} />
              <Metric
                label="Kalan"
                value={`${Math.max(0, profile.dailyGoal - profile.todayPages)} sayfa`}
                colors={colors}
              />
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(100, Math.round((profile.todayPages / Math.max(profile.dailyGoal, 1)) * 100))}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {Math.min(100, Math.round((profile.todayPages / Math.max(profile.dailyGoal, 1)) * 100))}% tamamlandı
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hedefi değiştir</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={goalValue}
                onChangeText={setGoalValue}
                keyboardType="number-pad"
                selectTextOnFocus
                style={[styles.input, { color: colors.foreground }]}
                accessibilityLabel="Günlük sayfa hedefi"
              />
              <Text style={[styles.inputSuffix, { color: colors.mutedForeground }]}>sayfa / gün</Text>
              <Pressable onPress={saveGoal} hitSlop={8}>
                <Text style={[styles.inlineAction, { color: colors.primary }]}>Kaydet</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bugün okuma ekle</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={pagesValue}
                onChangeText={setPagesValue}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                accessibilityLabel="Bugün okunan sayfa"
              />
              <Text style={[styles.inputSuffix, { color: colors.mutedForeground }]}>sayfa</Text>
              <Pressable
                onPress={saveReading}
                disabled={!pagesValue}
                style={[styles.saveButton, { backgroundColor: colors.primary, opacity: pagesValue ? 1 : 0.5 }]}
              >
                <Ionicons name="checkmark" size={17} color={colors.primaryForeground} />
                <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>Kaydet</Text>
              </Pressable>
            </View>

            {activeBooks.length > 1 ? (
              <View style={styles.bookPicker}>
                <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>Hangi kitaba eklensin?</Text>
                <View style={styles.bookOptions}>
                  {activeBooks.map((book) => (
                    <Pressable
                      key={book.id}
                      onPress={() => setSelectedBookId(book.id)}
                      style={[
                        styles.bookOption,
                        {
                          backgroundColor: selectedBookId === book.id ? colors.foreground : colors.card,
                          borderColor: selectedBookId === book.id ? colors.foreground : colors.border,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[styles.bookOptionText, { color: selectedBookId === book.id ? colors.background : colors.foreground }]}
                      >
                        {book.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : activeBooks.length === 1 ? (
              <Text style={[styles.autoLink, { color: colors.mutedForeground }]}>
                Kayıt otomatik olarak “{activeBooks[0].title}” kitabına eklenir.
              </Text>
            ) : (
              <Text style={[styles.autoLink, { color: colors.mutedForeground }]}>
                Aktif kitabın yok; kayıt yalnızca günlük hedefine eklenir.
              </Text>
            )}

            {todayLogs.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bugünkü kayıtlar</Text>
                <View style={[styles.logsCard, { backgroundColor: colors.card }]}>
                  {todayLogs.map((log) => (
                    <View key={log.id} style={[styles.logRow, { borderBottomColor: colors.border }]}>
                      {editingLogId === log.id ? (
                        <>
                          <TextInput
                            value={editingValue}
                            onChangeText={setEditingValue}
                            keyboardType="number-pad"
                            autoFocus
                            style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
                          />
                          <Text style={[styles.logUnit, { color: colors.mutedForeground }]}>sayfa</Text>
                          <Pressable onPress={saveEdit} hitSlop={8}>
                            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Ionicons name="book-outline" size={16} color={colors.primary} />
                          <View style={styles.logInfo}>
                            <Text style={[styles.logPages, { color: colors.foreground }]}>{log.pages} sayfa</Text>
                            <Text style={[styles.logBook, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {log.bookId ? bookById.get(log.bookId)?.title ?? 'Kitap' : 'Kitap seçilmedi'}
                            </Text>
                          </View>
                          <Pressable onPress={() => beginEdit(log)} hitSlop={8}>
                            <Ionicons name="create-outline" size={19} color={colors.mutedForeground} />
                          </Pressable>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

function Metric({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,35,63,0.45)' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 34, maxHeight: '92%' },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 4, backgroundColor: '#CBD1D6', marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 19 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 25, marginTop: 4 },
  closeButton: { padding: 3 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metric: { flex: 1 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  progressLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 6 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 21, marginBottom: 9 },
  inputWrap: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 15, paddingRight: 10 },
  input: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 18, paddingVertical: 0 },
  inputSuffix: { fontFamily: 'Inter_400Regular', fontSize: 12, marginRight: 12 },
  inlineAction: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  saveButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  bookPicker: { marginTop: 11 },
  pickerLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 7 },
  bookOptions: { flexDirection: 'row', gap: 7 },
  bookOption: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 9 },
  bookOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  autoLink: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 9 },
  logsCard: { borderRadius: 16, paddingHorizontal: 13 },
  logRow: { minHeight: 51, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  logInfo: { flex: 1 },
  logPages: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  logBook: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 3 },
  logUnit: { fontFamily: 'Inter_400Regular', fontSize: 11, marginRight: 6 },
  editInput: { width: 72, height: 35, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});