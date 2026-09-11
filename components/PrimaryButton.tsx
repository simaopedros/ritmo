import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography } from '@/constants/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  haptic = true,
}: Props) {
  const handle = () => {
    if (disabled || loading) return;
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  if (variant === 'primary' || variant === 'gold') {
    const grads =
      variant === 'gold'
        ? (['#F5C542', '#E8A317'] as const)
        : (['#9B84FF', '#7C5CFF'] as const);
    return (
      <Pressable
        onPress={handle}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.wrap,
          (disabled || loading) && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <LinearGradient colors={[...grads]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.grad}>
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.wrap,
        variant === 'secondary' ? styles.secondary : styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.accentSoft} />
      ) : (
        <Text
          style={[
            styles.secondaryText,
            variant === 'ghost' && { color: colors.textSecondary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  grad: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  secondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  ghost: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  secondaryText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
