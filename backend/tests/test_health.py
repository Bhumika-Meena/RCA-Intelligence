from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app

client = TestClient(app)

def test_health_endpoint_healthy():
    """Verify GET /api/health returns HTTP 200 and healthy status with live DB."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data
    assert data["groq_configured"] is True
    assert "model" in data

def test_health_endpoint_database_unavailable():
    """Verify GET /api/health returns HTTP 503 and safe error when database fails."""
    with patch("app.api.health.get_engine") as mock_engine:
        mock_engine.side_effect = Exception("Simulated network timeout to DB cluster")
        response = client.get("/api/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
        assert "password" not in response.text.lower()
        assert "postgres" not in response.text.lower()
