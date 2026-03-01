-- ============================================================
-- 013: Add requested_by column to friendships
-- ============================================================
-- The friendships table uses CHECK (user_id < friend_id) for
-- bidirectional dedup, which means either user could be in either
-- column regardless of who sent the request. This column tracks
-- who actually initiated the friend request.

ALTER TABLE friendships
  ADD COLUMN requested_by UUID
  CONSTRAINT friendships_requested_by_fkey REFERENCES profiles(id) ON DELETE CASCADE;
