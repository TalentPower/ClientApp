export const Colors = {
  primary: '#0F172A',     // Slate 900 - dark utilitarian background
  secondary: '#1E293B',   // Slate 800 - floating cards/sheets
  accent: '#4338CA',      // Indigo 700 - CTA Buttons and active state
  accentLight: '#E0E7FF', // Indigo 100 - Active map zones or secondary accents
  accentSuccess: '#10B981',// Green 500 - Confirmation CTA
  accentDanger: '#EF4444', // Red 500 - Decline/Cancel CTA
  textPrimary: '#F8FAFC', // Slate 50 - High contrast text over dark
  textSecondary: '#94A3B8', // Slate 400 - Muted text
  border: '#334155',        // Slate 700 - Subdued borders
  glassBackground: 'rgba(30, 41, 59, 0.85)', // Glassmorphism backing
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Foundational structural paddings and border radiuses
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
};

export const Shadows = {
  elevationSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevationLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  }
};
