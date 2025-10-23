// src/constants/theme.ts
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// --- Font Config (No change) ---
const fontConfig = {
  fontFamily: 'Inter_400Regular',
};

// --- Modern Enhanced Color Palettes with Better Contrast & Semantic Colors ---
const lightPalette = {
  // Primary Colors
  primary: '#007AFF', // Apple Blue - Optimistic and accessible
  onPrimary: '#FFFFFF',
  primaryContainer: '#E3F2FD', // Light blue background
  onPrimaryContainer: '#003D99',
  
  // Secondary Colors
  secondary: '#5856D6', // Purple - Wellness vibes
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5',
  onSecondaryContainer: '#3E3B7E',
  
  // Tertiary Colors
  tertiary: '#FF9500', // Orange - Warmth and energy
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE5CC',
  onTertiaryContainer: '#663D00',
  
  // Surface Colors
  background: '#F9F9FB', // Slightly warmer white
  surface: '#FFFFFF',
  surfaceVariant: '#F2F2F7',
  onSurface: '#1C1C1E',
  onSurfaceVariant: '#8A8A8E',
  
  // Semantic Colors
  outline: '#262627ff',
  outlineVariant: '#D1D1D6',
  error: '#FF3B30',
  onError: '#FFFFFF',
  errorContainer: '#FFEBEE',
  onErrorContainer: '#B7070F',
  
  // Additional Colors
  success: '#34C759',
  warning: '#FF9500',
  info: '#007AFF',
  
  // Legacy Support
  card: '#FFFFFF',
  border: '#E5E5EA',
  notification: '#FF3B30',
  text: '#000000',
};

const darkPalette = {
  // Primary Colors
  primary: '#0A84FF', // Brighter blue for dark mode
  onPrimary: '#000000',
  primaryContainer: '#0051D5',
  onPrimaryContainer: '#E3F2FD',
  
  // Secondary Colors
  secondary: '#8B5CF6', // Lighter purple
  onSecondary: '#FFFFFF',
  secondaryContainer: '#5D4E96',
  onSecondaryContainer: '#F3E5F5',
  
  // Tertiary Colors
  tertiary: '#FFB454', // Lighter orange
  onTertiary: '#000000',
  tertiaryContainer: '#994E00',
  onTertiaryContainer: '#FFE5CC',
  
  // Surface Colors
  background: '#0F0F11', // Deep dark
  surface: '#1C1C1E',
  surfaceVariant: '#2C2C2E',
  onSurface: '#F2F2F7',
  onSurfaceVariant: '#A1A1A6',
  
  // Semantic Colors
  outline: '#8A8A8E',
  outlineVariant: '#636366',
  error: '#FF453A',
  onError: '#FFFFFF',
  errorContainer: '#5C0A0A',
  onErrorContainer: '#F9DEDC',
  
  // Additional Colors
  success: '#30B0C0',
  warning: '#FF9500',
  info: '#0A84FF',
  
  // Legacy Support
  card: '#1C1C1E',
  border: '#38383A',
  notification: '#FF453A',
  text: '#FFFFFF',
};

// --- Updated Theme Objects with Enhanced Configuration ---
export const paperLightTheme = {
  ...MD3LightTheme,
  roundness: 20,
  colors: { 
    ...MD3LightTheme.colors, 
    ...lightPalette,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  roundness: 20,
  colors: { 
    ...MD3DarkTheme.colors, 
    ...darkPalette,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const navLightTheme = {
  ...NavigationDefaultTheme,
  colors: { 
    ...NavigationDefaultTheme.colors, 
    ...lightPalette,
  },
};

export const navDarkTheme = {
  ...NavigationDarkTheme,
  colors: { 
    ...NavigationDarkTheme.colors, 
    ...darkPalette,
  },
};

// --- Design Token Constants for Consistent Spacing ---
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// --- Border Radius Constants ---
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// --- Typography Scale ---
export const typography = {
  heading: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
} as const;