import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ScreenEnter } from '@/components/ScreenEnter';
import { WeeklyBars } from '@/components/WeeklyBars';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function ProgressoScreen() {
  const streak = useRitmoStore((s) => s.streak);
  const isPro = useRitmoStore((s) => s.isPro);
  const streakFreezeAvailable = useRitmoStore((s) => s.streakFreezeAvailable);
  const getWeeklyCompletionPct = useRitmoStore((s) => s.getWeeklyCompletionPct);
  const weekly = getWeeklyCompletionPct();
  const avg = Math.round(weekly.reduce((a, b) => a + b, 0) / 7);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenEnter style={styles.content}>
        <Text style={styles.kicker}>PROGRESSO</Text>
        <Text style={styles.title}>Sua consistência</Text>

        <View style={styles.streakCard}>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>dias de streak</Text>
          {isPro ? (
            <Text style={styles.freeze}>
              Congelamento: {streakFreezeAvailable ? '1 disponível este mês' : 'usado este mês'}
            </Text>
          ) : (
            <Text style={styles.freeze}>Congelamento de streak é Pro (1/mês)</Text>
          )}
        </View>

        <Text style={styles.section}>Esta semana · média {avg}%</Text>
        <View style={styles.card}>
          <WeeklyBars values={weekly} />
        </View>

        <View style={styles.insightsWrap}>
          <Text style={styles.section}>Insights</Text>
          <View style={styles.insightsCard}>
            <Text style={styles.insightLine}>📈 Melhor dia: ainda calculando…</Text>
            <Text style={styles.insightLine}>🎯 Correlação humor × hábitos</Text>
            <Text style={styles.insightLine}>⏱ Minutos de foco por semana</Text>
            {!isPro ? (
              <>
                <BlurView intensity={28} tint="dark" style={styles.blur} />
                <Pressable
                  style={styles.lockOverlay}
                  onPress={() => router.push('/paywall')}
                >
                  <Text style={styles.lockTitle}>🔒 Insights Pro</Text>
                  <Text style={styles.lockSub}>
                    Desbloqueie padrões e recomendações personalizadas
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {!isPro ? (
          <Text style={styles.hist}>Histórico free: últimos 7 dias</Text>
        ) : (
          <Text style={styles.hist}>Histórico completo desbloqueado</Text>
        )}
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, gap: spacing.md },
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
    gap: 10,
    minHeight: 140,
    overflow: 'hidden',
  },
  insightLine: { ...typography.body, color: colors.textSecondary },
  blur: { ...StyleSheet.absoluteFill },
  lockOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(11,11,15,0.35)',
  },
  lockTitle: { ...typography.h3, color: colors.text, marginBottom: 4 },
  lockSub: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  hist: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
