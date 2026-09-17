import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [opacity, duration, delay]);

  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'up',
  duration = 300,
  delay = 0,
  style,
}) => {
  const translateValue = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateValue, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateValue, opacity, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return [{ translateY: translateValue }];
      case 'down':
        return [{ translateY: Animated.multiply(translateValue, new Animated.Value(-1)) }];
      case 'left':
        return [{ translateX: translateValue }];
      case 'right':
        return [{ translateX: Animated.multiply(translateValue, new Animated.Value(-1)) }];
      default:
        return [{ translateY: translateValue }];
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: getTransform(),
        },
      ]}>
      {children}
    </Animated.View>
  );
};

interface ScaleInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  duration = 300,
  delay = 0,
  style,
}) => {
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleValue, opacity, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ scale: scaleValue }],
        },
      ]}>
      {children}
    </Animated.View>
  );
};
