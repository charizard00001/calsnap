// ── SNACK ARCADE ────────────────────────────────────────────────
// Sticker-punk design system. Every surface is a sticker: a thick ink
// outline, a hard offset shadow (drawn as a real layer, not a blur), and a
// degree or two of rotation. Pressing collapses the shadow so the surface
// slides into it — that press is the whole feedback language.

export const Colors = {
  // Primary backgrounds
  primaryBg: '#0B0B10',
  secondaryBg: '#111117',
  cardBg: '#16161F',
  // The outline every sticker is drawn with, and the paper it sits on.
  ink: '#0B0B10',
  paper: '#FFF6E9',
  paperDim: '#E8E0D2',
  hairline: '#2A2A38',

  // Accent colors
  accentPrimary: '#FF4D7A', // vivid coral-pink
  accentSecondary: '#12D8C5', // electric teal
  accentHot: '#FF3D5A', // hot red — over-limit / danger states
  accentWarm: '#FF9F45', // amber-orange
  accentCool: '#22D3EE', // electric cyan
  accentGold: '#FFD23F', // gold-yellow
  accentLime: '#C6F135', // acid lime
  accentViolet: '#A86BFF', // electric violet
  accentLight: '#F5F0FF', // soft lavender-white, rare accent

  // Status colors
  success: '#2BE38B',
  warning: '#FFD23F',
  danger: '#FF3D5A',

  // Text
  textPrimary: '#F5F5FA',
  textSecondary: '#9C9CB8',
  textMuted: '#55556E',
};

/**
 * Goal-adherence ramp. Validated for colour-blind separation against the
 * dark surface — lime and gold are indistinguishable to deuteranopes
 * (ΔE 1.5), so "under" is teal. Always shipped alongside the number, so
 * state never rests on colour alone.
 */
export const StatusRamp = {
  under: Colors.accentSecondary,
  close: Colors.accentGold,
  over: Colors.accentHot,
  empty: Colors.hairline,
};

export function rampFor(consumed: number, goal: number): string {
  if (consumed <= 0) return StatusRamp.empty;
  if (consumed <= goal * 0.9) return StatusRamp.under;
  if (consumed <= goal) return StatusRamp.close;
  return StatusRamp.over;
}

export const Fonts = {
  /** Bungee — nouns and numbers only. Never a full sentence. */
  display: 'Bungee_400Regular',
  body: 'SpaceGrotesk_500Medium',
  bodyBold: 'SpaceGrotesk_700Bold',
};

/** Sticker geometry — the constants that make the look consistent. */
export const Sticker = {
  border: 3,
  borderThick: 4,
  shadow: 5,
  shadowLg: 6,
  radius: 18,
  radiusSm: 12,
  radiusLg: 24,
};

export const Gradients = {
  purpleToRed: [Colors.accentPrimary, Colors.accentHot] as const,
  purpleToBlue: [Colors.accentPrimary, Colors.accentSecondary] as const,
  blueToTeal: [Colors.accentSecondary, Colors.accentCool] as const,
  redToOrange: [Colors.accentHot, Colors.accentWarm] as const,
  limeToTeal: [Colors.accentLime, Colors.accentSecondary] as const,
  violetToCoral: [Colors.accentViolet, Colors.accentPrimary] as const,
  darkCard: [Colors.cardBg, Colors.secondaryBg] as const,
  voidBg: [Colors.primaryBg, Colors.secondaryBg, Colors.primaryBg] as const,
};

export const MacroThemes = {
  protein: {
    label: 'Protein',
    fullLabel: 'Protein',
    color: Colors.accentPrimary,
    gradient: [Colors.accentPrimary, Colors.accentHot] as const,
    emoji: '🥩',
  },
  carbs: {
    label: 'Carbs',
    fullLabel: 'Carbs',
    color: Colors.accentGold,
    gradient: [Colors.accentGold, Colors.accentWarm] as const,
    emoji: '🌾',
  },
  fat: {
    label: 'Fat',
    fullLabel: 'Fat',
    color: Colors.accentCool,
    gradient: [Colors.accentCool, Colors.accentSecondary] as const,
    emoji: '🥑',
  },
};

export const MealTypeLabels: Record<string, { label: string; rank: string }> = {
  breakfast: { label: 'Breakfast', rank: 'Morning' },
  lunch: { label: 'Lunch', rank: 'Midday' },
  dinner: { label: 'Dinner', rank: 'Evening' },
  snack: { label: 'Snack', rank: 'Anytime' },
};

/** Short all-caps labels for the sticker chips. */
export const MealTypeShort: Record<string, string> = {
  breakfast: 'MORN',
  lunch: 'MIDDAY',
  dinner: 'EVE',
  snack: 'ANY',
};

export const MealTypeColor: Record<string, string> = {
  breakfast: Colors.accentGold,
  lunch: Colors.accentSecondary,
  dinner: Colors.accentViolet,
  snack: Colors.accentWarm,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
