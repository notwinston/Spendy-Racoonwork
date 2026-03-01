-- ============================================================
-- 014: Seed badge & challenge data + global leaderboard RPC
-- ============================================================

-- ============================================================
-- 1A. Seed badges (20 rows) — idempotent via ON CONFLICT
-- ============================================================
INSERT INTO badges (name, description, icon_url, tier, unlock_condition, xp_reward) VALUES
  ('Invested',
   'Complete your first 7-day check-in streak',
   '/badges/invested.png',
   'bronze',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 7}',
   50),

  ('Steadfast',
   'Maintain a 7-day budget streak (stay under budget for a full week)',
   '/badges/steadfast.png',
   'bronze',
   '{"type": "streak", "streak_type": "weekly_budget", "length": 7}',
   50),

  ('Radiant',
   'Maintain a 30-day check-in streak',
   '/badges/radiant.png',
   'silver',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 30}',
   150),

  ('Legendary',
   'Maintain a 90-day check-in streak',
   '/badges/legendary.png',
   'gold',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 90}',
   500),

  ('Prismatic',
   'Maintain a 365-day check-in streak',
   '/badges/prismatic.png',
   'diamond',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 365}',
   2000),

  ('Budget Boss',
   'Stay under budget for 3 consecutive months',
   '/badges/budget-boss.png',
   'gold',
   '{"type": "budget_streak", "months": 3}',
   500),

  ('Penny Pincher',
   'Accumulate $100+ in total savings through the app',
   '/badges/penny-pincher.png',
   'silver',
   '{"type": "savings_total", "amount": 100}',
   150),

  ('Social Butterfly',
   'Complete 5 group/friend challenges',
   '/badges/social-butterfly.png',
   'silver',
   '{"type": "challenges_completed", "count": 5, "group_only": true}',
   150),

  ('Fortune Teller',
   'Have 10 calendar-predicted spends confirmed within 20% accuracy',
   '/badges/fortune-teller.png',
   'gold',
   '{"type": "accurate_predictions", "count": 10, "accuracy_threshold": 0.2}',
   500),

  ('Early Bird',
   'Check your finances before 8:00 AM for 7 consecutive days',
   '/badges/early-bird.png',
   'bronze',
   '{"type": "early_checkin", "days": 7, "before_hour": 8}',
   50),

  ('Zero Hero',
   'Have a complete no-spend day (zero transactions)',
   '/badges/zero-hero.png',
   'bronze',
   '{"type": "zero_spend_day", "count": 1}',
   50),

  ('Challenge Champion',
   'Win 3 challenges (place 1st in your group)',
   '/badges/challenge-champion.png',
   'gold',
   '{"type": "challenge_wins", "count": 3}',
   500),

  ('Data Driven',
   'Connect all data sources: bank account + calendar + savings account',
   '/badges/data-driven.png',
   'silver',
   '{"type": "connections", "required": ["plaid", "calendar"]}',
   150),

  ('Consistent',
   'Log spending (via app check-in) for 30 consecutive days',
   '/badges/consistent.png',
   'silver',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 30}',
   150),

  ('Dedicated',
   'Maintain a 180-day (6 month) check-in streak',
   '/badges/dedicated.png',
   'gold',
   '{"type": "streak", "streak_type": "daily_checkin", "length": 180}',
   500),

  ('Thrift Lord',
   'Save $1,000+ cumulative through the app',
   '/badges/thrift-lord.png',
   'gold',
   '{"type": "savings_total", "amount": 1000}',
   500),

  ('Prediction Pro',
   'Achieve a CCI score of 0.8+ for 4 consecutive weeks',
   '/badges/prediction-pro.png',
   'gold',
   '{"type": "cci_streak", "score": 0.8, "weeks": 4}',
   500),

  ('Night Owl',
   'Review finances after 10 PM for 7 consecutive days',
   '/badges/night-owl.png',
   'bronze',
   '{"type": "late_checkin", "days": 7, "after_hour": 22}',
   50),

  ('Versatile',
   'Complete at least one challenge from 5 different categories',
   '/badges/versatile.png',
   'silver',
   '{"type": "challenge_categories", "count": 5}',
   150),

  ('Eternal',
   'Maintain a 365-day streak of any type',
   '/badges/eternal.png',
   'diamond',
   '{"type": "any_streak", "length": 365}',
   2000)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1B. Seed challenge templates (10 rows) — idempotent
