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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { requestNotificationPermission } from '@/lib/notifications';
import { useRitmoStore } from '@/store/useRitmoStore';

const EMOJIS = ['✨', '💧', '📚', '🏃', '🧘', '🎯', '🌙', '💪'];

export default function OnboardingScreen() {
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const completeOnboarding = useRitmoStore((s) => s.completeOnboarding);

  const finish = async () => {
    completeOnboarding(name || 'Meu primeiro hábito', emoji);
    // Soft ask — fails gracefully on web/unsupported envs
    try {
      await requestNotificationPermission();
    } catch {
      /* ignore */
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#16122A', colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenEnter style={styles.content}>
          {step === 0 ? (
            <View style={styles.block}>
              <Text style={styles.kicker}>RITMO</Text>
              <Text style={styles.title}>
                Construa hábitos.{'\n'}Proteja seu foco.
              </Text>
              <Text style={styles.body}>
                Um app premium para checklist diário, timer de foco e review —
                com ritmo sustentável, sem culpa.
              </Text>
              <View style={styles.bullets}>
                {[
                  'Hábitos claros para o dia',
                  'Foco Pomodoro com limites saudáveis',
                  'Review noturno para fechar o ciclo',
                ].map((t) => (
                  <Text key={t} style={styles.bullet}>
                    ✦  {t}
                  </Text>
                ))}
              </View>
              <PrimaryButton title="Começar" onPress={() => setStep(1)} />
            </View>
          ) : (
            <View style={styles.block}>
              <Text style={styles.kicker}>PASSO 1</Text>
              <Text style={styles.title}>Crie seu primeiro hábito</Text>
              <Text style={styles.body}>
                Escolha algo pequeno e concreto. Vamos semear 2 hábitos demo
                junto com o seu.
              </Text>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Ler 10 páginas"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoFocus
              />
              <Text style={styles.label}>Ícone</Text>
              <View style={styles.emojiRow}>
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
              <PrimaryButton title="Entrar no Ritmo" onPress={finish} />
              <PrimaryButton
                title="Voltar"
                variant="ghost"
                onPress={() => setStep(0)}
              />
            </View>
          )}
        </ScreenEnter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  block: { gap: spacing.md },
  kicker: {
    ...typography.micro,
    color: colors.accentSoft,
    letterSpacing: 2,
  },
  title: { ...typography.title, color: colors.text, marginTop: 4 },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  bullets: { gap: 8, marginVertical: spacing.md },
  bullet: { ...typography.body, color: colors.text },
  label: { ...typography.captionBold, color: colors.textMuted, marginTop: 8 },
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
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
