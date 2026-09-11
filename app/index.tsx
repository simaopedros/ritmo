import { Redirect } from 'expo-router';
import { useRitmoStore } from '@/store/useRitmoStore';

export default function Index() {
  const onboardingDone = useRitmoStore((s) => s.onboardingDone);
  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
