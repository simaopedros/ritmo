import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitCheckItem } from '@/components/HabitCheckItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProgressHeader } from '@/components/ProgressHeader';
import { ScreenEnter } from '@/components/ScreenEnter';
import { FREE_LIMITS } from '@/constants/pricing';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { friendlyToday, isAfter18h, todayKey } from '@/lib/dates';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function HojeScreen() {
  const habits = useRitmoStore((s) => s.habits);
  const isPro = useRitmoStore((s) => s.isPro);
  const streak = useRitmoStore((s) => s.streak);
  const moodEntries = useRitmoStore((s) => s.moodEntries);
  const toggleHabitCompletion = useRitmoStore((s) => s.toggleHabitCompletion);
  const isHabitDoneToday = useRitmoStore((s) => s.isHabitDoneToday);
  const getTodayProgress = useRitmoStore((s) => s.getTodayProgress);
  const shouldShowSoftPaywall = useRitmoStore((s) => s.shouldShowSoftPaywall);
  const markSoftPaywallSeen = useRitmoStore((s) => s.markSoftPaywallSeen);
  const resetFocusDayIfNeeded = useRitmoStore((s) => s.resetFocusDayIfNeeded);
  const shouldOfferStreakFreeze = useRitmoStore((s) => s.shouldOfferStreakFreeze);
  const useStreakFreeze = useRitmoStore((s) => s.useStreakFreeze);
  const getFreezeGapDate = useRitmoStore((s) => s.getFreezeGapDate);

  const active = useMemo(
    () => habits.filter((h) => !h.archived),
    [habits]
  );
  const progress = getTodayProgress();
  const after18 = isAfter18h();
  const reviewedToday = moodEntries.some((m) => m.date === todayKey());
  const offerFreeze = shouldOfferStreakFreeze();
  const hasFreezeGap = getFreezeGapDate() !== null;

  useFocusEffect(
    useCallback(() => {
      resetFocusDayIfNeeded();
      const soft = shouldShowSoftPaywall();
      if (soft) {
        markSoftPaywallSeen(soft);
        router.push({
          pathname: '/paywall',
          params: { soft: soft === 'habitFocus' ? 'habitFocus' : 'review' },
        });
      }
    }, [markSoftPaywallSeen, resetFocusDayIfNeeded, shouldShowSoftPaywall])
  );

  const onAddHabit = () => {
    if (!isPro && active.length >= FREE_LIMITS.maxHabits) {
      router.push('/paywall');
      return;
    }
    router.push('/novo-habito');
  };

  const onUseFreeze = () => {
    const ok = useStreakFreeze();
    if (ok) {
      Alert.alert(
        'Streak congelado',
        'Ontem foi coberto pelo congelamento. Seu ritmo continua.'
      );
    } else {
      Alert.alert(
        'Indisponível',
        'Não há congelamento disponível este mês.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenEnter>
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>{friendlyToday()}</Text>
              <Text style={styles.title}>Hoje</Text>
            </View>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          </View>

          {offerFreeze ? (
            <View style={styles.freezeBanner}>
              <LinearGradient
                colors={['rgba(245,197,66,0.2)', 'rgba(124,92,255,0.12)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.freezeTitle}>Streak em risco</Text>
              <Text style={styles.freezeSub}>
                Ontem ficou em branco. Use o congelamento (1/mês) para não
                quebrar a sequência.
              </Text>
              <PrimaryButton
                title="Usar congelamento"
                variant="gold"
                onPress={onUseFreeze}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : null}

          {!isPro && hasFreezeGap ? (
            <Pressable
              style={styles.freezeBanner}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.freezeTitle}>Streak em risco</Text>
              <Text style={styles.freezeSub}>
                Ontem ficou em branco. No Pro você usa 1 congelamento/mês para
                salvar a sequência.
              </Text>
              <Text style={[styles.freezeTeaserText, { marginTop: 8 }]}>
                🔒 Desbloquear congelamento
              </Text>
            </Pressable>
          ) : null}

          <ProgressHeader
            pct={progress.pct}
            done={progress.done}
            total={progress.total}
          />

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Hábitos</Text>
            <Pressable onPress={onAddHabit}>
              <Text style={styles.addLink}>+ Novo</Text>
            </Pressable>
          </View>

          <View style={styles.list}>
            {active.map((h) => (
              <HabitCheckItem
                key={h.id}
                habit={h}
                done={isHabitDoneToday(h.id)}
                onToggle={() => toggleHabitCompletion(h.id)}
              />
            ))}
            {active.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>Nenhum hábito ainda</Text>
                <Text style={styles.empty}>
                  Crie o primeiro e comece seu ritmo diário.
                </Text>
                <Pressable onPress={onAddHabit} hitSlop={8}>
                  <Text style={styles.emptyCta}>+ Criar hábito</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <PrimaryButton
            title="Iniciar Foco"
            onPress={() => router.push('/(tabs)/foco')}
            style={{ marginTop: spacing.lg }}
          />

          {/* Fechar o dia — emphasized after 18:00 */}
          <Pressable
            onPress={() => router.push('/review')}
            style={({ pressed }) => [
              styles.closeDay,
              after18 && !reviewedToday && styles.closeDayHot,
              pressed && { opacity: 0.92 },
            ]}
          >
            {after18 && !reviewedToday ? (
              <LinearGradient
                colors={['rgba(245,197,66,0.22)', 'rgba(124,92,255,0.18)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View style={styles.closeDayInner}>
              <View style={{ flex: 1 }}>
                <View style={styles.closeDayTitleRow}>
                  <Text style={styles.closeDayTitle}>Fechar o dia</Text>
                  {after18 && !reviewedToday ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Agora</Text>
                    </View>
                  ) : null}
                  {reviewedToday ? (
                    <View style={[styles.badge, styles.badgeDone]}>
                      <Text style={styles.badgeText}>Feito</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.closeDaySub}>
                  {reviewedToday
                    ? 'Review salva — streak atualizado'
                    : after18
                      ? 'Hora de registrar humor e nota. Isso conta no streak.'
                      : 'Mood + nota. Disponível a qualquer hora; após 18h fica em destaque.'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>

          {!isPro ? (
            <Text style={styles.limitHint}>
              Plano free: até {FREE_LIMITS.maxHabits} hábitos ·{' '}
              {FREE_LIMITS.maxFocusPerDay} focos/dia · 1 lembrete
            </Text>
          ) : null}
        </ScreenEnter>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 40, gap: spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  kicker: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  title: { ...typography.title, color: colors.text },
  streakPill: {
    backgroundColor: colors.warningDim,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.35)',
  },
  streakText: { ...typography.bodyBold, color: colors.warning },
  freezeBanner: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.gold,
    padding: 16,
    overflow: 'hidden',
    gap: 4,
  },
  freezeTitle: { ...typography.h3, color: colors.gold },
  freezeSub: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  freezeTeaser: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  freezeTeaserText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  addLink: { ...typography.bodyBold, color: colors.accentSoft },
  list: { gap: 10 },
  emptyCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    backgroundColor: colors.bgElevated,
  },
  emptyEmoji: { fontSize: 28 },
  emptyTitle: { ...typography.h3, color: colors.text },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyCta: { ...typography.bodyBold, color: colors.accentSoft, marginTop: 4 },
  closeDay: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  closeDayHot: {
    borderColor: colors.gold,
    ...Platform.select({
      web: {
        boxShadow: '0 0 24px rgba(245, 197, 66, 0.28)',
      } as const,
      default: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  closeDayInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  closeDayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  closeDayTitle: { ...typography.h3, color: colors.text },
  closeDaySub: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  badge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeDone: { backgroundColor: colors.success },
  badgeText: { ...typography.micro, color: colors.bg, fontWeight: '800' },
  chevron: { fontSize: 28, color: colors.textMuted, marginTop: -2 },
  limitHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
