import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '@/constants/theme';
import type { Habit } from '@/store/useRitmoStore';

type Props = {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
};

export function HabitCheckItem({ habit, done, onToggle }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (done) {
      scale.value = withSequence(
        withSpring(1.18, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
    }
  }, [done, scale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(
          done
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        );
        onToggle();
      }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
    >
      <Animated.View
        style={[
          styles.check,
          done && styles.checkDone,
          checkStyle,
        ]}
      >
        {done ? <Text style={styles.mark}>✓</Text> : null}
      </Animated.View>
      <View style={styles.meta}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
          {habit.name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  checkDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  mark: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 20 },
  name: { ...typography.bodyBold, color: colors.text, flex: 1 },
  nameDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
});
