import { Colors } from '@/constants/theme';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Stroke-drawn icons on a 24px grid, 2.6 weight, round caps. Deliberately
 * not emoji: emoji can't be recoloured, render differently on every device,
 * and don't scale with the sticker they sit on.
 */
export type IconName =
  | 'camera'
  | 'plate'
  | 'calendar'
  | 'chart'
  | 'flame'
  | 'star'
  | 'user'
  | 'warning'
  | 'check'
  | 'repeat'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'trash'
  | 'close'
  | 'back'
  | 'forward'
  | 'gear'
  | 'image'
  | 'mail'
  | 'lock'
  | 'signout'
  | 'share'
  | 'info'
  | 'plus'
  | 'minus'
  | 'sound'
  | 'mute';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({
  name,
  size = 24,
  color = Colors.ink,
  strokeWidth = 2.6,
}: IconProps) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'camera' && (
        <>
          <Rect x="3" y="6" width="18" height="14" rx="3" {...p} />
          <Circle cx="12" cy="13" r="3.4" {...p} />
          <Path d="M8 6l1.6-2.4h4.8L16 6" {...p} />
        </>
      )}
      {name === 'plate' && (
        <>
          <Path d="M4 13h16a8 8 0 0 1-16 0Z" {...p} />
          <Path d="M3 17h18" {...p} />
          <Path d="M12 9V4" {...p} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="3" {...p} />
          <Path d="M3 10h18" {...p} />
          <Path d="M8 3v4" {...p} />
          <Path d="M16 3v4" {...p} />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M4 20V11" {...p} />
          <Path d="M10 20V4" {...p} />
          <Path d="M16 20v-6" {...p} />
          <Path d="M22 20H2" {...p} />
        </>
      )}
      {name === 'flame' && (
        <Path d="M12 3c0 4-5 5-5 9a5 5 0 0 0 10 0c0-2-1-3-2-4 0 2-1 3-2 3 1-3 0-6-1-8Z" {...p} />
      )}
      {name === 'star' && (
        <Path d="M12 2l2.2 6.4L21 10.2l-5.2 4.3L17 21l-5-3.4L7 21l1.2-6.5L3 10.2l6.8-1.8Z" {...p} />
      )}
      {name === 'user' && (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" {...p} />
        </>
      )}
      {name === 'warning' && (
        <>
          <Path d="M12 8v5" {...p} />
          <Path d="M12 17h.01" {...p} />
          <Path
            d="M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            {...p}
          />
        </>
      )}
      {name === 'check' && <Path d="M4 12.5l5.5 5.5L20 7" {...p} />}
      {name === 'repeat' && (
        <>
          <Path d="M4 4v6h6" {...p} />
          <Path d="M4.5 10a8 8 0 1 1 1.2 7" {...p} />
        </>
      )}
      {name === 'protein' && (
        <>
          <Path d="M15 4a5 5 0 0 1 0 10H9a5 5 0 0 1 0-10Z" {...p} />
          <Path d="M9 14v6" {...p} />
          <Path d="M15 14v6" {...p} />
        </>
      )}
      {name === 'carbs' && (
        <>
          <Path d="M4 20c6-2 10-8 16-16" {...p} />
          <Path d="M8 20c4-2 7-6 11-12" {...p} />
          <Path d="M12 20c3-1 5-4 8-8" {...p} />
        </>
      )}
      {name === 'fat' && (
        <>
          <Path d="M12 3c4 3 6 6 6 10a6 6 0 0 1-12 0c0-4 2-7 6-10Z" {...p} />
          <Circle cx="12" cy="14" r="2.4" {...p} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M4 7h16" {...p} />
          <Path d="M9 7V5h6v2" {...p} />
          <Path d="M6 7l1 13h10l1-13" {...p} />
        </>
      )}
      {name === 'close' && (
        <>
          <Path d="M6 6l12 12" {...p} />
          <Path d="M18 6L6 18" {...p} />
        </>
      )}
      {name === 'back' && <Path d="M14 6l-6 6 6 6" {...p} />}
      {name === 'forward' && (
        <>
          <Path d="M5 12h13" {...p} />
          <Path d="M13 6l6 6-6 6" {...p} />
        </>
      )}
      {name === 'gear' && (
        <>
          <Circle cx="12" cy="12" r="3.2" {...p} />
          <Path
            d="M19.1 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z"
            {...p}
          />
        </>
      )}
      {name === 'image' && (
        <>
          <Rect x="3" y="4" width="18" height="16" rx="3" {...p} />
          <Path d="M3 16l5-5 4 4 3-3 6 6" {...p} />
          <Circle cx="9" cy="9" r="1.6" {...p} />
        </>
      )}
      {name === 'mail' && (
        <>
          <Rect x="3" y="5" width="18" height="14" rx="3" {...p} />
          <Path d="M3.5 7l8.5 6 8.5-6" {...p} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="4" y="10" width="16" height="10" rx="3" {...p} />
          <Path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...p} />
        </>
      )}
      {name === 'signout' && (
        <>
          <Path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" {...p} />
          <Path d="M10 17l-5-5 5-5" {...p} />
          <Path d="M5 12h11" {...p} />
        </>
      )}
      {name === 'share' && (
        <>
          <Path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" {...p} />
          <Path d="M12 15V3" {...p} />
          <Path d="M8 7l4-4 4 4" {...p} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx="12" cy="12" r="9" {...p} />
          <Path d="M12 8v5" {...p} />
          <Path d="M12 16h.01" {...p} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Path d="M12 6v12" {...p} />
          <Path d="M6 12h12" {...p} />
        </>
      )}
      {name === 'minus' && <Path d="M6 12h12" {...p} />}
      {name === 'sound' && (
        <>
          <Path d="M4 9h4l5-4v14l-5-4H4Z" {...p} />
          <Path d="M17 9.5a4 4 0 0 1 0 5" {...p} />
          <Path d="M19.5 7a7.5 7.5 0 0 1 0 10" {...p} />
        </>
      )}
      {name === 'mute' && (
        <>
          <Path d="M4 9h4l5-4v14l-5-4H4Z" {...p} />
          <Path d="M17 10l4 4" {...p} />
          <Path d="M21 10l-4 4" {...p} />
        </>
      )}
    </Svg>
  );
}
