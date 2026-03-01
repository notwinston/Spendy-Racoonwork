-- ============================================================
-- 007: Enable RLS on all tables and create policies
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PROFILES POLICIES
-- Users can read their own profile and accepted friends' profiles.
-- Users can only update their own profile.
-- ============================================================
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_friends"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ============================================================
-- CALENDAR CONNECTIONS POLICIES
-- Users can only CRUD their own calendar connections.
-- ============================================================
CREATE POLICY "calendar_connections_all_own"
  ON calendar_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CALENDAR EVENTS POLICIES
-- Users can only access their own calendar events.
-- ============================================================
CREATE POLICY "calendar_events_all_own"
  ON calendar_events FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PLAID CONNECTIONS POLICIES
-- Users can only access their own Plaid connections.
-- ============================================================
CREATE POLICY "plaid_connections_all_own"
  ON plaid_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- ACCOUNTS POLICIES
-- Users can only access their own bank accounts.
-- ============================================================
CREATE POLICY "accounts_all_own"
  ON accounts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- TRANSACTIONS POLICIES
-- Users can only access their own transactions.
-- ============================================================
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================
-- RECURRING TRANSACTIONS POLICIES
-- Users can only access their own recurring transactions.
-- ============================================================
CREATE POLICY "recurring_transactions_all_own"
  ON recurring_transactions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- SPENDING PREDICTIONS POLICIES
-- Users can only access their own predictions.
-- ============================================================
CREATE POLICY "spending_predictions_select_own"
  ON spending_predictions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "spending_predictions_insert_own"
  ON spending_predictions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "spending_predictions_update_own"
  ON spending_predictions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- PREDICTION FEEDBACK POLICIES
-- Users can only access and submit their own feedback.
-- ============================================================
CREATE POLICY "prediction_feedback_all_own"
  ON prediction_feedback FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGETS POLICIES
-- Users can only access their own budgets.
-- ============================================================
CREATE POLICY "budgets_all_own"
  ON budgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BUDGET SNAPSHOTS POLICIES
-- Users can only access their own budget snapshots.
-- ============================================================
CREATE POLICY "budget_snapshots_all_own"
  ON budget_snapshots FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- BADGES POLICIES
-- All authenticated users can read badge definitions.
-- Only service role can insert/update badge definitions.
-- ============================================================
CREATE POLICY "badges_select_all"
  ON badges FOR SELECT
  USING (true);


-- ============================================================
-- USER BADGES POLICIES
-- Users can see their own badges and friends' badges.
-- ============================================================
CREATE POLICY "user_badges_select_own"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_badges_select_friends"
  ON user_badges FOR SELECT
  USING (
    user_id IN (
      SELECT CASE
        WHEN user_id = auth.uid() THEN friend_id
        ELSE user_id
      END
      FROM friendships
      WHERE status = 'accepted'
        AND (user_id = auth.uid() OR friend_id = auth.uid())
    )
  );

CREATE POLICY "user_badges_insert_own"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- CHALLENGES POLICIES
-- All authenticated users can see template challenges.
-- Users can see challenges they created or participate in.
-- ============================================================
CREATE POLICY "challenges_select_templates"
  ON challenges FOR SELECT
  USING (is_template = true);

CREATE POLICY "challenges_select_own"
  ON challenges FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "challenges_select_participating"
  ON challenges FOR SELECT
  USING (
    id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenges_insert_own"
  ON challenges FOR INSERT
  WITH CHECK (creator_id = auth.uid());


-- ============================================================
-- CHALLENGE PARTICIPANTS POLICIES
-- Users can see participants in challenges they are part of.
-- Users can join challenges (insert themselves).
-- Users can update their own participation.
-- ============================================================
CREATE POLICY "challenge_participants_select_in_challenge"
  ON challenge_participants FOR SELECT
  USING (
    challenge_id IN (
      SELECT challenge_id FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "challenge_participants_insert_self"
  ON challenge_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "challenge_participants_update_own"
  ON challenge_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- STREAK HISTORY POLICIES
-- Users can only access their own streaks.
-- ============================================================
CREATE POLICY "streak_history_all_own"
  ON streak_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- XP TRANSACTIONS POLICIES
-- Users can only read their own XP transactions.
-- ============================================================
CREATE POLICY "xp_transactions_select_own"
  ON xp_transactions FOR SELECT
  USING (user_id = auth.uid());


-- ============================================================
-- FRIENDSHIPS POLICIES
-- Users can see friendships they are part of.
-- Users can insert friendships where they are one of the parties.
-- Users can update friendships they are part of (accept/block).
-- Users can delete friendships they are part of.
-- ============================================================
CREATE POLICY "friendships_select_own"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_insert_own"
  ON friendships FOR INSERT
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_update_own"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships_delete_own"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- ============================================================
-- FRIEND CIRCLES POLICIES
-- Users can see circles they belong to.
-- Users can create circles.
-- ============================================================
CREATE POLICY "friend_circles_select_member"
  ON friend_circles FOR SELECT
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "friend_circles_insert_own"
  ON friend_circles FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "friend_circles_update_admin"
  ON friend_circles FOR UPDATE
  USING (
    id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "friend_circles_delete_creator"
  ON friend_circles FOR DELETE
  USING (creator_id = auth.uid());


-- ============================================================
-- CIRCLE MEMBERS POLICIES
-- Users can see members of circles they belong to.
-- Admins can add/remove members.
-- ============================================================
CREATE POLICY "circle_members_select_in_circle"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "circle_members_insert_admin"
  ON circle_members FOR INSERT
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "circle_members_delete_admin_or_self"
  ON circle_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- SOCIAL NUDGES POLICIES
-- Users can see nudges sent to them and nudges they sent.
-- Users can send nudges (insert as sender).
-- Recipients can mark nudges as read.
-- ============================================================
CREATE POLICY "social_nudges_select_recipient"
  ON social_nudges FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "social_nudges_select_sender"
  ON social_nudges FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "social_nudges_insert_sender"
  ON social_nudges FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "social_nudges_update_recipient"
  ON social_nudges FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());


-- ============================================================
-- NOTIFICATIONS POLICIES
-- Users can only access their own notifications.
-- ============================================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
