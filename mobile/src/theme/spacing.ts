export const spacing = {
  /**
   * Named spacing scale (mapped from values currently used in screens).
   * Use these for padding/margins/gaps.
   */
  space: {
    0: 0,
    4: 4,
    6: 6,
    8: 8,
    10: 10,
    12: 12,
    14: 14,
    16: 16,
    20: 20,
    24: 24,
    30: 30,
    32: 32,
    40: 40,
    60: 60,
    100: 100,
  },
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 32,
  "5xl": 40,
  "6xl": 60,
} as const;

export type ThemeSpacing = typeof spacing;


