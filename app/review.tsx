import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRitmoStore } from '@/store/useRitmoStore';

const MOODS: { v: 1 | 2 | 3 | 4 | 5; e: string; l: string }[] = [
  { v: 1, e: '😞', l: 'Difícil' },
  { v: 2, e: '😕', l: 'Baixo' },
  { v: 3, e: '😐', l: 'Ok' },
  { v: 4, e: '🙂', l: 'Bom' },
  { v: 5, e: '😄', l: 'Ótimo' },
];

export default function ReviewScreen() {
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [note, setNote] = useState('');
  const addMoodEntry = useRitmoStore((s) => s.addMoodEntry);
  const shouldShowSoftPaywall = useRitmoStore((s) => s.shouldShowSoftPaywall);
  const markSoftPaywallSeen = useRitmoStore((s) => s.markSoftPaywallSeen);
  const streak = useRitmoStore((s) => s.streak);

  const save = () => {
    if (!mood) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMoodEntry(mood, note.trim());
    const soft = shouldShowSoftPaywall();
    if (soft === 'review') {
      markSoftPaywallSeen('review');
      router.replace({ pathname: '/paywall', params: { soft: 'review' } });
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenEnter style={styles.content}>
          <Text style={styles.kicker}>FECHAR O DIA</Text>
          <Text style={styles.title}>Como foi seu dia?</Text>
          <Text style={styles.sub}>
            Registrar humor e nota atualiza seu streak (atual: {streak}).
          </Text>

          <View style={styles.moods}>
            {MOODS.map((m) => (
              <Pressable
                key={m.v}
                onPress={() => {
                  setMood(m.v);
                  void Haptics.selectionAsync();
                }}
                style={[styles.mood, mood === m.v && styles.moodOn]}
              >
                <Text style={styles.moodEmoji}>{m.e}</Text>
                <Text style={styles.moodLabel}>{m.l}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Nota (opcional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="O que quer lembrar de hoje?"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            textAlignVertical="top"
          />

          <PrimaryButton
            title="Salvar review"
            onPress={save}
            disabled={!mood}
          />
          <PrimaryButton title="Agora não" variant="ghost" onPress={() => router.back()} />
        </ScreenEnter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typography.micro, color: colors.gold, letterSpacing: 2 },
  title: { ...typography.h1, color: colors.text },
  sub: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  mood: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  moodOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  moodEmoji: { fontSize: 26 },
  moodLabel: { ...typography.micro, color: colors.textMuted, marginTop: 4 },
  label: { ...typography.captionBold, color: colors.textMuted },
  input: {
    minHeight: 100,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    ...typography.body,
  },
});
