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

function ParticleCircles({ particles, time, width, height }: { particles: Particle[]; time: number; width: number; height: number }) {
  return (
    <>
      {particles.map((p, i) => {
        const cy = height - ((p.baseY + time * p.speed) % height);
        const cx = p.x + Math.sin(time * 0.001 + p.baseY) * 10;
        return (
          <Circle key={i} cx={cx} cy={cy} r={p.radius} opacity={p.opacity} color={p.color} />
        );
      })}
    </>
  );
}

// Native: driven by Reanimated shared values on a real UI thread via
// useFrameCallback, same as before.
function NativeParticleBackground() {
  const { width, height } = useWindowDimensions();
  const particles = React.useMemo(() => generateParticles(width, height), [width, height]);
  const time = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    time.value = (frameInfo.timeSinceFirstFrame ?? 0);
  });

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <ParticleCircles particles={particles} time={time.value} width={width} height={height} />
    </Canvas>
  );
}

// Web: react-native-skia's web renderer is patched (see
// patches/@shopify+react-native-skia+*.patch) to always draw synchronously
// via plain React re-renders rather than Reanimated's worklet runtime, which
// crashes on web. So particle motion here is driven by requestAnimationFrame
// + setState instead of a shared value.
function WebParticleBackground() {
  const { width, height } = useWindowDimensions();
  const particles = React.useMemo(() => generateParticles(width, height), [width, height]);
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      setTime(now - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <ParticleCircles particles={particles} time={time} width={width} height={height} />
    </Canvas>
  );
}

export default function ParticleBackground() {
  if (Platform.OS === 'web' && typeof (global as any).CanvasKit === 'undefined') {
    // CanvasKit failed to load (see app/_layout.tsx) — skip rather than crash.
    return null;
  }
  return Platform.OS === 'web' ? <WebParticleBackground /> : <NativeParticleBackground />;
}
