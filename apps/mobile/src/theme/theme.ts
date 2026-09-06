/**
 * Restyle Theme Configuration for Reproductive Health App
 * Modern Dark Mode Aesthetic (#121212) with Coral, Mint, and Lavender Accents
 */

// Helper to construct a typed Restyle-compatible theme object
export function createTheme<T extends Record<string, any>>(themeObject: T): T {
  return themeObject;
}

const palette = {
  // Primary Dark Surfaces & Canvas
  charcoalDark: '#121212',
  charcoalCard: '#1E1E24',
  charcoalElevated: '#2A2A32',
  charcoalBorder: '#33333E',

  // Brand & Accent Colors
  coralPrimary: '#FF7575',
  coralLight: '#FF9E9E',
  coralMuted: '#522A2A',

  mintSecondary: '#A3E6C8',
  mintMuted: '#244839',

  lavenderSecondary: '#D7BBF5',
  lavenderMuted: '#433458',

  // Functional & Feedback Colors
  errorRed: '#FF4D4D',
  warningAmber: '#FFB800',
  successGreen: '#4CD964',

  // Text & Neutral Scales
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6E6E80',
  textInverse: '#121212',

  // Transparent overlays
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  transparent: 'transparent',
};

export const theme = createTheme({
  colors: {
    // Backgrounds
    mainBackground: palette.charcoalDark,
    cardBackground: palette.charcoalCard,
    elevatedBackground: palette.charcoalElevated,
    borderColor: palette.charcoalBorder,

    // Accents
    primaryCoral: palette.coralPrimary,
    primaryCoralLight: palette.coralLight,
    primaryCoralMuted: palette.coralMuted,

    secondaryMint: palette.mintSecondary,
    secondaryMintMuted: palette.mintMuted,

    secondaryLavender: palette.lavenderSecondary,
    secondaryLavenderMuted: palette.lavenderMuted,

    // Typography Neutral Colors
    textPrimary: palette.textPrimary,
    textSecondary: palette.textSecondary,
    textMuted: palette.textMuted,
    textInverse: palette.textInverse,

    // Statuses
    error: palette.errorRed,
    warning: palette.warningAmber,
    success: palette.successGreen,
    overlay: palette.overlayDark,
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
    s: 6,
    m: 12,
    l: 20,
    xl: 28,
    full: 9999,
  },

  // Typography System (Scale & Intent)
  textVariants: {
    h1: {
      fontFamily: 'Poppins-Bold',
      fontSize: 28,
      lineHeight: 36,
      color: 'textPrimary',
    },
    h2: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 22,
      lineHeight: 28,
      color: 'textPrimary',
    },
    h3: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 18,
      lineHeight: 24,
      color: 'textPrimary',
    },
    bodyLarge: {
      fontFamily: 'Poppins-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: 'textPrimary',
    },
    bodyMedium: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: 'textSecondary',
    },
    bodySmall: {
      fontFamily: 'Poppins-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: 'textMuted',
    },
    caption: {
      fontFamily: 'Poppins-Medium',
      fontSize: 11,
      lineHeight: 14,
      color: 'textMuted',
      textTransform: 'uppercase',
    },
    badge: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 10,
      lineHeight: 12,
      color: 'textInverse',
    },
    button: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 16,
      lineHeight: 20,
      color: 'textPrimary',
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
