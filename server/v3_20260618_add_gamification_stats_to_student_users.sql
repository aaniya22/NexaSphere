-- Add gamification stats for learning paths to student_users table
ALTER TABLE student_users
ADD COLUMN IF NOT EXISTS paths_completed_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_path_names TEXT[] DEFAULT ARRAY[]::TEXT[];