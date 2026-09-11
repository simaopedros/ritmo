import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import { LEGAL_URLS } from '@/constants/legal';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { isPurchasesMock, restorePurchases } from '@/lib/purchases';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function PerfilScreen() {
  const isPro = useRitmoStore((s) => s.isPro);
  const setIsPro = useRitmoStore((s) => s.setIsPro);
  const [restoring, setRestoring] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenEnter style={styles.content}>
        <Text style={styles.kicker}>PERFIL</Text>
        <Text style={styles.title}>Conta</Text>

        <View style={styles.card}>
          <Text style={styles.planLabel}>Plano atual</Text>
          <Text style={styles.planValue}>{isPro ? 'Pro ✨' : 'Free'}</Text>
          {!isPro ? (
            <PrimaryButton
              title="Assinar Ritmo Pro"
              onPress={() => router.push('/paywall')}
              style={{ marginTop: 12 }}
            />
          ) : null}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typography.micro, color: colors.accentSoft, letterSpacing: 2 },
  title: { ...typography.title, color: colors.text },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  planLabel: { ...typography.caption, color: colors.textMuted },
  planValue: { ...typography.h1, color: colors.text, marginTop: 4 },
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
  about: { marginTop: 'auto', gap: 6, paddingBottom: 8 },
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
