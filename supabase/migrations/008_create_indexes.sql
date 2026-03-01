-- ============================================================
-- 008: Performance indexes on foreign keys and query patterns
-- ============================================================

-- Calendar connections
CREATE INDEX idx_calendar_connections_user_id
  ON calendar_connections(user_id);

-- Calendar events
CREATE INDEX idx_calendar_events_user_id_start_time
  ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_connection_id
  ON calendar_events(calendar_connection_id);
CREATE INDEX idx_calendar_events_category
  ON calendar_events(user_id, category);

-- Plaid connections
CREATE INDEX idx_plaid_connections_user_id
  ON plaid_connections(user_id);

-- Accounts
CREATE INDEX idx_accounts_user_id
  ON accounts(user_id);
CREATE INDEX idx_accounts_plaid_connection_id
  ON accounts(plaid_connection_id);

-- Transactions
CREATE INDEX idx_transactions_user_id_date
  ON transactions(user_id, date);
CREATE INDEX idx_transactions_account_id
  ON transactions(account_id);
CREATE INDEX idx_transactions_category
  ON transactions(user_id, category);
CREATE INDEX idx_transactions_recurring_group
  ON transactions(recurring_group_id)
  WHERE recurring_group_id IS NOT NULL;
CREATE INDEX idx_transactions_pending
  ON transactions(user_id, pending)
  WHERE pending = true;

-- Recurring transactions
CREATE INDEX idx_recurring_transactions_user_id
  ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_date
  ON recurring_transactions(next_expected_date)
  WHERE is_active = true;

-- Spending predictions
CREATE INDEX idx_spending_predictions_user_id_event
  ON spending_predictions(user_id, calendar_event_id);
CREATE INDEX idx_spending_predictions_created
  ON spending_predictions(user_id, created_at);

-- Prediction feedback
CREATE INDEX idx_prediction_feedback_prediction
  ON prediction_feedback(prediction_id);
CREATE INDEX idx_prediction_feedback_user
  ON prediction_feedback(user_id);

-- Budgets
CREATE INDEX idx_budgets_user_id_period
  ON budgets(user_id, period_start, period_end);
CREATE INDEX idx_budgets_user_category
  ON budgets(user_id, category);

-- Budget snapshots
CREATE INDEX idx_budget_snapshots_budget_date
  ON budget_snapshots(budget_id, date);
CREATE INDEX idx_budget_snapshots_user
  ON budget_snapshots(user_id);

-- User badges
CREATE INDEX idx_user_badges_user_id
  ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id
  ON user_badges(badge_id);

-- Challenges
CREATE INDEX idx_challenges_creator
  ON challenges(creator_id);
CREATE INDEX idx_challenges_template
  ON challenges(is_template)
  WHERE is_template = true;

-- Challenge participants
CREATE INDEX idx_challenge_participants_challenge_user
  ON challenge_participants(challenge_id, user_id);
CREATE INDEX idx_challenge_participants_user
  ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_status
  ON challenge_participants(status)
  WHERE status = 'active';

-- Streak history
CREATE INDEX idx_streak_history_user
  ON streak_history(user_id);
CREATE INDEX idx_streak_history_active
  ON streak_history(user_id, streak_type)
  WHERE is_active = true;

-- XP transactions
CREATE INDEX idx_xp_transactions_user
  ON xp_transactions(user_id, created_at);

-- Friendships
CREATE INDEX idx_friendships_user_status
  ON friendships(user_id, status);
CREATE INDEX idx_friendships_friend_status
  ON friendships(friend_id, status);

-- Friend circles
CREATE INDEX idx_friend_circles_creator
  ON friend_circles(creator_id);

-- Circle members
CREATE INDEX idx_circle_members_circle
  ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user
  ON circle_members(user_id);

-- Social nudges
CREATE INDEX idx_social_nudges_recipient
  ON social_nudges(recipient_id, is_read, created_at);
CREATE INDEX idx_social_nudges_sender
  ON social_nudges(sender_id, created_at);

-- Notifications
CREATE INDEX idx_notifications_user_read_sent
  ON notifications(user_id, is_read, sent_at);
CREATE INDEX idx_notifications_category
  ON notifications(user_id, category);
