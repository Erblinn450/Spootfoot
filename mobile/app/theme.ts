// Thème de l'application (couleurs et espacements) inspiré de la maquette
export const colors = {
  primary: '#22C55E', // vert principal (boutons, accents)
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  primarySoft: '#E8F6ED', // bandeau clair sous le header
  secondary: '#3B82F6', // bleu secondaire
  secondaryDark: '#2563EB',
  secondaryLight: '#60A5FA',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerDark: '#DC2626',
  text: '#0F172A',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  card: '#FFFFFF',
  background: '#F7F8FA',
  backgroundDark: '#F1F5F9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
