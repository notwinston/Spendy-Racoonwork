export const Typography = {
  fonts: {
    brand: 'Syne',
    mono: 'DMMono',
    sans: 'DMSans',
    system: 'System',
  },
  // Brand
  brand: {
    logo: { fontFamily: 'Syne_800ExtraBold', fontSize: 20, fontWeight: '800' as const, color: '#F0F4FF' },
    pageTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700' as const, color: '#F0F4FF' },
  },
  // Numeric Display - DM Mono ONLY
  numeric: {
    displayLarge: { fontFamily: 'DMMono_500Medium', fontSize: 32, fontWeight: '500' as const, color: '#F0F4FF', letterSpacing: -0.5 },
    displayMedium: { fontFamily: 'DMMono_500Medium', fontSize: 18, fontWeight: '500' as const, color: '#F0F4FF', letterSpacing: -0.3 },
    inlineValue: { fontFamily: 'DMMono_500Medium', fontSize: 14, fontWeight: '600' as const, color: '#F0F4FF' },
    chartAxis: { fontFamily: 'DMMono_400Regular', fontSize: 10, fontWeight: '400' as const, color: '#4A5568' },
  },
  // Headings - DM Sans
  heading: {
    h2: { fontFamily: 'DMSans_700Bold', fontSize: 15, fontWeight: '700' as const, color: '#F0F4FF' },
    h3: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, fontWeight: '600' as const, color: '#F0F4FF' },
  },
  // Body - DM Sans
  body: {
    regular: { fontFamily: 'DMSans_500Medium', fontSize: 14, fontWeight: '500' as const, color: '#94A3B8' },
    small: { fontFamily: 'DMSans_400Regular', fontSize: 13, fontWeight: '400' as const, color: '#94A3B8' },
  },
  // Labels - DM Sans
  label: {
    card: { fontFamily: 'DMSans_700Bold', fontSize: 10, fontWeight: '700' as const, color: '#4A5568', textTransform: 'uppercase' as const, letterSpacing: 1.2 },
    metric: { fontFamily: 'DMSans_700Bold', fontSize: 10, fontWeight: '700' as const, color: '#4A5568', textTransform: 'uppercase' as const, letterSpacing: 1 },
    sectionDivider: { fontFamily: 'DMSans_700Bold', fontSize: 11, fontWeight: '700' as const, color: '#4A5568', textTransform: 'uppercase' as const, letterSpacing: 1.5 },
    tier: { fontFamily: 'DMSans_700Bold', fontSize: 12, fontWeight: '700' as const },
    sortTab: { fontFamily: 'DMSans_700Bold', fontSize: 12, fontWeight: '700' as const, color: '#FFFFFF' },
    trend: { fontFamily: 'DMSans_700Bold', fontSize: 12, fontWeight: '700' as const },
  },
  // Caption - DM Sans
  caption: {
    meta: { fontFamily: 'DMSans_500Medium', fontSize: 11, fontWeight: '500' as const, color: '#4A5568' },
    subLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, fontWeight: '600' as const, color: '#4A5568' },
  },
  // Legacy compat
  fontFamily: 'System',
  sizes: { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28, '4xl': 34, '5xl': 42 },
  weights: { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
};
