import pytest
from app.core.database import get_engine
from sqlalchemy.orm import sessionmaker
from app.models.investigation import Investigation
from app.models.capa import CapaAction
import uuid

@pytest.fixture
def db_session():
    engine = get_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_investigation_and_capa_roundtrip_persistence(db_session):
    """
    Integration test verifying write, read, relationship navigation, and cascade cleanup
    on the live Neon PostgreSQL database.
    """
    unique_tag = f"TEST-DEV-{uuid.uuid4().hex[:8]}"
    
    # 1. Create a full pharmaceutical investigation record with JSONB rca_analysis
    sample_rca = {
        "five_whys": [
            {"why_number": 1, "question": "Why did Impurity D exceed specification?", "answer": "Temperature fluctuated during anti-solvent addition."},
            {"why_number": 2, "question": "Why did temperature fluctuate?", "answer": "Heating jacket control valve hunted and operator increased addition rate."}
        ],
        "fishbone": {
            "machine": ["TCV-302 valve stick-slip", "FM-302 flow meter error E-14"],
            "method": ["Anti-solvent addition rate exceeded recipe setpoint"],
            "material": ["Methanol Lot #ME-2026-11 verified within specs"],
            "man": ["Manual bypass valve adjustment by shift operator"],
            "measurement": ["TE-302 due for annual recalibration"],
            "milieu": ["Room ambient temperature nominal"]
        },
        "missing_evidence": [
            {"item": "TE-302 sensor calibration certificate", "priority": "High"},
            {"item": "FM-302 instrumentation diagnostic log", "priority": "Medium"}
        ],
        "root_causes": [
            {
                "hypothesis": "Thermal degradation induced by uncontrolled anti-solvent feed rate",
                "confidence": 0.88,
                "status": "candidate"
            }
        ]
    }

    test_inv = Investigation(
        deviation_number=unique_tag,
        title="Test Batch OOS Impurity Investigation",
        facility="API Block B, Line 3",
        unit_operation="Crystallization",
        product_name="Atorvastatin Calcium Trihydrate",
        batch_number="TEST-ATC-001",
        severity="Critical",
        status="under_review",
        source_type="pasted_text",
        source_text="Test incident payload for automated integration verification",
        rca_analysis=sample_rca,
        reviewer_notes="Automated Phase 1 verification test"
    )

    db_session.add(test_inv)
    db_session.commit()
    db_session.refresh(test_inv)

    inv_id = test_inv.id
    assert inv_id is not None
    assert test_inv.deviation_number == unique_tag

    try:
        # 2. Add related CAPA actions (Corrective & Preventive)
        capa_1 = CapaAction(
            investigation_id=inv_id,
            action_type="corrective",
            description="Replace sticking seal kit on temperature control valve TCV-302",
            rationale="Eliminates hunting during anti-solvent cooling cycle",
            owner="Engineering Maintenance",
            target_date="2026-11-05",
            effectiveness_criteria="Verify stable temperature +/- 1.0 deg C across next 3 batches",
            status="open"
        )
        capa_2 = CapaAction(
            investigation_id=inv_id,
            action_type="preventive",
            description="Update SOP-CR-201 to enforce automated interlock shutdown if bypass flow is used",
            rationale="Prevents operator manual override without supervisor authorization",
            owner="Quality Assurance",
            target_date="2026-11-15",
            effectiveness_criteria="100% training completion and zero manual bypass events for 6 months",
            status="open"
        )
        db_session.add_all([capa_1, capa_2])
        db_session.commit()

        # 3. Read back from database using a fresh query
        db_session.expire_all()
        fetched_inv = db_session.query(Investigation).filter(Investigation.id == inv_id).first()
        assert fetched_inv is not None
        assert fetched_inv.deviation_number == unique_tag
        assert fetched_inv.product_name == "Atorvastatin Calcium Trihydrate"
        assert fetched_inv.severity == "Critical"
        
        # Verify JSONB structured payload integrity
        assert fetched_inv.rca_analysis is not None
        assert len(fetched_inv.rca_analysis["five_whys"]) == 2
        assert "machine" in fetched_inv.rca_analysis["fishbone"]
        assert fetched_inv.rca_analysis["fishbone"]["machine"][0] == "TCV-302 valve stick-slip"
        
        # Verify relationship navigation
        assert len(fetched_inv.capa_actions) == 2
        action_types = {a.action_type for a in fetched_inv.capa_actions}
        assert action_types == {"corrective", "preventive"}
        assert fetched_inv.capa_actions[0].investigation_id == inv_id

        # 4. Verify update capability
        fetched_inv.status = "approved"
        db_session.commit()
        db_session.refresh(fetched_inv)
        assert fetched_inv.status == "approved"

    finally:
        # 5. Strict Cleanup: Delete the test investigation (cascades to related CAPAs)
        cleanup_inv = db_session.query(Investigation).filter(Investigation.id == inv_id).first()
        if cleanup_inv:
            db_session.delete(cleanup_inv)
            db_session.commit()

        # Confirm cleanup
        verified_deleted = db_session.query(Investigation).filter(Investigation.id == inv_id).first()
        assert verified_deleted is None
        orphan_capas = db_session.query(CapaAction).filter(CapaAction.investigation_id == inv_id).all()
        assert len(orphan_capas) == 0
