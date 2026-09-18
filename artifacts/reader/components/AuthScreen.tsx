import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReader } from '@/context/ReaderContext';
import { PrimaryButton, Wordmark } from '@/components/ReaderUI';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useReader();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const isValid = name.trim().length > 1 && email.includes('@');
  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 18 }]}>
      <View style={styles.top}>
        <Wordmark />
        <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
          <Ionicons name="book-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>OKUMA RUTİNİNİ KUR</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Kitaplarına{'\n'}daha yakın ol.</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Kitaplığını oluştur, her gün birkaç sayfa oku ve ilerlemeni görmek için geri dön.
        </Text>
      </View>
      <View style={styles.form}>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={19} color={colors.mutedForeground} />
          <TextInput value={name} onChangeText={setName} placeholder="Adın" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground }]} />
        </View>
        <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={19} color={colors.mutedForeground} />
          <TextInput value={email} onChangeText={setEmail} placeholder="E-posta adresin" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" style={[styles.input, { color: colors.foreground }]} />
        </View>
        <PrimaryButton label="READER'a başla" icon="arrow-forward" disabled={!isValid} onPress={() => completeOnboarding({ name: name.trim(), email: email.trim() })} />
        <Text style={[styles.note, { color: colors.mutedForeground }]}>Profilin bu cihazda güvenle saklanır.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  top: { gap: 18 },
  iconCircle: { width: 76, height: 76, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 44 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.6, marginTop: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 38, lineHeight: 42, letterSpacing: -1 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 23, maxWidth: 310 },
  form: { gap: 12 },
  inputWrap: { height: 54, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  note: { fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 11, marginTop: 2 },
});
