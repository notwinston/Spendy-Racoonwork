-- ============================================================
-- 010: Enable Supabase Realtime subscriptions
-- ============================================================

-- Enable realtime on notification-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE social_nudges;
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_participants;

-- Realtime use cases:
-- 1. notifications         -> Instant push notification delivery to the client.
--                             Client subscribes to INSERT events filtered by user_id.
-- 2. social_nudges         -> Real-time nudge delivery between friends.
--                             Client subscribes to INSERT events filtered by recipient_id.
-- 3. challenge_participants -> Live leaderboard updates and progress tracking.
--                             Client subscribes to UPDATE events filtered by challenge_id
--                             to see progress changes from all participants in real time.
