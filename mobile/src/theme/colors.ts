export const palette = {
  brand: {
    primary: "#007AFF",
  },
  gray: {
    0: "#FFFFFF",
    50: "#F5F5F5",
    100: "#EEEEEE",
    200: "#DDDDDD",
    300: "#CCCCCC",
    500: "#999999",
    700: "#666666",
    900: "#333333",
    1000: "#000000",
  },
  success: {
    500: "#4CAF50",
    bg: "#E8F5E9",
    text: "#2E7D32",
  },
  warning: {
    500: "#FF9800",
  },
  danger: {
    500: "#F44336",
    bg: "#FFEBEE",
    text: "#C62828",
  },
  info: {
    500: "#2196F3",
  },
} as const;

/**
 * Semantic colors for app UI.
 *
 * Prefer referencing these (vs raw palette) in screens/components.
 */
export const colors = {
  background: {
    screen: palette.gray[50],
    surface: palette.gray[0],
    subtle: palette.gray[100],
  },
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[700],
    muted: palette.gray[500],
    inverse: palette.gray[0],
    disabled: palette.gray[300],
  },
  border: {
    default: palette.gray[200],
    subtle: palette.gray[100],
    brand: palette.brand.primary,
  },
  action: {
    primaryBg: palette.brand.primary,
    primaryText: palette.gray[0],

    secondaryBg: palette.gray[0],
    secondaryText: palette.brand.primary,
    secondaryBorder: palette.brand.primary,

    infoBg: palette.info[500],
    infoText: palette.gray[0],
  },
  status: {
    success: palette.success[500],
    warning: palette.warning[500],
    danger: palette.danger[500],

    successBg: palette.success.bg,
    successText: palette.success.text,
    errorBg: palette.danger.bg,
    errorText: palette.danger.text,
  },
  shadow: {
    color: palette.gray[1000],
  },
} as const;

export type ThemeColors = typeof colors;


