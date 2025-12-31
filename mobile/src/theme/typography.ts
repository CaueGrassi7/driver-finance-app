export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 32,
  },
  fontWeight: {
    regular: "400",
    semibold: "600",
    bold: "700",
  },
  /**
   * System-font strategy:
   * we intentionally omit `fontFamily` so React Native uses the platform default.
   */
  textStyles: {
    title: {
      fontSize: 32,
      fontWeight: "700",
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "400",
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
    },
    button: {
      fontSize: 16,
      fontWeight: "600",
    },
    caption: {
      fontSize: 12,
      fontWeight: "400",
    },
  },
} as const;

export type ThemeTypography = typeof typography;


