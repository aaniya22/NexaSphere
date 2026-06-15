"""Add google_sheets_sync_queue table

Revision ID: 003_add_sheets_sync_queue
Revises: 002_seed_recommendation_data
Create Date: 2026-06-14 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_sheets_sync_queue'
down_revision: Union[str, None] = '002_seed_recommendation_data'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'google_sheets_sync_queue',
        sa.Column('id', sa.Integer(), sa.Identity(), nullable=False),
        sa.Column('form_type', sa.Text(), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('status', sa.Text(), nullable=False, server_default='pending'),
        sa.Column('locked_by', sa.Text(), nullable=True),
        sa.Column('locked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_google_sheets_sync_queue_retry', 'google_sheets_sync_queue', ['retry_count'])
    op.create_index('idx_google_sheets_sync_queue_status', 'google_sheets_sync_queue', ['status'])


def downgrade() -> None:
    op.drop_index('idx_google_sheets_sync_queue_status', table_name='google_sheets_sync_queue')
    op.drop_index('idx_google_sheets_sync_queue_retry', table_name='google_sheets_sync_queue')
    op.drop_table('google_sheets_sync_queue')
