import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
import pymupdf

client = TestClient(app)

def test_empty_incident_input_rejected():
    """Verify empty or whitespace-only incident input returns 400 with actionable error."""
    res = client.post("/api/rca/analyze", json={"text": "   ", "source_type": "pasted_text"})
    assert res.status_code == 400
    assert "No incident material provided" in res.json()["detail"]

def test_too_short_incident_input_rejected():
    """Verify sub-threshold incident input (<20 characters) returns 422 with clear guidance."""
    res = client.post("/api/rca/analyze", json={"text": "Too brief.", "source_type": "pasted_text"})
    assert res.status_code == 422
    assert "too short" in res.json()["detail"].lower()

def test_empty_pdf_upload_rejected():
    """Verify 0-byte file upload returns 400."""
    files = {"file": ("empty.pdf", b"", "application/pdf")}
    res = client.post("/api/rca/analyze", files=files)
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

def test_scanned_pdf_without_text_rejected():
    """Verify raster/scanned PDF without text stream returns 422 explaining no extractable text."""
    # Create an in-memory 1-page PDF without any text elements
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    # Add a blank rectangle (simulating a scanned image without OCR)
    page.draw_rect(pymupdf.Rect(50, 50, 500, 700), color=(0.8, 0.8, 0.8), fill=(0.9, 0.9, 0.9))
    pdf_bytes = doc.tobytes()
    doc.close()

    files = {"file": ("scanned_document.pdf", pdf_bytes, "application/pdf")}
    res = client.post("/api/rca/analyze", files=files)
    assert res.status_code == 422
    assert "no extractable text" in res.json()["detail"].lower()

def test_nonexistent_investigation_returns_404():
    """Verify requesting a non-existent investigation ID returns 404."""
    res = client.get("/api/rca/99999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_patch_nonexistent_investigation_returns_404():
    """Verify patching a non-existent investigation ID returns 404."""
    res = client.patch("/api/rca/99999999", json={"status": "approved"})
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_invalid_update_payload_rejected():
    """Verify malformed JSON/type mismatch returns 422."""
    res = client.patch("/api/rca/1", json={"capa_actions": "not-a-list"})
    assert res.status_code == 422
