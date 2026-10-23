from fastapi import APIRouter, status, Response
from sqlalchemy import text
from app.core.database import get_engine
from app.core.config import settings
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check(response: Response):
    """
    Health check endpoint: verifies database connectivity and core service readiness.
    Returns HTTP 200 when healthy, or HTTP 503 if the database is unreachable.
    Never exposes credentials, connection strings, or internal tracebacks.
    """
    db_healthy = False
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            db_healthy = True
    except Exception as e:
        logger.error(f"Health check database connectivity failure: {e}")
        db_healthy = False

    if not db_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "detail": "Database service is currently unreachable.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "status": "healthy",
        "database": "connected",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "model": settings.GROQ_MODEL,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