-- ============================================================

-- Partial unique index so ON CONFLICT works for templates only
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_template_title
  ON challenges (title) WHERE is_template = true;

INSERT INTO challenges (title, description, challenge_type, duration_days, goal, reward_xp, is_template) VALUES
  ('No Eating Out Week',
   'Cook every meal for a full week. Groceries are allowed — restaurants, takeout, and food delivery are not.',
   'no_spend',
   7,
   '{"target_amount": 0, "category": "dining", "goal_type": "spending_limit"}',
   250,
   true),

  ('Coffee Savings Challenge',
   'Make coffee at home for 2 weeks. Every day you skip the coffee shop, the estimated savings ($5/day default) are tracked.',
   'savings_target',
   14,
   '{"target_amount": 70, "category": "coffee_drinks", "goal_type": "savings_target", "daily_estimate": 5}',
   150,
   true),

  ('$500 Monthly Savings Sprint',
   'Aggressively save $500 in one month through reduced spending, auto-save, and manual transfers.',
   'savings_goal',
   30,
   '{"target_amount": 500, "goal_type": "savings_target"}',
   500,
   true),

  ('Transportation Thrift',
   'No Uber, Lyft, or taxis for a week. Public transit, biking, and walking only. Gas purchases are exempt.',
   'no_spend',
   7,
   '{"target_amount": 0, "category": "transport", "goal_type": "spending_limit"}',
   200,
   true),

  ('Subscription Audit',
   'Go through your recurring transactions, identify subscriptions, and cancel at least one you are not actively using.',
   'audit',
   3,
   '{"cancellations_required": 1, "goal_type": "category_reduction"}',
   100,
   true),

  ('Zero Dollar Day Challenge',
   'Three days this week with absolutely no spending. Plan meals ahead and find free activities.',
   'no_spend',
   7,
   '{"zero_spend_days": 3, "goal_type": "spending_limit"}',
   200,
   true),

  ('Pack Lunch Week',
   'Bring lunch from home every workday. Estimated savings of $12-18/day tracked automatically.',
   'no_spend',
   5,
   '{"target_amount": 0, "category": "dining", "goal_type": "spending_limit", "workdays_only": true}',
   200,
   true),

  ('Entertainment Budget Challenge',
   'Movies, concerts, games, streaming — keep your total entertainment spend under $50 for two weeks. Find free alternatives!',
   'budget_streak',
   14,
   '{"target_amount": 50, "category": "entertainment", "goal_type": "spending_limit"}',
   250,
   true),

  ('Savings Snowball',
   'Start small and build momentum. Day 1 save $1, Day 2 save $2, and so on. Total: $28 in one week.',
   'savings_target',
   7,
   '{"target_amount": 28, "goal_type": "savings_target", "incremental": true}',
   150,
   true),

  ('Cash Only Week',
   'Withdraw a set budget in cash and use only cash for the week. Card purchases (for bills/subscriptions) are exempt. Track cash spending manually.',
   'budget_streak',
   7,
   '{"goal_type": "spending_limit", "cash_only": true}',
   300,
   true)
ON CONFLICT (title) WHERE is_template = true DO NOTHING;

-- ============================================================
-- 1C. Global leaderboard RPC (bypasses RLS with SECURITY DEFINER)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_global_leaderboard(result_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER,
  level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.display_name, p.avatar_url, p.xp, p.level
  FROM profiles p
  WHERE p.privacy_level != 'private'
  ORDER BY p.xp DESC
  LIMIT result_limit;
END;
$$;
