"""Persist local conversational commute sessions and messages.

Revision ID: 20261016_03
Revises: 20261016_02
"""
from alembic import op
import sqlalchemy as sa

revision = "20261016_03"
down_revision = "20261016_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("context_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.Column("updated_at", sa.String(40), nullable=False),
        sa.Column("expires_at", sa.String(40), nullable=False),
    )
    op.create_index("ix_chat_sessions_expires_at", "chat_sessions", ["expires_at"])
    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("session_id", sa.String(36), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(12), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intent_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.CheckConstraint("role IN ('user', 'assistant')", name="ck_chat_message_role"),
    )
    op.create_index("ix_chat_messages_session_created", "chat_messages", ["session_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_chat_messages_session_created", table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index("ix_chat_sessions_expires_at", table_name="chat_sessions")
    op.drop_table("chat_sessions")
