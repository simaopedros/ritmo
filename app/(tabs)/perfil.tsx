import React, { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { FREE_LIMITS } from '@/constants/pricing';
import { LEGAL_URLS } from '@/constants/legal';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  areNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { isPurchasesMock, restorePurchases } from '@/lib/purchases';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function PerfilScreen() {
  const isPro = useRitmoStore((s) => s.isPro);
  const setIsPro = useRitmoStore((s) => s.setIsPro);
  const streakFreezeAvailable = useRitmoStore((s) => s.streakFreezeAvailable);
  const habits = useRitmoStore((s) => s.habits);
  const closeDayReminder = useRitmoStore((s) => s.closeDayReminder);
  const setCloseDayReminder = useRitmoStore((s) => s.setCloseDayReminder);
  const updateHabitReminder = useRitmoStore((s) => s.updateHabitReminder);
  const setNotificationsGranted = useRitmoStore((s) => s.setNotificationsGranted);
  const notificationsGranted = useRitmoStore((s) => s.notificationsGranted);
  const countActiveReminders = useRitmoStore((s) => s.countActiveReminders);
  const [restoring, setRestoring] = useState(false);
  const [permLabel, setPermLabel] = useState<string>('…');
  const [supported, setSupported] = useState(areNotificationsSupported());

  const refreshPerm = useCallback(async () => {
    const p = await getNotificationPermission();
    setSupported(p !== 'unsupported');
    if (p === 'unsupported') setPermLabel('Indisponível neste ambiente');
    else if (p === 'granted') {
      setPermLabel('Permitido');
      setNotificationsGranted(true);
    } else if (p === 'denied') setPermLabel('Negado');
    else setPermLabel('Não solicitado');
  }, [setNotificationsGranted]);

  useFocusEffect(
    useCallback(() => {
      void refreshPerm();
    }, [refreshPerm])
  );

  const onRestore = async () => {
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.ok) {
      if (res.isPro) {
        setIsPro(true);
        Alert.alert('Restaurado', 'Assinatura Pro ativa.');
      } else if ('mocked' in res && res.mocked) {
        Alert.alert(
          'Modo DEV',
          'RevenueCat em mock (Expo Go). Use o toggle Pro abaixo.'
        );
      } else {
        Alert.alert('Nada encontrado', 'Nenhuma compra para restaurar.');
      }
    } else {
      Alert.alert('Erro', res.error);
    }
  };

  const ensurePermission = async (): Promise<boolean> => {
    const p = await getNotificationPermission();
    if (p === 'unsupported') {
      Alert.alert(
        'Notificações',
        'Agendamento não é suportado neste ambiente (web/dev). Preferências são salvas e sincronizam no app nativo.'
      );
      return false;
    }
    if (p === 'granted') return true;
    const next = await requestNotificationPermission();
    await refreshPerm();
    if (next !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Ative notificações nas configurações do sistema para receber lembretes.'
      );
      return false;
    }
    setNotificationsGranted(true);
    return true;
  };

  const onToggleCloseDay = async (enabled: boolean) => {
    if (enabled) {
      const ok = await ensurePermission();
      // Even if unsupported, still allow saving preference.
      if (!ok && supported) return;
    }
    const res = setCloseDayReminder(enabled);
    if (!res.ok) {
      Alert.alert(
        'Limite free',
        `Free: apenas ${FREE_LIMITS.maxReminders} lembrete. Desative outro ou assine Pro.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Pro', onPress: () => router.push('/paywall') },
        ]
      );
    }
  };

  const onToggleHabitReminder = async (habitId: string, enable: boolean) => {
    if (enable) {
      const ok = await ensurePermission();
      if (!ok && supported) return;
      const res = updateHabitReminder(habitId, '09:00');
      if (!res.ok) {
        Alert.alert(
          'Limite free',
          `Free: apenas ${FREE_LIMITS.maxReminders} lembrete. Pro libera todos os hábitos + Fechar o dia.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Pro', onPress: () => router.push('/paywall') },
          ]
        );
      }
    } else {
      updateHabitReminder(habitId, null);
    }
  };

  const activeHabits = habits.filter((h) => !h.archived);
  const reminderCount = countActiveReminders();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenEnter style={styles.content}>
          <Text style={styles.kicker}>PERFIL</Text>
          <Text style={styles.title}>Conta</Text>

          <View style={styles.card}>
            <Text style={styles.planLabel}>Plano atual</Text>
            <Text style={styles.planValue}>{isPro ? 'Pro ✨' : 'Free'}</Text>
            {isPro ? (
              <Text style={styles.freezeStatus}>
                Congelamento:{' '}
                {streakFreezeAvailable
                  ? '1 disponível este mês'
                  : 'usado este mês'}
              </Text>
            ) : (
              <Pressable onPress={() => router.push('/paywall')}>
                <Text style={styles.freezeLocked}>
                  🔒 Congelamento de streak (1/mês) — Pro
                </Text>
              </Pressable>
            )}
            {!isPro ? (
              <PrimaryButton
                title="Assinar Ritmo Pro"
                onPress={() => router.push('/paywall')}
                style={{ marginTop: 12 }}
              />
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lembretes</Text>
            <Text style={styles.sectionSub}>
              {supported
                ? `Permissão: ${permLabel}`
                : 'Web/dev: UI salva preferências; agendamento real no app nativo.'}
            </Text>
            <Text style={styles.sectionSub}>
              {isPro
                ? 'Pro: hábitos + Fechar o dia'
                : `Free: ${reminderCount}/${FREE_LIMITS.maxReminders} lembrete`}
            </Text>

            {!notificationsGranted && supported ? (
              <PrimaryButton
                title="Permitir notificações"
                variant="secondary"
                onPress={() => void ensurePermission()}
                style={{ marginTop: 10 }}
              />
            ) : null}

            <View style={styles.reminderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderName}>Fechar o dia</Text>
                <Text style={styles.reminderMeta}>
                  Padrão {closeDayReminder.time}
                </Text>
              </View>
              <Switch
                value={closeDayReminder.enabled}
                onValueChange={(v) => void onToggleCloseDay(v)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.white}
              />
            </View>
            {closeDayReminder.enabled ? (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Horário (HH:mm)</Text>
                <TextInput
                  value={closeDayReminder.time}
                  onChangeText={(t) => setCloseDayReminder(true, t)}
                  placeholder="20:00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.timeInput}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
            ) : null}

            {activeHabits.map((h) => (
              <View key={h.id} style={styles.reminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>
                    {h.emoji} {h.name}
                  </Text>
                  <Text style={styles.reminderMeta}>
                    {h.reminderTime
                      ? `Lembrete ${h.reminderTime}`
                      : 'Sem lembrete'}
                  </Text>
                </View>
                <Switch
                  value={!!h.reminderTime}
                  onValueChange={(v) => void onToggleHabitReminder(h.id, v)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>
            ))}
          </View>

          <PrimaryButton
            title="Restaurar compras"
            variant="secondary"
            loading={restoring}
            onPress={onRestore}
          />

          {__DEV__ ? (
            <>
              <View style={styles.devCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.devTitle}>DEV · Toggle Pro</Text>
                  <Text style={styles.devSub}>
                    {isPurchasesMock()
                      ? 'Purchases em mock (seguro no Expo Go)'
                      : 'Simula entitlement pro localmente'}
                  </Text>
                </View>
                <Switch
                  value={isPro}
                  onValueChange={setIsPro}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>

              <Pressable onPress={() => router.push('/paywall')}>
                <Text style={styles.link}>Ver paywall</Text>
              </Pressable>
            </>
          ) : null}

          <View style={styles.about}>
            <Text style={styles.aboutTitle}>Sobre o Ritmo</Text>
            <Text style={styles.aboutBody}>
              Hábitos + foco + review diária. Bundle com.ritmo.app · scheme ritmo.
              {'\n'}Versão 1.0.0
            </Text>
          </View>

          <View style={styles.legalRow}>
            <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)} hitSlop={8}>
              <Text style={styles.legalLink}>Privacidade</Text>
            </Pressable>
            <Text style={styles.legalSep}>·</Text>
            <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)} hitSlop={8}>
              <Text style={styles.legalLink}>Termos</Text>
            </Pressable>
          </View>
        </ScreenEnter>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  content: { padding: spacing.xl, gap: spacing.md },
  kicker: { ...typography.micro, color: colors.accentSoft, letterSpacing: 2 },
  title: { ...typography.title, color: colors.text },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 8,
  },
  planLabel: { ...typography.caption, color: colors.textMuted },
  planValue: { ...typography.h1, color: colors.text, marginTop: 4 },
  freezeStatus: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  freezeLocked: { ...typography.caption, color: colors.gold, marginTop: 6 },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionSub: { ...typography.caption, color: colors.textMuted },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  reminderName: { ...typography.bodyBold, color: colors.text },
  reminderMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeLabel: { ...typography.caption, color: colors.textSecondary },
  timeInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    minWidth: 72,
    textAlign: 'center',
    ...typography.bodyBold,
  },
  devCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devTitle: { ...typography.bodyBold, color: colors.text },
  devSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  link: {
    ...typography.bodyBold,
    color: colors.accentSoft,
    textAlign: 'center',
    paddingVertical: 8,
  },
  about: { marginTop: 16, gap: 6, paddingBottom: 8 },
  aboutTitle: { ...typography.h3, color: colors.text },
  aboutBody: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  legalLink: {
    ...typography.caption,
    color: colors.accentSoft,
    textDecorationLine: 'underline',
  },
  legalSep: { ...typography.caption, color: colors.textMuted },
});
