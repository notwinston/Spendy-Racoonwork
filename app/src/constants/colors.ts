export const Colors = {
  // Background Layers
  bgApp: '#050D1A',
  bgCard: '#0F2847',
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
  textSecondary: '#8899AA',
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

  // Glass
  glassBg: 'rgba(10, 22, 40, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderLight: 'rgba(255, 255, 255, 0.15)',

  // Glow
  glowTeal: 'rgba(0, 208, 156, 0.4)',
  glowBlue: 'rgba(37, 99, 235, 0.3)',
  glowGold: 'rgba(255, 215, 0, 0.3)',

  // Gradients
  gradientMeshPrimary: ['#050D1A', '#0A1628', '#0F1E3D', '#050D1A'] as readonly string[],
  gradientDashboard: ['#050D1A', '#0A1628', '#0D1F35', '#081A2E'] as readonly string[],
  gradientInsights: ['#050D1A', '#0F1830', '#141E3D', '#0A1225'] as readonly string[],
  gradientArena: ['#0A0D1A', '#1A1520', '#251A15', '#0A0D1A'] as readonly string[],
  gradientCalendar: ['#050D1A', '#0A1628', '#0E1A30', '#050D1A'] as readonly string[],
  gradientPlan: ['#050D1A', '#0A1628', '#0D1830', '#081520'] as readonly string[],
  gradientOnboarding: ['#050D1A', '#0A1830', '#0F2040', '#050D1A'] as readonly string[],

  // Noise
  noiseOverlay: 'rgba(255, 255, 255, 0.02)',

  // Legacy compat
  warningYellow: '#F59E0B',
  destructiveRed: '#EF4444',
} as const;
