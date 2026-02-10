-- Analytics views for admin use via Supabase SQL Editor.
-- These views are owned by postgres and bypass RLS intentionally.
-- They are NOT accessible to regular app users via the PostgREST API.

-- Per-user activity summary
CREATE OR REPLACE VIEW analytics_user_activity AS
SELECT
  user_id,
  COUNT(*)                              AS total_sets,
  SUM(actual_reps)                      AS total_reps,
  MIN(completed_at)                     AS first_activity,
  MAX(completed_at)                     AS last_activity,
  COUNT(DISTINCT DATE(completed_at))    AS active_days
FROM completed_sets
WHERE deleted_at IS NULL
GROUP BY user_id;

-- Active user counts, filterable by lookback window.
-- Example: SELECT COUNT(*) FROM analytics_active_users WHERE last_activity >= NOW() - INTERVAL '30 days';
CREATE OR REPLACE VIEW analytics_active_users AS
SELECT
  user_id,
  MAX(completed_at)   AS last_activity,
  COUNT(*)            AS sets_in_period
FROM completed_sets
WHERE deleted_at IS NULL
GROUP BY user_id;

-- Exercise usage breakdown per user+exercise.
-- Example: SELECT exercise_name, SUM(total_sets) AS sets FROM analytics_exercise_usage GROUP BY exercise_name ORDER BY sets DESC LIMIT 20;
CREATE OR REPLACE VIEW analytics_exercise_usage AS
SELECT
  cs.user_id,
  cs.exercise_id,
  e.name              AS exercise_name,
  e.type              AS exercise_type,
  e.mode              AS exercise_mode,
  e.measurement_type,
  COUNT(*)            AS total_sets,
  SUM(cs.actual_reps) AS total_reps,
  MIN(cs.completed_at) AS first_used,
  MAX(cs.completed_at) AS last_used
FROM completed_sets cs
JOIN exercises e ON e.id = cs.exercise_id
WHERE cs.deleted_at IS NULL
  AND e.deleted_at IS NULL
GROUP BY cs.user_id, cs.exercise_id, e.name, e.type, e.mode, e.measurement_type;
