import { Animated, Easing } from 'react-native';

export const fadeIn = (
  animValue: Animated.Value,
  toValue: number = 1,
  duration: number = 300
): void => {
  Animated.timing(animValue, {
    toValue,
    duration,
    useNativeDriver: true,
  }).start();
};

export const fadeOut = (
  animValue: Animated.Value,
  duration: number = 300
): void => {
  Animated.timing(animValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  }).start();
};

export const slideUp = (
  animValue: Animated.Value,
  duration: number = 300
): void => {
  Animated.timing(animValue, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

export const slideDown = (
  animValue: Animated.Value,
  toValue: number = 300,
  duration: number = 300
): void => {
  Animated.timing(animValue, {
    toValue,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  }).start();
};

export const scale = (
  animValue: Animated.Value,
  toValue: number = 1,
  duration: number = 200
): void => {
  Animated.spring(animValue, {
    toValue,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  }).start();
};

export const bounce = (animValue: Animated.Value): void => {
  Animated.sequence([
    Animated.timing(animValue, {
      toValue: 1.1,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(animValue, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

export const pulse = (animValue: Animated.Value): void => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1.05,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ])
  ).start();
};

export const createParallelAnimation = (
  animations: Animated.CompositeAnimation[]
): void => {
  Animated.parallel(animations).start();
};

export const createSequenceAnimation = (
  animations: Animated.CompositeAnimation[]
): void => {
  Animated.sequence(animations).start();
};

export const createStaggerAnimation = (
  animations: Animated.CompositeAnimation[],
  stagger: number = 50
): void => {
  Animated.stagger(stagger, animations).start();
};
