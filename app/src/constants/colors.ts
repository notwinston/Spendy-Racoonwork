export const Colors = {
  // Background Layers
  bgApp: '#050D1A',
  bgCard: '#0A1628',
  bgElevated: '#0F2040',
  bgHover: '#162B55',
  borderSubtle: 'rgba(37,99,235,0.18)',

  // Accent Colors
  accentDark: '#1A3A8F',
  accentBright: '#2563EB',
  accentGlow: '#3B82F6',

  // Semantic Colors
  positive: '#10B981',
  warning: '#F59E0B',
  negative: '#EF4444',

  // Text Colors
  textPrimary: '#F0F4FF',
  textSecondary: '#94A3B8',
  textMuted: '#4A5568',

  // Chart Color Sequence
  chartColors: ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'],

  // Overlays
  overlay: 'rgba(5, 13, 26, 0.8)',
  overlayLight: 'rgba(5, 13, 26, 0.5)',

  // Badge tiers
  badgeBronze: '#CD7F32',
  badgeSilver: '#94A3B8',
  badgeGold: '#F59E0B',
  badgePlatinum: '#3B82F6',
  badgeDiamond: '#8B5CF6',

  // Backwards compat aliases (to ease migration)
  background: '#050D1A',
  card: '#0A1628',
  cardBorder: 'rgba(37,99,235,0.18)',
  accent: '#2563EB',
  border: 'rgba(37,99,235,0.18)',
  divider: 'rgba(37,99,235,0.18)',
  tabBarBackground: '#0A1628',
  tabBarBorder: 'rgba(37,99,235,0.18)',
  tabActive: '#2563EB',
  tabInactive: '#4A5568',
  danger: '#EF4444',
  info: '#3B82F6',

  // Burn rate (map to semantic)
  burnExcellent: '#10B981',
  burnOnTrack: '#F59E0B',
  burnCaution: '#F59E0B',
  burnOver: '#EF4444',

  // Health score grades (use semantic + accent)
  gradeAPlus: '#10B981',
  gradeA: '#10B981',
  gradeB: '#2563EB',
  gradeC: '#F59E0B',
  gradeD: '#F59E0B',
  gradeF: '#EF4444',

  // Chart
  chartPredictionDashed: '#2563EB',
  chartConfidenceFill: 'rgba(37,99,235,0.15)',

  // Legacy compat
  warningYellow: '#F59E0B',
  destructiveRed: '#EF4444',
} as const;
