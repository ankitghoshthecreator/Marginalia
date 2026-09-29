export const Palette = {
  background: '#F7F3EC', // Warm cream background
  text: '#2B2B28',       // Charcoal text
  primary: '#B5654A',    // Muted terracotta accent
  surface: '#EFECE6',    // Soft card/surface background
  border: '#E2DDD5',     // Subtle border separator
  subtext: '#75736C',    // Muted secondary text
  white: '#FFFFFF',
} as const;

export type ColorPalette = typeof Palette;
