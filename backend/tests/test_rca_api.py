from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, get_engine
from app.models.investigation import Investigation
from app.models.capa import CapaAction
import uuid

client = TestClient(app)

def test_analyze_empty_payload_fails_gracefully():
    """Verify POST /api/rca/analyze rejects empty input with 400 or 422 without server crash."""
    response = client.post("/api/rca/analyze", json={"text": "short"})
    assert response.status_code in [400, 422]

def test_rca_crud_api_lifecycle():
    """
    Test the full API lifecycle for investigations:
    1. List existing investigations
    2. Save a new investigation with CAPA actions
    3. Retrieve the saved investigation by ID
    4. Update status and reviewer notes via PATCH
    5. Clean up created record from Neon
    """
    unique_tag = f"DEV-API-{uuid.uuid4().hex[:6].upper()}"

    payload = {
        "deviation_number": unique_tag,
        "title": "API Test - Vacuum Drying Temperature Excursion",
        "facility": "API Block C, Suite 1",
        "unit_operation": "Vacuum Drying",
        "product_name": "Paracetamol DC Grade",
        "batch_number": "PAR-2026-009",
        "severity": "Major",
        "status": "draft",
        "incident_date": "2026-10-23 09:00",
        "reported_by": "QA Shift Inspector",
        "containment_actions": "Quarantine tray dryers TD-101 and TD-102",
        "source_type": "pasted_text",
        "source_text": "Vacuum dryer TD-101 experienced a 15-minute temperature spike to 65C during drying.",
        "rca_analysis": {
            "five_whys": [
                {"why_number": 1, "question": "Why did temp spike?", "answer": "Steam regulator pressure surged."}
            ],
            "fishbone": {
                "machine": ["Steam pressure regulator PRV-04 diaphragm worn"],
                "method": ["Standard drying recipe set at 50C"],
                "material": ["Moist cake within specification"],
                "man": ["Operator acknowledged alarm within 2 mins"],
                "measurement": ["PT-101 calibrated 2 months ago"],
                "milieu": ["Cleanroom humidity nominal"]
            },
            "missing_evidence": [
                {"item": "Utility boiler steam header pressure log", "priority": "High", "rationale": "Verify if surge was plant-wide"}
            ],
            "root_causes": [
                {
                    "hypothesis": "Mechanical failure of PRV-04 diaphragm causing steam valve overshoot",
                    "category": "Primary Root Cause",
                    "supporting_evidence": ["Historical SCADA pressure spikes on header"],
                    "contradicting_evidence": [],
                    "confidence_level": "High",
                    "status": "candidate"
                }
            ]
        },
        "reviewer_notes": "Initial draft created via API test",
        "capa_actions": [
            {
                "action_type": "corrective",
                "description": "Replace diaphragm and recalibrate PRV-04",
                "rationale": "Restores steam control accuracy",
                "owner": "Mechanical Utilities",
                "target_date": "2026-10-30",
                "effectiveness_criteria": "Zero pressure overshoot on next 5 batches",
                "status": "open"
            }
        ]
    }

    # 1. Save investigation
    create_res = client.post("/api/rca", json=payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    inv_id = created_data["id"]
    assert inv_id is not None
    assert created_data["deviation_number"] == unique_tag
    assert len(created_data["capa_actions"]) == 1

    try:
        # 2. List investigations - verify our created investigation is listed
        list_res = client.get("/api/rca")
        assert list_res.status_code == 200
        summaries = list_res.json()
        assert any(item["id"] == inv_id for item in summaries)

        # 3. Retrieve by ID
        get_res = client.get(f"/api/rca/{inv_id}")
        assert get_res.status_code == 200
        detail = get_res.json()
        assert detail["title"] == payload["title"]
        assert detail["rca_analysis"]["fishbone"]["machine"][0] == "Steam pressure regulator PRV-04 diaphragm worn"

        # 4. Update via PATCH
        patch_payload = {
            "status": "approved",
            "reviewer_notes": "QA Review completed. Root cause hypothesis accepted by Qualified Person."
        }
        patch_res = client.patch(f"/api/rca/{inv_id}", json=patch_payload)
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["status"] == "approved"
        assert "Qualified Person" in updated["reviewer_notes"]

    finally:
        # 5. Clean up from Neon database
        engine = get_engine()
        from sqlalchemy.orm import sessionmaker
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        inv_to_del = db.query(Investigation).filter(Investigation.id == inv_id).first()
        if inv_to_del:
            db.delete(inv_to_del)
            db.commit()
        db.close()
