import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, typography } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  stroke?: number;
  progress: number; // 0..1 remaining fraction
  label: string;
  subtitle?: string;
};

export function FocusRing({
  size = 260,
  stroke = 14,
  progress,
  label,
  subtitle,
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const anim = useSharedValue(progress);

  useEffect(() => {
    anim.value = withTiming(progress, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, anim]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - Math.min(1, Math.max(0, anim.value))),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.focusTrack}
          strokeWidth={stroke}
          fill="none"
        />
        {/* SVG rotate() avoids web DOM `transform-origin` from rotation/origin props */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.focusRing}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.title,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
