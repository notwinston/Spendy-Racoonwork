// ============================================================
// Type definitions matching the Supabase schema
// ============================================================

// -- ENUMs --

export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'ical';

export type EventCategory =
  | 'dining'
  | 'groceries'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'travel'
  | 'health'
  | 'education'
  | 'fitness'
  | 'social'
  | 'professional'
  | 'bills'
  | 'personal'
  | 'other';

export type TransactionFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type FeedbackType =
  | 'correct'
  | 'wrong_category'
  | 'wrong_amount'
  | 'did_not_happen';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type ParticipantStatus = 'active' | 'completed' | 'failed' | 'withdrawn';

export type StreakType = 'daily_checkin' | 'weekly_budget' | 'savings';

export type XpSource =
  | 'checkin'
  | 'budget'
  | 'challenge'
  | 'prediction'
  | 'review'
  | 'social'
  | 'referral';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type CircleRole = 'admin' | 'member';

export type NudgeType =
  | 'encouragement'
  | 'challenge_invite'
  | 'celebration'
  | 'reminder';

export type NotificationPriority = 'high' | 'medium' | 'low';

export type PrivacyLevel = 'public' | 'friends_only' | 'private';

export type PlaidStatus = 'active' | 'needs_reauth' | 'revoked' | 'error';

export type ConfidenceLabel = 'high' | 'medium' | 'low';

// -- Core Tables --

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  friend_code: string;
  monthly_income: number | null;
  xp: number;
  level: number;
  streak_count: number;
  longest_streak: number;
  financial_health_score: number | null;
  privacy_level: PrivacyLevel;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: CalendarProvider;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  calendar_ids: string[];
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  external_id: string | null;
  calendar_connection_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
  is_all_day: boolean;
  recurrence_rule: string | null;
  attendee_count: number;
  category: EventCategory;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface PlaidConnection {
  id: string;
  user_id: string;
  plaid_item_id: string;
  access_token_encrypted: string;
  institution_name: string;
  institution_id: string;
  status: PlaidStatus;
  last_sync_at: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  plaid_connection_id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string;
  last_updated: string;
  created_at: string;
}

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ParsedReceipt {
  merchant_name: string;
  date: string;
  total: number;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  currency: string;
  items: ParsedReceiptItem[];
  category: EventCategory;
  payment_method: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  plaid_transaction_id: string | null;
  amount: number;
  currency: string;
  merchant_name: string | null;
  category: EventCategory;
  subcategory: string | null;
  date: string;
  pending: boolean;
  is_recurring: boolean;
  recurring_group_id: string | null;
  reviewed: boolean;
  notes: string | null;
  source?: string;
  receipt_data?: ParsedReceipt | null;
  receipt_image_url?: string | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  merchant_name: string;
  category: EventCategory;
  avg_amount: number;
  frequency: TransactionFrequency;
  next_expected_date: string | null;
  last_occurrence: string | null;
  confidence: number;
  is_active: boolean;
  created_at: string;
}

// -- Prediction Tables --

export interface SpendingPrediction {
  id: string;
  user_id: string;
  calendar_event_id: string;
  predicted_category: EventCategory;
  predicted_amount: number;
  prediction_low: number;
  prediction_high: number;
  confidence_score: number;
  confidence_label: ConfidenceLabel;
  model_version: string;
  explanation: string | null;
  actual_amount: number | null;
  was_accurate: boolean | null;
  created_at: string;
}

export interface PredictionFeedback {
  id: string;
  user_id: string;
  prediction_id: string;
  feedback_type: FeedbackType;
  corrected_category: EventCategory | null;
  corrected_amount: number | null;
  created_at: string;
}

// -- Budget Tables --

export interface Budget {
  id: string;
  user_id: string;
  category: EventCategory;
  monthly_limit: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface BudgetSnapshot {
  id: string;
  user_id: string;
  budget_id: string;
  date: string;
  spent_amount: number;
  predicted_remaining: number;
  burn_rate: number;
  created_at: string;
}

// -- Gamification Tables --

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  tier: BadgeTier;
  unlock_condition: Record<string, unknown>;
  xp_reward: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_notified: boolean;
}

