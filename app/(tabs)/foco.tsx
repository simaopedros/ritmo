import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FocusRing } from '@/components/FocusRing';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { FREE_LIMITS } from '@/constants/pricing';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useRitmoStore } from '@/store/useRitmoStore';

type Mode = 'focus' | 'break';

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocoScreen() {
  const isPro = useRitmoStore((s) => s.isPro);
  const focusSessionsToday = useRitmoStore((s) => s.focusSessionsToday);
  const canStartFocus = useRitmoStore((s) => s.canStartFocus);
  const recordFocusComplete = useRitmoStore((s) => s.recordFocusComplete);
  const resetFocusDayIfNeeded = useRitmoStore((s) => s.resetFocusDayIfNeeded);
  const shouldShowSoftPaywall = useRitmoStore((s) => s.shouldShowSoftPaywall);
  const markSoftPaywallSeen = useRitmoStore((s) => s.markSoftPaywallSeen);

  const [mode, setMode] = useState<Mode>('focus');
  const [remaining, setRemaining] = useState(FOCUS_SEC);
  const [running, setRunning] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = mode === 'focus' ? FOCUS_SEC : BREAK_SEC;
  const progress = remaining / total;

  useFocusEffect(
    useCallback(() => {
      resetFocusDayIfNeeded();
    }, [resetFocusDayIfNeeded])
  );

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tickRef.current!);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (remaining !== 0 || celebrated) return;
    setCelebrated(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === 'focus') {
      recordFocusComplete();
      const soft = shouldShowSoftPaywall();
      if (soft === 'habitFocus') {
        markSoftPaywallSeen('habitFocus');
        setTimeout(() => {
          router.push({ pathname: '/paywall', params: { soft: 'habitFocus' } });
        }, 600);
      }
    }
  }, [
    remaining,
    celebrated,
    mode,
    recordFocusComplete,
    shouldShowSoftPaywall,
    markSoftPaywallSeen,
  ]);

  const start = () => {
    if (mode === 'focus' && !running && remaining === total) {
      if (!canStartFocus()) {
        router.push('/paywall');
        return;
      }
    }
    setCelebrated(false);
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setCelebrated(false);
    setRemaining(mode === 'focus' ? FOCUS_SEC : BREAK_SEC);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setRunning(false);
    setCelebrated(false);
    setRemaining(m === 'focus' ? FOCUS_SEC : BREAK_SEC);
  };

  const left = isPro
    ? 'Ilimitado'
    : `${Math.max(0, FREE_LIMITS.maxFocusPerDay - focusSessionsToday)} restantes hoje`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenEnter style={styles.content}>
        <Text style={styles.kicker}>FOCO</Text>
        <Text style={styles.title}>
          {mode === 'focus' ? 'Sessão de foco' : 'Pausa'}
        </Text>
        <Text style={styles.meta}>{left}</Text>

        <View style={styles.modes}>
          <PrimaryButton
            title="25 min"
            variant={mode === 'focus' ? 'primary' : 'secondary'}
            onPress={() => switchMode('focus')}
            style={styles.modeBtn}
          />
          <PrimaryButton
            title="5 min"
            variant={mode === 'break' ? 'primary' : 'secondary'}
            onPress={() => switchMode('break')}
            style={styles.modeBtn}
          />
        </View>

        <View style={styles.ringWrap}>
          <FocusRing
            progress={progress}
            label={fmt(remaining)}
            subtitle={
              celebrated
                ? mode === 'focus'
                  ? 'Sessão completa! 🎉'
                  : 'Pausa concluída'
                : running
                  ? 'Em andamento'
                  : 'Pronto'
            }
          />
        </View>

        <View style={styles.actions}>
          {!running ? (
            <PrimaryButton title={remaining === 0 ? 'Reiniciar' : 'Iniciar'} onPress={remaining === 0 ? reset : start} />
          ) : (
            <PrimaryButton title="Pausar" variant="secondary" onPress={pause} />
          )}
          <PrimaryButton title="Resetar" variant="ghost" onPress={reset} />
        </View>
      </ScreenEnter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl },
  kicker: { ...typography.micro, color: colors.accentSoft, letterSpacing: 2 },
  title: { ...typography.title, color: colors.text, marginTop: 4 },
  meta: { ...typography.caption, color: colors.textSecondary, marginBottom: 12 },
  modes: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  modeBtn: { flex: 1 },
  ringWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { gap: 8, marginBottom: 12 },
});
