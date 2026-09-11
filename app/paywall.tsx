import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenEnter } from '@/components/ScreenEnter';
import {
  PRODUCTS,
  PRO_FEATURES,
  TRIAL_COPY,
} from '@/constants/pricing';
import { LEGAL_URLS } from '@/constants/legal';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { isPurchasesMock, purchasePackage, restorePurchases } from '@/lib/purchases';
import { useRitmoStore } from '@/store/useRitmoStore';

type Plan = 'annual' | 'monthly';

export default function PaywallScreen() {
  const params = useLocalSearchParams<{ soft?: string }>();
  const soft = params.soft;
  const [plan, setPlan] = useState<Plan>('annual');
  const [loading, setLoading] = useState(false);
  const setIsPro = useRitmoStore((s) => s.setIsPro);

  const headline = useMemo(() => {
    if (soft === 'habitFocus') return 'Você já sentiu o Ritmo';
    if (soft === 'review') return 'Dia fechado com elegância';
    return 'Desbloqueie o Ritmo Pro';
  }, [soft]);

  const sub = useMemo(() => {
    if (soft === 'habitFocus') {
      return 'Primeiro hábito + foco concluídos. No Pro: hábitos/focos ilimitados, insights com ação e lembretes.';
    }
    if (soft === 'review') {
      return 'Sua review alimenta o streak. Pro adiciona insights semanais, congelamento (1/mês) e lembretes.';
    }
    return 'Insights que aconselham, congelamento de streak, lembretes em todos os hábitos — além de limites ilimitados.';
  }, [soft]);

  const buy = async () => {
    setLoading(true);
    const productId =
      plan === 'annual' ? PRODUCTS.annual.id : PRODUCTS.monthly.id;
    const res = await purchasePackage(productId);
    setLoading(false);
    if (res.ok) {
      setIsPro(true);
      if ('mocked' in res && res.mocked) {
        Alert.alert(
          'Pro ativado (DEV)',
          'RevenueCat em mock — entitlement local liberado.'
        );
      }
      router.back();
      return;
    }
    Alert.alert('Compra', res.error);
  };

  const restore = async () => {
    setLoading(true);
    const res = await restorePurchases();
    setLoading(false);
    if (res.ok && res.isPro) {
      setIsPro(true);
      Alert.alert('Restaurado', 'Assinatura Pro ativa.');
      router.back();
    } else if (res.ok && 'mocked' in res && res.mocked) {
      Alert.alert('Modo DEV', 'Sem compras nativas. Use Assinar para mock Pro.');
    } else if (!res.ok) {
      Alert.alert('Erro', res.error);
    } else {
      Alert.alert('Nada encontrado', 'Nenhuma assinatura ativa.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#1A1430', colors.bg]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenEnter>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.close}>Fechar</Text>
          </Pressable>
          <Text style={styles.kicker}>{TRIAL_COPY.toUpperCase()}</Text>
          <Text style={styles.title}>{headline}</Text>
          <Text style={styles.sub}>{sub}</Text>

          <View style={styles.features}>
            {PRO_FEATURES.map((f) => (
              <Text key={f} style={styles.feature}>
                ✦  {f}
              </Text>
            ))}
          </View>

          <Pressable
            onPress={() => setPlan('annual')}
            style={[styles.plan, plan === 'annual' && styles.planOn]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{PRODUCTS.annual.badge}</Text>
            </View>
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>{PRODUCTS.annual.label}</Text>
                <Text style={styles.planId}>{PRODUCTS.annual.id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{PRODUCTS.annual.priceBRL}</Text>
                <Text style={styles.priceUsd}>
                  {PRODUCTS.annual.priceUSD}
                  {PRODUCTS.annual.period}
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setPlan('monthly')}
            style={[styles.plan, plan === 'monthly' && styles.planOn]}
          >
            <View style={styles.planRow}>
              <View>
                <Text style={styles.planName}>{PRODUCTS.monthly.label}</Text>
                <Text style={styles.planId}>{PRODUCTS.monthly.id}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{PRODUCTS.monthly.priceBRL}</Text>
                <Text style={styles.priceUsd}>
                  {PRODUCTS.monthly.priceUSD}
                  {PRODUCTS.monthly.period}
                </Text>
              </View>
            </View>
          </Pressable>

          <PrimaryButton
            title={
              plan === 'annual'
                ? `Começar · ${PRODUCTS.annual.priceBRL}/ano`
                : `Começar · ${PRODUCTS.monthly.priceBRL}/mês`
            }
            onPress={buy}
            loading={loading}
            variant="gold"
            style={{ marginTop: 8 }}
          />
          <Text style={styles.trial}>{TRIAL_COPY} · cancele quando quiser</Text>
          <PrimaryButton
            title="Restaurar compras"
            variant="ghost"
            onPress={restore}
            disabled={loading}
          />

          <View style={styles.legalRow}>
            <Pressable onPress={() => Linking.openURL(LEGAL_URLS.privacy)} hitSlop={8}>
              <Text style={styles.legalLink}>Privacidade</Text>
            </Pressable>
            <Text style={styles.legalSep}>·</Text>
            <Pressable onPress={() => Linking.openURL(LEGAL_URLS.terms)} hitSlop={8}>
              <Text style={styles.legalLink}>Termos</Text>
            </Pressable>
          </View>

          {isPurchasesMock() ? (
            <Text style={styles.mock}>Purchases: DEV mock ativo</Text>
          ) : null}
        </ScreenEnter>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: 40, gap: 12 },
  close: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  kicker: { ...typography.micro, color: colors.gold, letterSpacing: 1.5 },
  title: { ...typography.title, color: colors.text },
  sub: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  features: { gap: 8, marginVertical: 8 },
  feature: { ...typography.body, color: colors.text },
  plan: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginTop: 4,
  },
  planOn: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(245,197,66,0.08)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: 8,
  },
  badgeText: { ...typography.micro, color: colors.bg, fontWeight: '800' },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: { ...typography.h3, color: colors.text },
  planId: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  price: { ...typography.h2, color: colors.text },
  priceUsd: { ...typography.caption, color: colors.textSecondary },
  trial: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mock: {
    ...typography.micro,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 4,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  legalLink: {
    ...typography.caption,
    color: colors.accentSoft,
    textDecorationLine: 'underline',
  },
  legalSep: { ...typography.caption, color: colors.textMuted },
});
