/**
 * Theme Configuration for "Happy Women"
 * Polished Pastel Soft-UI Aesthetic: Warm Cream, Pure White Cards, Coral & Pastel Accents
 */

// Helper to construct a typed Restyle-compatible theme object
export function createTheme<T extends Record<string, any>>(themeObject: T): T {
  return themeObject;
}

export const palette = {
  // Canvas & Container Ground
  creamBackground: '#FCF8F5',
  pureWhite: '#FFFFFF',
  cardBackground: '#FFFFFF',
  elevatedBackground: '#FFFFFF',
  softBorder: '#F0E5E1',

  // Primary Accent
  coralPrimary: '#FF9FA8',
  coralLight: '#FFD6DA',
  coralMuted: '#FFF0F2',
  coralDark: '#E87D88',

  // Secondary Happy Women Pastel Accents
  pastelBlue: '#B5D3F8',
  pastelBlueLight: '#DCEBFC',

  mintGreen: '#C6F1D6',
  mintGreenLight: '#E8FAF0',

  softYellow: '#FBE3A1',
  softYellowLight: '#FDF3D5',

  pastelLavender: '#E2C6F1',
  pastelLavenderLight: '#F5ECFA',

  // Functional Feedback Colors
  errorRed: '#FF6B6B',
  warningAmber: '#FBE3A1',
  successGreen: '#7ADBB0',
  shadowTone: '#F0E5E1',

  // Typography Neutrals (Strictly no harsh pure black)
  textPrimary: '#4A4A4A',
  textSecondary: '#8C8C8C',
  textMuted: '#AFAFAF',
  textInverse: '#FFFFFF',

  // Overlays
  overlay: 'rgba(74, 74, 74, 0.4)',
  transparent: 'transparent',
};

export const theme = createTheme({
  colors: {
    // Backgrounds & Borders
    mainBackground: palette.creamBackground,
    cardBackground: palette.cardBackground,
    elevatedBackground: palette.elevatedBackground,
    borderColor: palette.softBorder,

    // Primary Coral Accent
    primaryCoral: palette.coralPrimary,
    primaryCoralLight: palette.coralLight,
    primaryCoralMuted: palette.coralMuted,
    primaryCoralDark: palette.coralDark,

    // Secondary Pastel Accents
    secondaryPastelBlue: palette.pastelBlue,
    secondaryPastelBlueLight: palette.pastelBlueLight,

    secondaryMintGreen: palette.mintGreen,
    secondaryMintGreenLight: palette.mintGreenLight,

    secondarySoftYellow: palette.softYellow,
    secondarySoftYellowLight: palette.softYellowLight,

    secondaryPastelLavender: palette.pastelLavender,

    // Legacy alias support for components using secondaryMint/secondaryLavender
    secondaryMint: palette.mintGreen,
    secondaryMintMuted: palette.mintGreenLight,
    secondaryLavender: palette.pastelLavender,
    secondaryLavenderMuted: palette.pastelLavenderLight,

    // Typography Neutral Colors
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    textInverse: palette.textInverse,

    // Statuses & Shadows
    error: palette.errorRed,
    warning: palette.warningAmber,
    success: palette.successGreen,
    shadow: palette.shadowTone,
    overlay: palette.overlay,
    transparent: palette.transparent,
  },

  // Strict 4-unit and 8-unit Spacing Scale
  spacing: {
    none: 0,
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },

  // Border Radius Scale
  borderRadii: {
    none: 0,
    s: 8,
    m: 16,
    card: 24,
    l: 24,
    xl: 32,
    pill: 999,
    full: 9999,
  },

  // Diffuse Drop Shadows
  shadows: {
    card: {
      shadowColor: palette.shadowTone,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.8,
      shadowRadius: 15,
      elevation: 4,
    },
    button: {
      shadowColor: palette.coralPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 3,
    },
    subtle: {
      shadowColor: palette.shadowTone,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 2,
    },
  },

  // Typography System (Scale & Intent) - Using friendly rounded font
  textVariants: {
    h1: {
      fontFamily: 'Nunito-Bold',
      fontSize: 28,
      lineHeight: 36,
      color: 'textPrimary',
    },
    h2: {
      fontFamily: 'Nunito-Bold',
      fontSize: 22,
      lineHeight: 28,
      color: 'textPrimary',
    },
    h3: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: 'textPrimary',
    },
    bodyLarge: {
      fontFamily: 'Nunito-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: 'textPrimary',
    },
    bodyMedium: {
      fontFamily: 'Nunito-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'textSecondary',
    },
    bodySmall: {
      fontFamily: 'Nunito-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: 'textMuted',
    },
    caption: {
      fontFamily: 'Nunito-SemiBold',
      fontSize: 11,
      lineHeight: 14,
      color: 'textMuted',
      textTransform: 'uppercase',
    },
    badge: {
      fontFamily: 'Nunito-Bold',
      fontSize: 10,
      lineHeight: 12,
      color: 'textInverse',
    },
    button: {
      fontFamily: 'Nunito-Bold',
      fontSize: 16,
      lineHeight: 20,
      color: 'textInverse',
    },
  },

  // Responsive Breakpoints
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
});

export type Theme = typeof theme;
export default theme;
