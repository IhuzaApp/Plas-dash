/**
 * Vivid chart colors that stay visible in both light and dark themes.
 * Use for pie slices, area/line series, and bar fills so charts are never washed out.
 */
export const CHART_COLORS = {
  green: 'hsl(142, 52%, 48%)',
  blue: 'hsl(217, 85%, 62%)',
  red: 'hsl(0, 72%, 52%)',
  yellow: 'hsl(48, 96%, 50%)',
  orange: 'hsl(28, 95%, 54%)',
} as const;

/** Ordered palette for multiple series (e.g. Approved, Pending, Other) */
export const CHART_PALETTE = [
  CHART_COLORS.green,
  CHART_COLORS.orange,
  CHART_COLORS.blue,
  CHART_COLORS.red,
  CHART_COLORS.yellow,
] as const;

/** For pie charts (gender, etc.) – distinct slices */
export const PIE_COLORS = [
  CHART_COLORS.green,
  CHART_COLORS.blue,
  CHART_COLORS.red,
  CHART_COLORS.yellow,
  CHART_COLORS.orange,
];
