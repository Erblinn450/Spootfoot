// 🎨 SpotFoot Design System - Premium Dark Mode
// Inspiration: Linear, Stripe, Vercel

export const colors = {
  // Brand - Cyan néon électrique
  brand: '#00D4FF',
  brandDark: '#00A8CC',
  brandLight: '#66E5FF',
  brandMuted: 'rgba(0, 212, 255, 0.15)',
  brandGlow: 'rgba(0, 212, 255, 0.4)',

  // Accent - Lime énergique
  lime: '#ADFF2F',
  limeDark: '#8BCC26',
  limeMuted: 'rgba(173, 255, 47, 0.15)',
  limeGlow: 'rgba(173, 255, 47, 0.4)',

  // Semantic
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#FBBF24',
  warningMuted: 'rgba(251, 191, 36, 0.15)',
  error: '#F43F5E',
  errorMuted: 'rgba(244, 63, 94, 0.15)',

  // Grays - Nuances froides
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  gray950: '#020617',
  black: '#000000',

  // Surfaces - Dark mode
  bg: '#030712',
  bgElevated: '#0A0F1A',
  bgCard: '#111827',
  bgCardHover: '#1F2937',
  bgInput: '#0D1117',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderFocus: 'rgba(0, 212, 255, 0.5)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Gradients endpoints
  gradientStart: '#00D4FF',
  gradientEnd: '#ADFF2F',
};

export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
};

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  '3xl': 36,
  full: 9999,
};

export const font = {
  // Weights
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
  
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowLime: {
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Animation durations
export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
};
