import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '@/constants/theme';
import { initPurchases, checkProEntitlement } from '@/lib/purchases';
import { useRitmoStore } from '@/store/useRitmoStore';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const hydrated = useRitmoStore((s) => s.hydrated);
  const setIsPro = useRitmoStore((s) => s.setIsPro);
  const resetFocusDayIfNeeded = useRitmoStore((s) => s.resetFocusDayIfNeeded);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initPurchases();
      const pro = await checkProEntitlement();
      if (mounted && pro) setIsPro(true);
      resetFocusDayIfNeeded();
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
    return () => {
      mounted = false;
    };
  }, [resetFocusDayIfNeeded, setIsPro]);

  useEffect(() => {
    if (hydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hydrated]);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="novo-habito"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="review"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
