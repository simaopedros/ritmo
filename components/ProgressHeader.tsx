import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography } from '@/constants/theme';

type Props = {
  pct: number;
  done: number;
  total: number;
};

export function ProgressHeader({ pct, done, total }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>Progresso de hoje</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={['#9B84FF', '#7C5CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.sub}>
        {done} de {total} hábitos concluídos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h3, color: colors.text },
  pct: { ...typography.h2, color: colors.accentSoft },
  track: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full },
  sub: { ...typography.caption, color: colors.textSecondary },
});
