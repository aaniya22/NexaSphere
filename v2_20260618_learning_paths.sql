-- Learning Paths & Course Recommendations Schema
-- Enables structured, progressive skill building for students.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'Full Stack Development', 'Data Science', 'UI/UX Design', 'DevOps'
    icon TEXT,
    estimated_weeks INTEGER DEFAULT 12,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_path_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1, -- 1: Beginner, 2: Intermediate, 3: Advanced
    type TEXT NOT NULL, -- 'event', 'project', 'resource', 'skill'
    title TEXT NOT NULL,
    description TEXT,
    external_url TEXT,
    event_id TEXT, -- Link to NexaSphere internal event ID
    xp_reward INTEGER DEFAULT 50,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References student user ID
    path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled', -- 'enrolled', 'completed', 'dropped'
    current_level INTEGER DEFAULT 1,
    progress_percent INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    target_completion_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, path_id)
);

CREATE TABLE IF NOT EXISTS user_milestone_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_path_id UUID REFERENCES user_learning_paths(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES learning_path_milestones(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_path_id, milestone_id)
);