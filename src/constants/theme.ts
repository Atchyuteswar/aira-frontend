// src/constants/theme.ts
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';

// --- Font Config (No change) ---
const fontConfig = {
  fontFamily: 'Inter_400Regular',
};

// --- NEW Brighter Color Palettes ---
const lightPalette = {
  primary: '#007AFF', // A friendly, optimistic blue
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  card: '#FFFFFF',
  border: '#E5E5EA',
  notification: '#FF3B30',
  primaryContainer: 'rgba(0, 122, 255, 0.1)',
  secondary: '#5856D6',
  outline: '#8A8A8E',
  error: '#FF3B30',
};

const darkPalette = {
  primary: '#0A84FF', // A slightly brighter blue for dark mode
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  card: '#1C1C1E',
  border: '#38383A',
  notification: '#FF453A',
  primaryContainer: 'rgba(10, 132, 255, 0.2)',
  secondary: '#5E5CE6',
  outline: '#636366',
  error: '#FF453A',
};

// --- Updated Theme Objects ---
export const paperLightTheme = {
  ...MD3LightTheme,
  roundness: 20, // Increased for a "bubbly" feel
  colors: { ...MD3LightTheme.colors, ...lightPalette },
  fonts: configureFonts({ config: fontConfig }),
};
export const paperDarkTheme = {
  ...MD3DarkTheme,
  roundness: 20, // Increased for a "bubbly" feel
  colors: { ...MD3DarkTheme.colors, ...darkPalette },
  fonts: configureFonts({ config: fontConfig }),
};

export const navLightTheme = {
  ...NavigationDefaultTheme,
  colors: { ...NavigationDefaultTheme.colors, ...lightPalette },
};
export const navDarkTheme = {
  ...NavigationDarkTheme,
  colors: { ...NavigationDarkTheme.colors, ...darkPalette },
};