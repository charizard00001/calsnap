import { Colors } from '@/constants/theme';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

interface ArcadeBgProps {
  /** Two accent colours for the corner glows. */
  glows?: [string, string];
  /** Draw the faint graph-paper grid. */
  grid?: boolean;
}

const GRID = 26;

/**
 * The ambient backdrop: two soft accent glows bleeding in from opposite
 * corners over a faint grid. SVG rather than Skia so it costs almost
 * nothing on mobile Safari — the old particle canvas was the single
 * heaviest thing on the page.
 */
export default function ArcadeBg({
  glows = [Colors.accentPrimary, Colors.accentSecondary],
  grid = true,
}: ArcadeBgProps) {
  const { width, height } = useWindowDimensions();
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);

  const cols = Math.ceil(w / GRID);
  const rows = Math.ceil(h / GRID);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="glowA" cx="15%" cy="8%" r="55%">
            <Stop offset="0" stopColor={glows[0]} stopOpacity={0.34} />
            <Stop offset="1" stopColor={glows[0]} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowB" cx="88%" cy="34%" r="52%">
            <Stop offset="0" stopColor={glows[1]} stopOpacity={0.3} />
            <Stop offset="1" stopColor={glows[1]} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowC" cx="50%" cy="96%" r="55%">
            <Stop offset="0" stopColor={Colors.accentViolet} stopOpacity={0.24} />
            <Stop offset="1" stopColor={Colors.accentViolet} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={w} height={h} fill={Colors.primaryBg} />

        {grid && (
          <>
            {Array.from({ length: cols }, (_, i) => (
              <Line
                key={`v${i}`}
                x1={i * GRID}
                y1={0}
                x2={i * GRID}
                y2={h}
                stroke={Colors.paper}
                strokeWidth={1}
                strokeOpacity={0.05}
              />
            ))}
            {Array.from({ length: rows }, (_, i) => (
              <Line
                key={`h${i}`}
                x1={0}
                y1={i * GRID}
                x2={w}
                y2={i * GRID}
                stroke={Colors.paper}
                strokeWidth={1}
                strokeOpacity={0.05}
              />
            ))}
          </>
        )}

        <Rect x={0} y={0} width={w} height={h} fill="url(#glowA)" />
        <Rect x={0} y={0} width={w} height={h} fill="url(#glowB)" />
        <Rect x={0} y={0} width={w} height={h} fill="url(#glowC)" />
      </Svg>
    </View>
  );
}
