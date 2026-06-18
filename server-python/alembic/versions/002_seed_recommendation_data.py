"""Seed recommendation engine data

Revision ID: 002_seed_recommendation_data
Revises: 001_initial_schema
Create Date: 2026-05-22 10:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_seed_recommendation_data'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Seed initial data for collaborative filtering recommendation system:
    - 5 user profiles with interests
    - 10 events with tags
    - Event participation history for collaborative filtering
    """
    
    # Seed Users (Profiles)
    op.execute("""
        INSERT INTO "Profile" (id, interests, followed_users) VALUES
          ('101', '["Web", "Design", "React", "Frontend"]'::jsonb, '["user_2", "user_4"]'::jsonb),
          ('user_2', '["AI", "Machine Learning", "Python"]'::jsonb, '["user_1"]'::jsonb),
          ('user_3', '["Cybersecurity", "Networking"]'::jsonb, '[]'::jsonb),
          ('user_4', '["Design", "Figma", "UI/UX"]'::jsonb, '["user_1"]'::jsonb),
          ('user_5', '["Web", "Backend", "NodeJS", "Databases"]'::jsonb, '["user_3"]'::jsonb)
        ON CONFLICT DO NOTHING
    """)

    # Seed Events
    op.execute("""
        INSERT INTO "Events" (id, name, tags, status, date, registered_count) VALUES
          ('evt_1', 'React Frontend Masterclass', '["Web", "React", "Frontend", "JavaScript"]'::jsonb, 'upcoming', '2026-07-01T10:00:00Z', 80),
          ('evt_2', 'Advanced Figma Prototyping', '["Design", "Figma", "UI/UX"]'::jsonb, 'upcoming', '2026-06-20T09:00:00Z', 120),
          ('evt_3', 'AI for Beginners', '["AI", "Machine Learning", "Python"]'::jsonb, 'upcoming', '2026-08-15T14:00:00Z', 50),
          ('evt_4', 'Fullstack Web Bootcamp', '["Web", "React", "NodeJS", "Backend"]'::jsonb, 'upcoming', '2026-07-10T11:00:00Z', 60),
          ('evt_5', 'Ethical Hacking Workshop', '["Cybersecurity", "Networking", "Security"]'::jsonb, 'upcoming', '2026-09-01T09:00:00Z', 150),
          ('evt_6', 'Web Design Fundamentals', '["Web", "Design", "CSS", "Frontend"]'::jsonb, 'upcoming', '2026-06-25T13:00:00Z', 90),
          ('evt_7', 'Deep Learning Symposium', '["AI", "Machine Learning", "Data Science"]'::jsonb, 'upcoming', '2026-07-20T10:00:00Z', 110),
          ('evt_8', 'Cloud Architecture 101', '["Backend", "Cloud", "AWS"]'::jsonb, 'upcoming', '2026-08-05T16:00:00Z', 75),
          ('evt_9', 'UX Research Methods', '["Design", "UI/UX", "Research"]'::jsonb, 'upcoming', '2026-07-15T14:00:00Z', 40),
          ('evt_10', 'Hackathon: Future Web', '["Web", "Hackathon", "Frontend", "Backend"]'::jsonb, 'upcoming', '2026-09-10T09:00:00Z', 200)
        ON CONFLICT DO NOTHING
    """)

    # Seed Event Participations
    # Similar users to 101 are user_4 (Design) and user_5 (Web)
    op.execute("""
        INSERT INTO event_participants (user_id, event_id) VALUES
          ('user_4', 'evt_2'),
          ('user_4', 'evt_6'),
          ('user_5', 'evt_4'),
          ('user_5', 'evt_10'),
          ('user_2', 'evt_3'),
          ('user_2', 'evt_7'),
          ('user_3', 'evt_5')
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    """
    Rollback: Delete seeded data
    """
    op.execute("DELETE FROM event_participants WHERE user_id IN ('101', 'user_2', 'user_3', 'user_4', 'user_5')")
    op.execute("DELETE FROM \"Profile\" WHERE id IN ('101', 'user_2', 'user_3', 'user_4', 'user_5')")
    op.execute("DELETE FROM \"Events\" WHERE id LIKE 'evt_%'")
