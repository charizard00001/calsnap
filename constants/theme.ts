export const Colors = {
  // Primary backgrounds
  primaryBg: '#0B0B10',
  secondaryBg: '#111117',
  cardBg: '#17171F',

  // Accent colors
  accentPrimary: '#FF4D7A', // vivid coral-pink
  accentSecondary: '#12D8C5', // electric teal
  accentHot: '#FF3D5A', // hot red — over-limit / danger states
  accentWarm: '#FF9F45', // amber-orange
  accentCool: '#22D3EE', // electric cyan
  accentGold: '#FFD23F', // gold-yellow
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

export const Gradients = {
  purpleToRed: [Colors.accentPrimary, Colors.accentHot] as const,
  purpleToBlue: [Colors.accentPrimary, Colors.accentSecondary] as const,
  blueToTeal: [Colors.accentSecondary, Colors.accentCool] as const,
  redToOrange: [Colors.accentHot, Colors.accentWarm] as const,
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
