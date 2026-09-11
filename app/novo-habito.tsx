import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
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
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { useRitmoStore } from '@/store/useRitmoStore';

const EMOJIS = ['🎯', '💧', '📚', '🏃', '🧘', '🥗', '😴', '✍️', '🎸', '🧠'];

export default function NovoHabitoScreen() {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [withReminder, setWithReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const addHabit = useRitmoStore((s) => s.addHabit);
  const isPro = useRitmoStore((s) => s.isPro);
  const habits = useRitmoStore((s) => s.habits);
  const canAddReminder = useRitmoStore((s) => s.canAddReminder);
  const setNotificationsGranted = useRitmoStore((s) => s.setNotificationsGranted);
  const activeCount = habits.filter((h) => !h.archived).length;

  const save = async () => {
    if (!name.trim()) return;
    if (!isPro && activeCount >= FREE_LIMITS.maxHabits) {
      router.replace('/paywall');
      return;
    }
    let time: string | null = null;
    if (withReminder) {
      if (!canAddReminder()) {
        Alert.alert(
          'Limite free',
          `Free: apenas ${FREE_LIMITS.maxReminders} lembrete. Assine Pro para lembrar todos os hábitos.`,
          [
            { text: 'Salvar sem lembrete', onPress: () => doSave(null) },
            { text: 'Ver Pro', onPress: () => router.replace('/paywall') },
          ]
        );
        return;
      }
      const perm = await getNotificationPermission();
      if (perm === 'undetermined' || perm === 'denied') {
        const next = await requestNotificationPermission();
        if (next === 'granted') setNotificationsGranted(true);
      } else if (perm === 'granted') {
        setNotificationsGranted(true);
      }
      // unsupported (web): still persist preference
      time = reminderTime.trim() || '09:00';
    }
    doSave(time);
  };

  const doSave = (time: string | null) => {
    const res = addHabit(name, emoji, time);
    if (!res.ok) {
      if (res.reason === 'reminder_limit') {
        Alert.alert('Limite de lembretes', 'Assine Pro ou desative outro lembrete.');
        return;
      }
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
              Free: {activeCount}/{FREE_LIMITS.maxHabits} hábitos · 1 lembrete
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

          <View style={styles.reminderCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Lembrete diário</Text>
              <Text style={styles.reminderSub}>
                {isPro
                  ? 'Pro: lembretes em todos os hábitos'
                  : canAddReminder()
                    ? 'Free: este pode ser seu 1 lembrete'
                    : 'Limite free atingido — Pro libera mais'}
              </Text>
            </View>
            <Switch
              value={withReminder}
              onValueChange={(v) => {
                if (v && !canAddReminder()) {
                  router.push('/paywall');
                  return;
                }
                setWithReminder(v);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          {withReminder ? (
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="09:00"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          ) : null}

          <PrimaryButton title="Salvar hábito" onPress={() => void save()} disabled={!name.trim()} />
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
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  reminderTitle: { ...typography.bodyBold, color: colors.text },
  reminderSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
