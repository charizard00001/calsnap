import { Colors } from '@/constants/theme';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type SnappyMood = 'ready' | 'thinking' | 'streak' | 'flat';

interface SnappyProps {
  size?: number;
  mood?: SnappyMood;
  color?: string;
}

/**
 * Snappy — the mascot, and the app's stand-in for the AI. It only appears
 * where the model actually has an opinion: the verdict, the nudge, the
 * streak moment. Never as decoration.
 */
export default function Snappy({ size = 70, mood = 'ready', color }: SnappyProps) {
  const body =
    color ??
    (mood === 'thinking'
      ? Colors.accentViolet
      : mood === 'streak'
        ? Colors.paper
        : Colors.accentSecondary);

  const ink = Colors.ink;

  return (
    <Svg width={size} height={size} viewBox="0 0 70 70">
      <Path
        d="M12 40c0-16 10-27 23-27s23 11 23 27c0 12-9 18-23 18S12 52 12 40Z"
        fill={body}
        stroke={ink}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />

      {mood === 'streak' ? (
        <>
          <Path
            d="M18 20l4-9 6 6 7-9 7 9 6-6 4 9Z"
            fill={Colors.accentGold}
            stroke={ink}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Circle cx="27" cy="38" r="4.4" fill={ink} />
          <Circle cx="43" cy="38" r="4.4" fill={ink} />
          <Path
            d="M25 47c4 5 16 5 20 0"
            stroke={ink}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : mood === 'thinking' ? (
        <>
          <Rect
            x="23"
            y="29"
            width="24"
            height="18"
            rx="6"
            fill={Colors.paper}
            stroke={ink}
            strokeWidth={3}
          />
          <Path d="M28 38h5" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M38 38h5" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M28 53h14" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Rect
            x="23"
            y="29"
            width="24"
            height="18"
            rx="6"
            fill={Colors.paper}
            stroke={ink}
            strokeWidth={3}
          />
          <Circle cx="35" cy="38" r="5.2" fill={ink} />
          <Circle cx="37" cy="36" r="1.7" fill={Colors.paper} />
          <Path
            d={mood === 'flat' ? 'M26 53h17.5' : 'M26 53c3.5 3.5 14 3.5 17.5 0'}
            stroke={ink}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </Svg>
  );
}
