import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tela não encontrada</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.bg,
  },
  title: { ...typography.h2, color: colors.text },
  link: { marginTop: 16, paddingVertical: 12 },
  linkText: { ...typography.bodyBold, color: colors.accentSoft },
});
