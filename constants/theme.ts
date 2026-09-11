export const colors = {
  bg: '#0B0B0F',
  bgElevated: '#14141A',
  bgCard: '#1A1A22',
  bgCardHover: '#22222C',
  border: '#2A2A36',
  borderSubtle: '#1F1F28',
  text: '#F5F5F7',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B7B',
  accent: '#7C5CFF',
  accentSoft: '#9B84FF',
  accentDim: 'rgba(124, 92, 255, 0.18)',
  success: '#3DDC97',
  successDim: 'rgba(61, 220, 151, 0.15)',
  warning: '#FFB020',
  warningDim: 'rgba(255, 176, 32, 0.15)',
  danger: '#FF5C7A',
  gold: '#F5C542',
  focusRing: '#7C5CFF',
  focusTrack: '#2A2A36',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.65)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export const motion = {
  enterDuration: 280,
  enterTranslateY: 10,
};
