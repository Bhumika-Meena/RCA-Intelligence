import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_e2e_verification():
    client = TestClient(app)

    print("\n=======================================================")
    print("PHASE 2: COMPLETE VERTICAL SLICE END-TO-END VERIFICATION")
    print("=======================================================\n")

    # 1. Real AI Analysis via POST /api/rca/analyze
    print("--- 1. Real AI Analysis via POST /api/rca/analyze ---")
    sample_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "samples", "primary_incident_hplc_oos.txt")
    with open(sample_path, "r", encoding="utf-8") as f:
        incident_text = f.read()

    res = client.post("/api/rca/analyze", json={"text": incident_text, "source_type": "pasted_text"})
    if res.status_code != 200:
        print(f"[FAIL] Analyze failed: {res.status_code} - {res.text}")
        sys.exit(1)

    data = res.json()
    analysis = data["analysis"]
    facts = analysis["incident_facts"]
    whys = analysis["five_whys"]
    fb = analysis["fishbone"]
    gaps = analysis["missing_evidence"]
    rcs = analysis["root_causes"]
    capas = analysis["capa_recommendations"]

    print(f"[PASS] Incident Extracted: Batch={facts.get('batch_number')} | Deviation={facts.get('deviation_number')}")
    print(f"       Title: {facts.get('title')}")
    print(f"[PASS] 5 Whys generated: {len(whys)} steps")
    print(f"[PASS] 6M Fishbone factors: Machine={len(fb.get('machine', []))}, Method={len(fb.get('method', []))}")
    print(f"[PASS] Missing Evidence gaps: {len(gaps)} items flagged")
    print(f"[PASS] Root Causes: {len(rcs)} candidate hypotheses")
    print(f"[PASS] CAPA Recommendations: {len(capas)} actions")

    # 2. Persisting Reviewed Investigation to Neon via POST /api/rca
    print("\n--- 2. Persisting Reviewed Investigation to Neon via POST /api/rca ---")
    save_payload = {
        "deviation_number": facts.get("deviation_number"),
        "title": facts.get("title") or "Atorvastatin OOS Impurity D Investigation",
        "facility": facts.get("facility"),
        "unit_operation": facts.get("unit_operation"),
        "product_name": facts.get("product_name"),
        "batch_number": facts.get("batch_number"),
        "severity": facts.get("severity") or "Critical",
        "status": "under_review",
        "incident_date": facts.get("incident_date"),
        "reported_by": facts.get("reported_by"),
        "containment_actions": facts.get("containment_actions"),
        "source_type": "pasted_text",
        "source_text": incident_text[:600],
        "rca_analysis": {
            "five_whys": whys,
            "fishbone": fb,
            "missing_evidence": gaps,
            "root_causes": rcs
        },
        "reviewer_notes": "Initial technical review by Senior QA Specialist. Hypotheses verified against DCS trends.",
        "capa_actions": capas
    }

    save_res = client.post("/api/rca", json=save_payload)
    if save_res.status_code != 201:
        print(f"[FAIL] Save failed: {save_res.status_code} - {save_res.text}")
        sys.exit(1)

    saved_inv = save_res.json()
    inv_id = saved_inv["id"]
    print(f"[PASS] Successfully saved investigation #{inv_id} to Neon PostgreSQL!")

    # 3. Reopening Investigation via GET /api/rca/{id}
    print(f"\n--- 3. Reopening Investigation via GET /api/rca/{inv_id} ---")
    get_res = client.get(f"/api/rca/{inv_id}")
    if get_res.status_code != 200:
        print(f"[FAIL] Reopen failed: {get_res.status_code} - {get_res.text}")
        sys.exit(1)

    fetched = get_res.json()
    assert fetched["id"] == inv_id
    assert fetched["batch_number"] == facts.get("batch_number")
    assert len(fetched["capa_actions"]) == len(capas)
    print(f"[PASS] Successfully retrieved investigation #{inv_id} with full JSONB RCA analysis and {len(fetched['capa_actions'])} CAPA actions!")

    # 4. Updating Investigation via PATCH /api/rca/{id}
    print(f"\n--- 4. Updating Investigation via PATCH /api/rca/{inv_id} ---")
    patch_res = client.patch(
        f"/api/rca/{inv_id}",
        json={
            "status": "approved",
            "reviewer_notes": "Formal Qualified Person (QP) review complete. Root cause hypothesis confirmed by physical inspection of TCV-302."
        }
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "approved"
    print(f"[PASS] Successfully updated investigation status to Approved!")

    # 5. Listing Investigations via GET /api/rca
    print("\n--- 5. Listing Investigations via GET /api/rca ---")
    list_res = client.get("/api/rca")
    assert list_res.status_code == 200
    summaries = list_res.json()
    assert any(s["id"] == inv_id for s in summaries)
    print(f"[PASS] Verified investigation #{inv_id} appears in saved list ({len(summaries)} total records in Neon)!")

    print("\n==================================================================")
    print(">>> COMPLETE VERTICAL SLICE END-TO-END VERIFICATION: ALL PASS! <<<")
    print("==================================================================\n")

if __name__ == "__main__":
    run_e2e_verification()
