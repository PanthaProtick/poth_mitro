from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MapDataImport(Base):
    __tablename__ = "map_data_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_version: Mapped[str] = mapped_column(String(80), nullable=False)
    manifest_sha256: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    imported_at: Mapped[str] = mapped_column(String(40), nullable=False)


class MapDataSourceFile(Base):
    __tablename__ = "map_data_source_files"
    __table_args__ = (UniqueConstraint("import_id", "path", name="uq_map_source_file_path"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    import_id: Mapped[int] = mapped_column(ForeignKey("map_data_imports.id", ondelete="CASCADE"), nullable=False)
    path: Mapped[str] = mapped_column(String(300), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    format: Mapped[str] = mapped_column(String(30), nullable=False)
    coordinate_order: Mapped[str] = mapped_column(String(80), nullable=False)
    crs_datum: Mapped[str] = mapped_column(String(80), nullable=False)
    parsed_record_count: Mapped[int | None] = mapped_column(Integer)
    accepted_count: Mapped[int] = mapped_column(Integer, nullable=False)
    exclusion_reason: Mapped[str | None] = mapped_column(Text)


class TransitRoute(Base):
    __tablename__ = "transit_routes"
    __table_args__ = (
        CheckConstraint("mode IN ('rail', 'bus')", name="ck_transit_route_mode"),
        CheckConstraint("data_quality = 'approximate'", name="ck_transit_route_quality"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_key: Mapped[str] = mapped_column(String(240), unique=True, nullable=False)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    original_status: Mapped[str] = mapped_column(String(80), nullable=False)
    source_path: Mapped[str] = mapped_column(String(300), nullable=False)
    source_version: Mapped[str] = mapped_column(String(80), nullable=False)
    data_quality: Mapped[str] = mapped_column(String(30), nullable=False)

    stops: Mapped[list["TransitStop"]] = relationship(back_populates="route", cascade="all, delete-orphan")
    segments: Mapped[list["RouteSegment"]] = relationship(back_populates="route", cascade="all, delete-orphan")


class TransitStop(Base):
    __tablename__ = "transit_stops"
    __table_args__ = (
        UniqueConstraint("route_id", "source_id", name="uq_stop_route_source"),
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_stop_latitude"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_stop_longitude"),
        CheckConstraint("data_quality = 'approximate'", name="ck_stop_quality"),
        Index("ix_stops_route_name", "route_id", "name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_key: Mapped[str] = mapped_column(String(240), unique=True, nullable=False)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    route_id: Mapped[int] = mapped_column(ForeignKey("transit_routes.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_path: Mapped[str] = mapped_column(String(300), nullable=False)
    coordinate_order: Mapped[str] = mapped_column(String(50), nullable=False)
    crs_datum: Mapped[str] = mapped_column(String(80), nullable=False)
    data_quality: Mapped[str] = mapped_column(String(30), nullable=False)

    route: Mapped[TransitRoute] = relationship(back_populates="stops")


class RouteSegment(Base):
    __tablename__ = "route_segments"
    __table_args__ = (
        UniqueConstraint("route_id", "ordinal", name="uq_segment_route_ordinal"),
        CheckConstraint("ordinal > 0", name="ck_segment_ordinal"),
        CheckConstraint("data_quality = 'approximate'", name="ck_segment_quality"),
        Index("ix_segments_route", "route_id", "ordinal"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_key: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    route_id: Mapped[int] = mapped_column(ForeignKey("transit_routes.id", ondelete="CASCADE"), nullable=False)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    from_stop_id: Mapped[int] = mapped_column(ForeignKey("transit_stops.id", ondelete="RESTRICT"), nullable=False)
    to_stop_id: Mapped[int] = mapped_column(ForeignKey("transit_stops.id", ondelete="RESTRICT"), nullable=False)
    geometry_json: Mapped[str] = mapped_column(Text, nullable=False)
    source_path: Mapped[str] = mapped_column(String(300), nullable=False)
    source_version: Mapped[str] = mapped_column(String(80), nullable=False)
    data_quality: Mapped[str] = mapped_column(String(30), nullable=False)
    csv_comparison_json: Mapped[str | None] = mapped_column(Text)

    route: Mapped[TransitRoute] = relationship(back_populates="segments")


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("is_synthetic IN (0, 1)", name="ck_trip_synthetic"),
        Index("ix_trips_seed_key", "seed_key"),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(nullable=False, default=True)
    seed_key: Mapped[str | None] = mapped_column(String(100), unique=True)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)

    segments: Mapped[list["TripSegment"]] = relationship(back_populates="trip", cascade="all, delete-orphan", order_by="TripSegment.ordinal")


class TripSegment(Base):
    __tablename__ = "trip_segments"
    __table_args__ = (
        UniqueConstraint("trip_id", "ordinal", name="uq_trip_segment_ordinal"),
        CheckConstraint("ordinal > 0", name="ck_trip_segment_ordinal"),
        CheckConstraint("estimated_minutes IS NULL OR estimated_minutes > 0", name="ck_trip_segment_minutes"),
        CheckConstraint("fare_bdt IS NULL OR fare_bdt >= 0", name="ck_trip_segment_fare"),
        Index("ix_trip_segments_trip", "trip_id", "ordinal"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[str] = mapped_column(String(30), nullable=False)
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    route_segment_id: Mapped[int | None] = mapped_column(ForeignKey("route_segments.id", ondelete="SET NULL"))
    fare_bdt: Mapped[int | None] = mapped_column(Integer)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer)

    trip: Mapped[Trip] = relationship(back_populates="segments")
    route_segment: Mapped[RouteSegment | None] = relationship()


class IncidentReport(Base):
    __tablename__ = "incident_reports"
    __table_args__ = (
        CheckConstraint("status IN ('reported', 'confirmed', 'resolved', 'expired', 'disputed')", name="ck_incident_status"),
        CheckConstraint("version > 0", name="ck_incident_version"),
        CheckConstraint("source_type IN ('rider_report', 'synthetic_example')", name="ck_incident_source_type"),
        CheckConstraint("is_synthetic IN (0, 1)", name="ck_incident_synthetic"),
        CheckConstraint("(source_type = 'synthetic_example' AND is_synthetic = 1) OR (source_type = 'rider_report' AND is_synthetic = 0)", name="ck_incident_source_synthetic_match"),
        Index("ix_incident_status_observed", "status", "observed_at"),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    kind: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    mode: Mapped[str | None] = mapped_column(String(80))
    direction: Mapped[str | None] = mapped_column(String(120))
    confirmation_note: Mapped[str | None] = mapped_column(Text)
    report_source: Mapped[str | None] = mapped_column(String(40))
    route_id: Mapped[int | None] = mapped_column(ForeignKey("transit_routes.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="reported")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    source_type: Mapped[str] = mapped_column(String(40), nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(nullable=False, default=False)
    observed_at: Mapped[str | None] = mapped_column(String(40))
    actor_label: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False)

    events: Mapped[list["IncidentEvent"]] = relationship(back_populates="report", cascade="all, delete-orphan", order_by="IncidentEvent.id")


class IncidentEvent(Base):
    __tablename__ = "incident_events"
    __table_args__ = (Index("ix_incident_events_report", "report_id", "id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("incident_reports.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    actor_label: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    before_json: Mapped[str | None] = mapped_column(Text)
    after_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)

    report: Mapped[IncidentReport] = relationship(back_populates="events")


class MutationReceipt(Base):
    __tablename__ = "mutation_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idempotency_key: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    request_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    operation: Mapped[str] = mapped_column(String(160), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)
