from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from sqlalchemy.orm import sessionmaker

from app.core.database import make_engine
from app.db.models import Base, IncidentReport, RouteSegment, TransitRoute, TransitStop
from app.services import chat
from app.models.schemas import ChatMessageResponse
from app.models.schemas import ChatMessageCreate, IncidentCreate
from pydantic import ValidationError


class ChatServiceIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="poth-mitro-chat-")
        self.database_path = Path(self.temp.name) / "chat-check.db"
        self.engine = make_engine(self.database_path)
        Base.metadata.create_all(self.engine)
        self.factory = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)
        self._seed_graph()

    def tearDown(self) -> None:
        self.engine.dispose()
        self.temp.cleanup()

    def _seed_graph(self) -> None:
        with self.factory.begin() as session:
            bus = TransitRoute(source_key="test:bus", source_id="bus", name="Test bus", mode="bus", original_status="active", source_path="test", source_version="test", data_quality="approximate")
            rail = TransitRoute(source_key="test:rail", source_id="rail", name="Test rail", mode="rail", original_status="active", source_path="test", source_version="test", data_quality="approximate")
            session.add_all([bus, rail])
            session.flush()
            alpha = TransitStop(source_key="test:alpha", source_id="alpha", route_id=bus.id, name="Alpha", latitude=23.70, longitude=90.40, source_path="test", coordinate_order="lon_lat", crs_datum="WGS84", data_quality="approximate")
            beta_bus = TransitStop(source_key="test:beta_bus", source_id="beta_bus", route_id=bus.id, name="Beta", latitude=23.71, longitude=90.41, source_path="test", coordinate_order="lon_lat", crs_datum="WGS84", data_quality="approximate")
            beta_rail = TransitStop(source_key="test:beta_rail", source_id="beta_rail", route_id=rail.id, name="Beta", latitude=23.71, longitude=90.41, source_path="test", coordinate_order="lon_lat", crs_datum="WGS84", data_quality="approximate")
            gamma = TransitStop(source_key="test:gamma", source_id="gamma", route_id=rail.id, name="Gamma", latitude=23.72, longitude=90.42, source_path="test", coordinate_order="lon_lat", crs_datum="WGS84", data_quality="approximate")
            session.add_all([alpha, beta_bus, beta_rail, gamma])
            session.flush()
            session.add_all([
                RouteSegment(source_key="test:bus-segment", route_id=bus.id, ordinal=1, from_stop_id=alpha.id, to_stop_id=beta_bus.id, geometry_json=json.dumps([{"longitude": 90.40, "latitude": 23.70}, {"longitude": 90.41, "latitude": 23.71}]), source_path="test", source_version="test", data_quality="approximate"),
                RouteSegment(source_key="test:rail-segment", route_id=rail.id, ordinal=1, from_stop_id=beta_rail.id, to_stop_id=gamma.id, geometry_json=json.dumps([{"longitude": 90.41, "latitude": 23.71}, {"longitude": 90.42, "latitude": 23.72}]), source_path="test", source_version="test", data_quality="approximate"),
            ])

    def _new_session(self) -> str:
        with self.factory() as session:
            data = chat.create_session(session)
        UUID(data["session"]["id"])
        self.assertFalse(data["ai_enabled"])
        return data["session"]["id"]

    def _message(self, session_id: str, message: str) -> dict:
        with self.factory() as session:
            result = chat.respond(session, session_id, message)
        self.assertIsNotNone(result)
        return ChatMessageResponse.model_validate(result).model_dump()

    def test_english_and_banglish_route_search_uses_stored_graph(self) -> None:
        first = self._message(self._new_session(), "Plan a trip from Alpha to Gamma under BDT 50 as a student")
        self.assertEqual(first["intent"]["intent"], "route_search")
        self.assertTrue(first["intent"]["student"])
        self.assertTrue(first["data"]["journey"]["options"])
        self.assertIn("fare unavailable", first["assistant_message"]["content"])
        followup = self._message(first["session"]["id"], "what about the student fare?")
        self.assertEqual(followup["intent"]["intent"], "fare_question")
        self.assertTrue(followup["data"]["journey"]["options"])
        self.assertIn("fare unavailable", followup["assistant_message"]["content"])
        duration = self._message(first["session"]["id"], "how long is that route?")
        self.assertEqual(duration["intent"]["intent"], "route_search")
        self.assertIn("travel time unavailable", duration["assistant_message"]["content"])

        second = self._message(self._new_session(), "Alpha theke Gamma jabo")
        self.assertEqual(second["intent"]["language"], "banglish")
        self.assertTrue(second["data"]["journey"]["options"])
        self.assertIn("theke", second["assistant_message"]["content"])

    def test_constraints_are_applied_and_unknown_places_are_not_guessed(self) -> None:
        session_id = self._new_session()
        result = self._message(session_id, "from Alpha to Gamma avoid Beta")
        self.assertTrue(result["data"]["journey"]["applied_constraints"]["avoid_place_ids"])
        self.assertFalse(result["data"]["journey"]["options"])

        result = self._message(session_id, "from Alpha to Gamma avoid bus")
        self.assertEqual(result["data"]["journey"]["applied_constraints"]["avoid_modes"], ["bus"])
        self.assertFalse(result["data"]["journey"]["options"])

    def test_report_intake_followup_and_session_isolation(self) -> None:
        session_id = self._new_session()
        first = self._message(session_id, "report waterlogging")
        self.assertEqual(first["data"]["report"]["status"], "needs_details")
        second = self._message(session_id, "Beta")
        self.assertEqual(second["data"]["report"]["status"], "needs_details")
        self.assertEqual(len(second["data"]["report"]["route_choices"]), 2)
        third = self._message(session_id, "bus")
        self.assertEqual(third["data"]["report"]["status"], "reported")
        self.assertIn("unverified", third["assistant_message"]["content"])
        with self.factory() as session:
            reports = session.query(IncidentReport).all()
            self.assertEqual(len(reports), 1)
            self.assertEqual(reports[0].status, "reported")
            self.assertFalse(reports[0].is_synthetic)

        other_id = self._new_session()
        with self.factory() as session:
            self.assertEqual(chat.list_messages(session, other_id), [])
            messages = chat.list_messages(session, session_id)
            self.assertEqual(len(messages), 6)
            self.assertEqual([message["role"] for message in messages], ["user", "assistant"] * 3)
            self.assertTrue(chat.delete_session(session, session_id))
            self.assertIsNone(chat.list_messages(session, session_id))

    def test_provider_failure_falls_back_without_using_model_as_authority(self) -> None:
        with patch.object(chat.settings, "LLM_PROVIDER", "gemini"), patch.object(chat.settings, "GEMINI_API_KEY", "test-key"), patch("app.services.chat.urllib.request.urlopen", side_effect=TimeoutError("timeout")):
            intent, provider = chat._parse_intent("from Alpha to Gamma")
        self.assertEqual(provider, "deterministic")
        self.assertEqual(intent["intent"], "route_search")

    def test_report_is_listed_as_unverified_alert_and_requests_are_validated(self) -> None:
        session_id = self._new_session()
        report = self._message(session_id, "report traffic at Alpha")
        self.assertEqual(report["data"]["report"]["status"], "reported")
        self.assertFalse(report["data"]["report"]["is_synthetic"])
        alerts = self._message(session_id, "any traffic report at Alpha?")
        self.assertEqual(alerts["intent"]["intent"], "alerts")
        self.assertEqual(alerts["data"]["reports"][0]["status"], "reported")
        self.assertEqual(alerts["data"]["reports"][0]["freshness"], "current")
        self.assertIn("unverified", alerts["assistant_message"]["content"])

        with self.assertRaises(ValidationError):
            ChatMessageCreate(message="   ")
        with self.assertRaises(ValidationError):
            IncidentCreate(kind="", title="x", location="Alpha", mode="road", source_type="traveller_report")

    def test_model_report_classification_cannot_write_without_explicit_submit(self) -> None:
        session_id = self._new_session()
        model_intent = {
            "intent": "report", "origin": None, "destination": None, "budget_bdt": None,
            "student": False, "avoid_modes": [], "preferred_modes": [], "avoid_places": [],
            "max_transfers": None, "avoid_reported_routes": False, "language": "english",
        }
        with patch("app.services.chat._gemini_intent", return_value=model_intent):
            response = self._message(session_id, "Is there waterlogging at Alpha?")
        self.assertNotIn("report", response["data"])
        self.assertIn("not submitted", response["assistant_message"]["content"])
        with self.factory() as session:
            self.assertEqual(session.query(IncidentReport).count(), 0)


if __name__ == "__main__":
    unittest.main()
