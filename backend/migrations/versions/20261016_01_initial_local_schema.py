"""Initial local SQLite schema.

Revision ID: 20261016_01
"""
from alembic import op
import sqlalchemy as sa

revision = "20261016_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "map_data_imports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_version", sa.String(80), nullable=False),
        sa.Column("manifest_sha256", sa.String(64), nullable=False, unique=True),
        sa.Column("imported_at", sa.String(40), nullable=False),
    )
    op.create_table(
        "map_data_source_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("import_id", sa.Integer(), sa.ForeignKey("map_data_imports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("path", sa.String(300), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("format", sa.String(30), nullable=False),
        sa.Column("coordinate_order", sa.String(80), nullable=False),
        sa.Column("crs_datum", sa.String(80), nullable=False),
        sa.Column("parsed_record_count", sa.Integer()),
        sa.Column("accepted_count", sa.Integer(), nullable=False),
        sa.Column("exclusion_reason", sa.Text()),
        sa.UniqueConstraint("import_id", "path", name="uq_map_source_file_path"),
    )
    op.create_table(
        "transit_routes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_key", sa.String(240), nullable=False, unique=True),
        sa.Column("source_id", sa.String(100), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("original_status", sa.String(80), nullable=False),
        sa.Column("source_path", sa.String(300), nullable=False),
        sa.Column("source_version", sa.String(80), nullable=False),
        sa.Column("data_quality", sa.String(30), nullable=False),
        sa.CheckConstraint("mode IN ('rail', 'bus')", name="ck_transit_route_mode"),
        sa.CheckConstraint("data_quality = 'approximate'", name="ck_transit_route_quality"),
    )
    op.create_table(
        "transit_stops",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_key", sa.String(240), nullable=False, unique=True),
        sa.Column("source_id", sa.String(100), nullable=False),
        sa.Column("route_id", sa.Integer(), sa.ForeignKey("transit_routes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("source_path", sa.String(300), nullable=False),
        sa.Column("coordinate_order", sa.String(50), nullable=False),
        sa.Column("crs_datum", sa.String(80), nullable=False),
        sa.Column("data_quality", sa.String(30), nullable=False),
        sa.UniqueConstraint("route_id", "source_id", name="uq_stop_route_source"),
        sa.CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_stop_latitude"),
        sa.CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_stop_longitude"),
        sa.CheckConstraint("data_quality = 'approximate'", name="ck_stop_quality"),
    )
    op.create_index("ix_stops_route_name", "transit_stops", ["route_id", "name"])
    op.create_table(
        "route_segments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_key", sa.String(300), nullable=False, unique=True),
        sa.Column("route_id", sa.Integer(), sa.ForeignKey("transit_routes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("from_stop_id", sa.Integer(), sa.ForeignKey("transit_stops.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("to_stop_id", sa.Integer(), sa.ForeignKey("transit_stops.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("geometry_json", sa.Text(), nullable=False),
        sa.Column("source_path", sa.String(300), nullable=False),
        sa.Column("source_version", sa.String(80), nullable=False),
        sa.Column("data_quality", sa.String(30), nullable=False),
        sa.Column("csv_comparison_json", sa.Text()),
        sa.UniqueConstraint("route_id", "ordinal", name="uq_segment_route_ordinal"),
        sa.CheckConstraint("ordinal > 0", name="ck_segment_ordinal"),
        sa.CheckConstraint("data_quality = 'approximate'", name="ck_segment_quality"),
    )
    op.create_index("ix_segments_route", "route_segments", ["route_id", "ordinal"])
    op.create_table(
        "trips",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("origin", sa.String(200), nullable=False),
        sa.Column("destination", sa.String(200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False),
        sa.Column("seed_key", sa.String(100), unique=True),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.CheckConstraint("is_synthetic IN (0, 1)", name="ck_trip_synthetic"),
    )
    op.create_index("ix_trips_seed_key", "trips", ["seed_key"])
    op.create_table(
        "trip_segments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trip_id", sa.String(80), sa.ForeignKey("trips.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(30), nullable=False),
        sa.Column("origin", sa.String(200), nullable=False),
        sa.Column("destination", sa.String(200), nullable=False),
        sa.Column("route_segment_id", sa.Integer(), sa.ForeignKey("route_segments.id", ondelete="SET NULL")),
        sa.Column("fare_bdt", sa.Integer()),
        sa.Column("estimated_minutes", sa.Integer()),
        sa.UniqueConstraint("trip_id", "ordinal", name="uq_trip_segment_ordinal"),
        sa.CheckConstraint("ordinal > 0", name="ck_trip_segment_ordinal"),
        sa.CheckConstraint("estimated_minutes IS NULL OR estimated_minutes > 0", name="ck_trip_segment_minutes"),
        sa.CheckConstraint("fare_bdt IS NULL OR fare_bdt >= 0", name="ck_trip_segment_fare"),
    )
    op.create_index("ix_trip_segments_trip", "trip_segments", ["trip_id", "ordinal"])
    op.create_table(
        "incident_reports",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("kind", sa.String(80), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("location", sa.String(200), nullable=False),
        sa.Column("route_id", sa.Integer(), sa.ForeignKey("transit_routes.id", ondelete="SET NULL")),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(40), nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False),
        sa.Column("observed_at", sa.String(40)),
        sa.Column("actor_label", sa.String(100), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.Column("updated_at", sa.String(40), nullable=False),
        sa.CheckConstraint("status IN ('reported', 'confirmed', 'resolved', 'expired', 'disputed')", name="ck_incident_status"),
        sa.CheckConstraint("version > 0", name="ck_incident_version"),
        sa.CheckConstraint("source_type IN ('rider_report', 'synthetic_example')", name="ck_incident_source_type"),
        sa.CheckConstraint("is_synthetic IN (0, 1)", name="ck_incident_synthetic"),
        sa.CheckConstraint("(source_type = 'synthetic_example' AND is_synthetic = 1) OR (source_type = 'rider_report' AND is_synthetic = 0)", name="ck_incident_source_synthetic_match"),
    )
    op.create_index("ix_incident_status_observed", "incident_reports", ["status", "observed_at"])
    op.create_table(
        "incident_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("report_id", sa.String(80), sa.ForeignKey("incident_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("actor_label", sa.String(100), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("before_json", sa.Text()),
        sa.Column("after_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
    )
    op.create_index("ix_incident_events_report", "incident_events", ["report_id", "id"])
    op.execute("CREATE TRIGGER incident_events_no_update BEFORE UPDATE ON incident_events BEGIN SELECT RAISE(ABORT, 'incident events are append-only'); END")
    op.execute("CREATE TRIGGER incident_events_no_delete BEFORE DELETE ON incident_events BEGIN SELECT RAISE(ABORT, 'incident events are append-only'); END")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS incident_events_no_delete")
    op.execute("DROP TRIGGER IF EXISTS incident_events_no_update")
    op.drop_index("ix_incident_events_report", table_name="incident_events")
    op.drop_table("incident_events")
    op.drop_index("ix_incident_status_observed", table_name="incident_reports")
    op.drop_table("incident_reports")
    op.drop_index("ix_trip_segments_trip", table_name="trip_segments")
    op.drop_table("trip_segments")
    op.drop_index("ix_trips_seed_key", table_name="trips")
    op.drop_table("trips")
    op.drop_index("ix_segments_route", table_name="route_segments")
    op.drop_table("route_segments")
    op.drop_index("ix_stops_route_name", table_name="transit_stops")
    op.drop_table("transit_stops")
    op.drop_table("transit_routes")
    op.drop_table("map_data_source_files")
    op.drop_table("map_data_imports")
