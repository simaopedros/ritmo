import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/constants/theme';
import { weekDayLabels } from '@/lib/dates';

type Props = {
  values: number[]; // 0..100
};

export function WeeklyBars({ values }: Props) {
  const labels = weekDayLabels();
  return (
    <View style={styles.wrap}>
      {values.map((v, i) => (
        <View key={labels[i]} style={styles.col}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  height: `${Math.max(4, Math.min(100, v))}%`,
                  backgroundColor: v >= 80 ? colors.success : colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.label}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    height: 140,
  },
  col: { flex: 1, alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  fill: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 4,
  },
  label: {
    ...typography.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});
