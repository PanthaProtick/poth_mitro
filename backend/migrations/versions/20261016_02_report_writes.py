"""Add report write fields and idempotency receipts without rebuilding history tables.

Revision ID: 20261016_02
Revises: 20261016_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20261016_02"
down_revision = "20261016_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add nullable columns in place. A SQLite batch table rebuild here could
    # cascade-delete incident_events while foreign-key enforcement is enabled.
    op.add_column("incident_reports", sa.Column("mode", sa.String(80), nullable=True))
    op.add_column("incident_reports", sa.Column("direction", sa.String(120), nullable=True))
    op.add_column("incident_reports", sa.Column("confirmation_note", sa.Text(), nullable=True))
    op.add_column("incident_reports", sa.Column("report_source", sa.String(40), nullable=True))
    op.create_table(
        "mutation_receipts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("idempotency_key", sa.String(36), nullable=False, unique=True),
        sa.Column("request_fingerprint", sa.String(64), nullable=False),
        sa.Column("operation", sa.String(160), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("response_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("mutation_receipts")
    op.drop_column("incident_reports", "report_source")
    op.drop_column("incident_reports", "confirmation_note")
    op.drop_column("incident_reports", "direction")
    op.drop_column("incident_reports", "mode")
