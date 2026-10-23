from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is not configured. Please set it in backend/.env")
    
    # Handle sslmode and postgres prefix if necessary
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

_engine = None
_SessionLocal = None

def get_db():
    global _engine, _SessionLocal
    if _engine is None:
        _engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    
    db: Session = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
