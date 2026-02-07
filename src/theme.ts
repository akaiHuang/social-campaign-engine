import type { Theme } from '@react-navigation/native';

export const colors = {
  background: '#0B0E14',
  surface: '#141A25',
  surfaceAlt: '#1C2433',
  border: '#273042',
  textPrimary: '#F5F7FF',
  textSecondary: '#A5B3CE',
  accent: '#1EE3CF',
  accentAlt: '#FF8A5C',
  success: '#58E28C',
  warning: '#FFC857',
  danger: '#FF5D73',
};

export const gradients = {
  primary: ['#1EE3CF', '#FF8A5C'] as const,
  background: ['#0B0E14', '#0F1521'] as const,
};

export const fonts = {
  heading: 'SpaceGrotesk_700Bold',
  body: 'SpaceGrotesk_500Medium',
  bodyStrong: 'SpaceGrotesk_700Bold',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accentAlt,
  },
  fonts: {
    regular: { fontFamily: fonts.body, fontWeight: '400' },
    medium: { fontFamily: fonts.bodyStrong, fontWeight: '600' },
    bold: { fontFamily: fonts.heading, fontWeight: '700' },
    heavy: { fontFamily: fonts.heading, fontWeight: '800' },
  },
};
