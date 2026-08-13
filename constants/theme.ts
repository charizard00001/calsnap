export const Colors = {
  // Primary backgrounds
  primaryBg: '#0A0A0F',
  secondaryBg: '#0F0F1A',
  cardBg: '#13131F',

  // Accent colors
  jjkPurple: '#7B2FBE',
  jjkBlue: '#4361EE',
  demonRed: '#FF3A3A',
  demonOrange: '#FF6B35',
  tanjiroBlue: '#00D4FF',
  zenitsuYellow: '#FFD60A',
  gojoWhite: '#E8E8FF',

  // Status colors
  success: '#00FF88',
  warning: '#FFD60A',
  danger: '#FF3A3A',

  // Text
  textPrimary: '#E8E8FF',
  textSecondary: '#9999BB',
  textMuted: '#555577',
};

export const Gradients = {
  purpleToRed: ['#7B2FBE', '#FF3A3A'] as const,
  purpleToBlue: ['#7B2FBE', '#4361EE'] as const,
  blueToTeal: ['#4361EE', '#00D4FF'] as const,
  redToOrange: ['#FF3A3A', '#FF6B35'] as const,
  darkCard: ['#13131F', '#0F0F1A'] as const,
  voidBg: ['#0A0A0F', '#0F0F1A', '#0A0A0F'] as const,
};

export const MacroThemes = {
  protein: {
    label: 'STR',
    fullLabel: 'Strength',
    color: Colors.demonRed,
    gradient: ['#FF3A3A', '#FF6B35'] as const,
    emoji: '💪',
  },
  carbs: {
    label: 'AGI',
    fullLabel: 'Agility',
    color: Colors.zenitsuYellow,
    gradient: ['#FFD60A', '#FF6B35'] as const,
    emoji: '⚡',
  },
  fat: {
    label: 'DEF',
    fullLabel: 'Defense',
    color: Colors.tanjiroBlue,
    gradient: ['#00D4FF', '#4361EE'] as const,
    emoji: '🛡️',
  },
};

export const MealTypeLabels: Record<string, { label: string; rank: string }> = {
  breakfast: { label: 'Breakfast', rank: 'First Form' },
  lunch: { label: 'Lunch', rank: 'Second Form' },
  dinner: { label: 'Dinner', rank: 'Third Form' },
  snack: { label: 'Snack', rank: 'Side Technique' },
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
