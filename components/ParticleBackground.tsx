import { Colors } from '@/constants/theme';
import { Canvas, Circle } from '@shopify/react-native-skia';
import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import {
    useFrameCallback,
    useSharedValue
} from 'react-native-reanimated';

const PARTICLE_COUNT = 25;

interface Particle {
  x: number;
  baseY: number;
  radius: number;
  speed: number;
  opacity: number;
  color: string;
}

function generateParticles(width: number, height: number): Particle[] {
  const colors = [Colors.accentPrimary, Colors.accentSecondary, Colors.accentCool];
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    baseY: Math.random() * height,
    radius: Math.random() * 3 + 1,
    speed: Math.random() * 0.3 + 0.1,
    opacity: Math.random() * 0.4 + 0.1,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

export default function ParticleBackground() {
  const { width, height } = useWindowDimensions();

  // react-native-skia's worklet-driven paint (useFrameCallback + shared
  // values feeding Canvas props) isn't reliable on web yet — the Skia JSI
  // shim loses its CanvasKit reference inside the worklet context. Native
  // (iOS/Android) uses synchronous JSI and isn't affected. Revisit when
  // building out the Phase 4 "crazy design" Skia work.
  if (Platform.OS === 'web') {
    return null;
  }

  const particles = React.useMemo(() => generateParticles(width, height), [width, height]);
  const time = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    time.value = (frameInfo.timeSinceFirstFrame ?? 0);
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const cy = height - ((p.baseY + time.value * p.speed) % height);
        const cx = p.x + Math.sin(time.value * 0.001 + p.baseY) * 10;
        return (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={p.radius}
            opacity={p.opacity}
            color={p.color}
          />
        );
      })}
    </Canvas>
  );
}
