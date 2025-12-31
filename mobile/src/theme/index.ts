import { colors, palette } from "./colors";
import { spacing } from "./spacing";
import { typography } from "./typography";

export { colors, palette } from "./colors";
export { spacing } from "./spacing";
export { typography } from "./typography";

export const theme = {
  colors,
  spacing,
  typography,
} as const;

export type Theme = typeof theme;


