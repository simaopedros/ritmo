import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { motion } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
};

export function ScreenEnter({ children, style, delay = 0 }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(motion.enterTranslateY);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: motion.enterDuration,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: motion.enterDuration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(t);
  }, [delay, opacity, translateY]);

  const anim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
