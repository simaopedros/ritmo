import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { FREE_LIMITS } from '@/constants/pricing';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRitmoStore } from '@/store/useRitmoStore';

const EMOJIS = ['🎯', '💧', '📚', '🏃', '🧘', '🥗', '😴', '✍️', '🎸', '🧠'];

export default function NovoHabitoScreen() {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const addHabit = useRitmoStore((s) => s.addHabit);
  const isPro = useRitmoStore((s) => s.isPro);
  const habits = useRitmoStore((s) => s.habits);
  const activeCount = habits.filter((h) => !h.archived).length;

  const save = () => {
    if (!name.trim()) return;
    if (!isPro && activeCount >= FREE_LIMITS.maxHabits) {
      router.replace('/paywall');
      return;
    }
    const res = addHabit(name, emoji);
    if (!res.ok) {
      router.replace('/paywall');
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
          <Text style={styles.kicker}>NOVO HÁBITO</Text>
          <Text style={styles.title}>O que você quer cultivar?</Text>
          {!isPro ? (
            <Text style={styles.hint}>
              Free: {activeCount}/{FREE_LIMITS.maxHabits} hábitos
            </Text>
          ) : null}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Meditar 5 min"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
          />
          <Text style={styles.label}>Emoji</Text>
          <View style={styles.row}>
            {EMOJIS.map((e) => (
              <Text
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emoji, emoji === e && styles.emojiOn]}
              >
                {e}
              </Text>
            ))}
          </View>
          <PrimaryButton title="Salvar hábito" onPress={save} disabled={!name.trim()} />
          <PrimaryButton title="Cancelar" variant="ghost" onPress={() => router.back()} />
        </ScreenEnter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typography.micro, color: colors.accentSoft, letterSpacing: 2 },
  title: { ...typography.h1, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    ...typography.body,
  },
  label: { ...typography.captionBold, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emoji: {
    fontSize: 26,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  emojiOn: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
