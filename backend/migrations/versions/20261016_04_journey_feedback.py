"""Store route validation feedback against a catalog-versioned path snapshot.

Revision ID: 20261016_04
Revises: 20261016_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20261016_04"
down_revision = "20261016_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "journey_feedback",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("path_fingerprint", sa.String(64), nullable=False),
        sa.Column("catalog_version", sa.String(64), nullable=False),
        sa.Column("origin_id", sa.String(100), nullable=False),
        sa.Column("destination_id", sa.String(100), nullable=False),
        sa.Column("verdict", sa.String(20), nullable=False),
        sa.Column("correction", sa.String(500), nullable=True),
        sa.Column("path_snapshot_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.CheckConstraint("verdict IN ('works', 'does_not_work')", name="ck_journey_feedback_verdict"),
    )
    op.create_index("ix_journey_feedback_created", "journey_feedback", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_journey_feedback_created", table_name="journey_feedback")
    op.drop_table("journey_feedback")
