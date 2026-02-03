// Professional Theme Configuration for Driver Tracker App
// Modern design system with SGT branding

export interface Theme {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
}

interface Colors {
  // Primary brand colors - SGT Professional Blue/Teal
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors - Accent Orange
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // Trip status colors
  tripPlanned: string;
  tripChecklist: string;
  tripReady: string;
  tripInProgress: string;
  tripCompleted: string;
  tripCancelled: string;
  
  // Neutral colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceVariant: string;
  surfaceElevated: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnPrimary: string;
  textOnDark: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Overlay
  overlay: string;
  overlayLight: string;
  
  // Map colors
  mapRoute: string;
  mapStop: string;
  mapStopCompleted: string;
  mapDriver: string;
  
  // Action colors
  edit: string;
  delete: string;
  add: string;
  
  // Other
  white: string;
  black: string;
  transparent: string;
}

interface Typography {
  fontFamily: {
    thin: string;
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
    black: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

interface Spacing {
  '2xs': number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

interface BorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
  full: number;
}

interface Shadows {
  none: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
}

interface ShadowStyle {
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  shadowColor: string;
  elevation: number;
}

// Professional Light Theme with SGT Branding
export const lightTheme: Theme = {
  colors: {
    // Primary - Professional Teal/Blue
    primary: '#0891B2',
    primaryLight: '#22D3EE',
    primaryDark: '#0E7490',
    
    // Secondary - Energetic Orange
    secondary: '#F97316',
    secondaryLight: '#FB923C',
    secondaryDark: '#EA580C',
    
    // Status colors with accessible contrast
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Trip status - distinct colors for each state
    tripPlanned: '#94A3B8',      // Slate - programada
    tripChecklist: '#8B5CF6',    // Purple - en checklist
    tripReady: '#22C55E',        // Green - lista para salir
    tripInProgress: '#0891B2',   // Teal - en ruta
    tripCompleted: '#10B981',    // Emerald - finalizada
    tripCancelled: '#EF4444',    // Red - cancelada
    
    // Surfaces
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceVariant: '#E2E8F0',
    surfaceElevated: '#FFFFFF',
    
    // Text
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnDark: '#F8FAFC',
    
    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderDark: '#CBD5E1',
    
    // Overlays
    overlay: 'rgba(15, 23, 42, 0.5)',
    overlayLight: 'rgba(15, 23, 42, 0.25)',
    
    // Map
    mapRoute: '#0891B2',
    mapStop: '#F97316',
    mapStopCompleted: '#10B981',
    mapDriver: '#0891B2',
    
    // Actions
    edit: '#F59E0B',
    delete: '#EF4444',
    add: '#10B981',
    
    // Base
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  
  typography: {
    fontFamily: {
      thin: 'System',
      light: 'System',
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
      black: 'System',
    },
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 23,
      '3xl': 29,
      '4xl': 35,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },
  
  spacing: {
    '2xs': 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    none: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowColor: '#000',
      elevation: 0,
    },
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowColor: '#0F172A',
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowColor: '#0F172A',
      elevation: 3,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowColor: '#0F172A',
      elevation: 6,
    },
    xl: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      shadowColor: '#0F172A',
      elevation: 12,
    },
  },
};

// Dark theme for night driving
export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    
    // Surfaces - Dark mode
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    surfaceElevated: '#334155',
    
    // Text - Light on dark
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textDisabled: '#64748B',
    
    // Borders
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1E293B',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
  },
};

// Trip status helper
export const getTripStatusColor = (status: string, theme: Theme = lightTheme): string => {
  const statusMap: Record<string, string> = {
    'PLANNED': theme.colors.tripPlanned,
    'PRE_CHECKLIST': theme.colors.tripChecklist,
    'CHECKLIST_FAILED': theme.colors.error,
    'READY': theme.colors.tripReady,
    'IN_PROGRESS': theme.colors.tripInProgress,
    'COMPLETED': theme.colors.tripCompleted,
    'CANCELLED': theme.colors.tripCancelled,
  };
  return statusMap[status] || theme.colors.textMuted;
};

export const getTripStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    'PLANNED': 'Programado',
    'PRE_CHECKLIST': 'En Checklist',
    'CHECKLIST_FAILED': 'Checklist Fallido',
    'READY': 'Listo',
    'IN_PROGRESS': 'En Ruta',
    'COMPLETED': 'Completado',
    'CANCELLED': 'Cancelado',
  };
  return labelMap[status] || status;
};

export const getTripStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    'PLANNED': '📋',
    'PRE_CHECKLIST': '✔️',
    'CHECKLIST_FAILED': '⚠️',
    'READY': '🚀',
    'IN_PROGRESS': '🚐',
    'COMPLETED': '✅',
    'CANCELLED': '❌',
  };
  return iconMap[status] || '❓';
};

export default lightTheme;
