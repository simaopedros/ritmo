import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ScreenEnter } from '@/components/ScreenEnter';
import { WeeklyBars } from '@/components/WeeklyBars';
import { colors, radius, spacing, typography } from '@/constants/theme';
import {
  computeWeeklyInsights,
  insightTeasers,
} from '@/lib/insights';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function ProgressoScreen() {
  const streak = useRitmoStore((s) => s.streak);
  const isPro = useRitmoStore((s) => s.isPro);
  const streakFreezeAvailable = useRitmoStore((s) => s.streakFreezeAvailable);
  const habits = useRitmoStore((s) => s.habits);
  const completions = useRitmoStore((s) => s.completions);
  const moodEntries = useRitmoStore((s) => s.moodEntries);
  const focusMinutesByDate = useRitmoStore((s) => s.focusMinutesByDate);
  const getWeeklyCompletionPct = useRitmoStore((s) => s.getWeeklyCompletionPct);
  const weekly = getWeeklyCompletionPct();
  const avg = Math.round(weekly.reduce((a, b) => a + b, 0) / 7);

  const insights = useMemo(() => {
    if (!isPro) return insightTeasers();
    return computeWeeklyInsights({
      habits,
      completions,
      moodEntries,
      focusMinutesByDate,
    });
  }, [isPro, habits, completions, moodEntries, focusMinutesByDate]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenEnter style={styles.content}>
          <Text style={styles.kicker}>PROGRESSO</Text>
          <Text style={styles.title}>Sua consistência</Text>

          <View style={styles.streakCard}>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>dias de streak</Text>
            {isPro ? (
              <Text style={styles.freeze}>
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
          </View>

          <Text style={styles.section}>Esta semana · média {avg}%</Text>
          <View style={styles.card}>
            <WeeklyBars values={weekly} />
          </View>

          <View style={styles.insightsWrap}>
            <Text style={styles.section}>Insights da semana</Text>
            <View style={styles.insightsCard}>
              {insights.map((ins) => (
                <View key={ins.id} style={styles.insightBlock}>
                  <Text style={styles.insightTitle}>{ins.title}</Text>
                  <Text style={styles.insightAction}>{ins.action}</Text>
                </View>
              ))}
              {!isPro ? (
                <>
                  <BlurView intensity={28} tint="dark" style={styles.blur} />
                  <Pressable
                    style={styles.lockOverlay}
                    onPress={() => router.push('/paywall')}
                  >
                    <Text style={styles.lockTitle}>🔒 Insights Pro</Text>
                    <Text style={styles.lockSub}>
                      Melhor dia, hábitos pulados, foco vs semana passada e
                      humor × conclusão — com ação concreta.
                    </Text>
                    <Text style={styles.lockCta}>Desbloquear Pro</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>

          {!isPro ? (
            <Pressable
              style={styles.teaserCard}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.teaserTitle}>Pro também inclui</Text>
              <Text style={styles.teaserLine}>
                ✦ 1 congelamento de streak / mês
              </Text>
              <Text style={styles.teaserLine}>
                ✦ Lembretes em todos os hábitos + Fechar o dia
              </Text>
              <Text style={styles.hist}>Histórico free: últimos 7 dias</Text>
            </Pressable>
          ) : (
            <Text style={styles.hist}>Histórico completo desbloqueado</Text>
          )}
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
  streakCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 4,
  },
  streakNum: { fontSize: 56, fontWeight: '800', color: colors.gold },
  streakLabel: { ...typography.body, color: colors.textSecondary },
  freeze: { ...typography.caption, color: colors.textMuted, marginTop: 6 },
  freezeLocked: {
    ...typography.caption,
    color: colors.gold,
    marginTop: 6,
    textAlign: 'center',
  },
  section: { ...typography.h3, color: colors.text, marginTop: 8 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  insightsWrap: { gap: 8 },
  insightsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 14,
    minHeight: 160,
    overflow: 'hidden',
  },
  insightBlock: { gap: 4 },
  insightTitle: { ...typography.bodyBold, color: colors.text },
  insightAction: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  blur: { ...StyleSheet.absoluteFill },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(11,11,15,0.35)',
  },
  lockTitle: { ...typography.h3, color: colors.text, marginBottom: 4 },
  lockSub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  lockCta: {
    ...typography.captionBold,
    color: colors.gold,
    marginTop: 10,
  },
  teaserCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 6,
  },
  teaserTitle: { ...typography.captionBold, color: colors.gold, marginBottom: 2 },
  teaserLine: { ...typography.caption, color: colors.textSecondary },
  hist: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