export interface Challenge {
  id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  challenge_type: string;
  duration_days: number;
  goal: Record<string, unknown>;
  reward_xp: number;
  is_template: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: Record<string, unknown>;
  status: ParticipantStatus;
  joined_at: string;
  completed_at: string | null;
}

export interface StreakHistory {
  id: string;
  user_id: string;
  streak_type: StreakType;
  start_date: string;
  end_date: string | null;
  length: number;
  is_active: boolean;
  created_at: string;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: XpSource;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

// -- Social Tables --

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface FriendCircle {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  max_members: number;
  invite_code: string;
  created_at: string;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: CircleRole;
  joined_at: string;
}

export interface SocialNudge {
  id: string;
  sender_id: string;
  recipient_id: string;
  nudge_type: NudgeType;
  content: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string | null;
  priority: NotificationPriority;
  data: Record<string, unknown> | null;
  is_read: boolean;
  sent_at: string;
  read_at: string | null;
}

// -- Gamification & Social derived types --

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  rank: number;
}

export interface CheckinResult {
  xp_earned: number;
  streak_count: number;
  badges_earned: Badge[];
}

export interface FriendWithProfile extends Friendship {
  profile: Profile;
}

// -- Demo data types (matching JSON structure from synthetic data) --

export interface DemoCalendarEvent {
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  attendee_count: number;
  category: EventCategory;
  is_recurring: boolean;
  recurrence_rule: string | null;
}

export interface DemoTransaction {
  amount: number;
  merchant_name: string;
  category: EventCategory;
  date: string;
  is_recurring: boolean;
}

// -- LLM Types (for prediction engine) --

export interface LLMPredictionItem {
  event_id: string;
  category: EventCategory;
  predicted_amount: number;
  prediction_low: number;
  prediction_high: number;
  confidence: number;
  explanation: string;
}

export interface LLMPredictionResponse {
  predictions: LLMPredictionItem[];
}

// -- Hidden Cost Types --

export type HiddenCostTier = 'likely' | 'possible' | 'unlikely_costly';

export interface HiddenCost {
  id: string;
  prediction_id: string;
  calendar_event_id: string;
  label: string;
  description: string;
  predicted_amount: number;
  amount_low: number;
  amount_high: number;
  tier: HiddenCostTier;
  confidence_score: number;
  category: EventCategory;
  signal_source: 'historical' | 'metadata' | 'social' | 'seasonal';
  is_dismissed: boolean;
}

export interface EventCostBreakdown {
  calendar_event_id: string;
  base_prediction: SpendingPrediction;
  hidden_costs: HiddenCost[];
  total_likely: number;
  total_possible: number;
  total_with_risk: number;
  historical_avg: number | null;
}

export interface DailyBrief {
  date: string;
  events: EventCostBreakdown[];
  total_predicted_low: number;
  total_predicted_high: number;
  top_warning: string | null;
  savings_opportunity: string | null;
}

export interface LLMHiddenCostItem {
  label: string;
  description: string;
  predicted_amount: number;
  amount_low: number;
  amount_high: number;
  confidence: number;
  category: string;
  signal_source: string;
}

export interface LLMHiddenCostResponse {
  hidden_costs: LLMHiddenCostItem[];
}

// -- Savings Goal --

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
  monthlyContribution: number;
  isPaused: boolean;
}

// -- Financial Optimizer --

export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface FixedBill {
  name: string;
  amount: number;
  dayOfMonth: number;
  category: EventCategory;
}

export interface FinancialProfile {
  incomeAmount: number;
  incomeFrequency: IncomeFrequency;
  nextPayDate: string;
  emergencyFundTarget: number;
  safetyBufferPercent: number;
  fixedBills: FixedBill[];
}

export type OptimizerInsightType = 'budget' | 'warning' | 'opportunity' | 'win';

export interface OptimizerInsight {
  id: string;
  type: OptimizerInsightType;
  title: string;
  body: string;
  priority: number;
  dollarImpact: number | null;
}
