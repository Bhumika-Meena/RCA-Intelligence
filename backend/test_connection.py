import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from sqlalchemy import create_engine, text
from langchain_groq import ChatGroq

def test_groq():
    print("\n--- 1. Testing Groq API Connectivity ---")
    if not settings.GROQ_API_KEY or "your_groq_api_key_here" in settings.GROQ_API_KEY:
        print("[FAIL] GROQ_API_KEY is not set or still has the placeholder in backend/.env")
        return False
    
    try:
        print(f"Connecting to Groq with model: {settings.GROQ_MODEL}...")
        llm = ChatGroq(
            api_key=settings.GROQ_API_KEY,
            model_name=settings.GROQ_MODEL,
            temperature=0.1,
            max_tokens=50
        )
        response = llm.invoke("Pharmaceutical quality test. Respond with: 'Groq Ready'")
        print(f"[SUCCESS] Groq Response: {response.content.strip()}")
        return True
    except Exception as e:
        print(f"[FAIL] Groq connection failed: {e}")
        return False

def test_neon_postgres():
    print("\n--- 2. Testing Neon PostgreSQL Database Connectivity ---")
    if not settings.DATABASE_URL or "ep-cool-dawn" in settings.DATABASE_URL:
        print("[FAIL] DATABASE_URL is not set or still has placeholder in backend/.env")
        return False
    
    try:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        print("Connecting to configured Neon PostgreSQL host...")
        engine = create_engine(db_url, connect_args={"connect_timeout": 10})
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print(f"[SUCCESS] Connected to PostgreSQL! Server version:\n  {result}")
        return True
    except Exception as e:
        print(f"[FAIL] PostgreSQL connection failed: {e}")
        return False

if __name__ == "__main__":
    print(f"Using .env located at: {os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')}")
    groq_ok = test_groq()
    db_ok = test_neon_postgres()
    print("\n===============================")
    if groq_ok and db_ok:
        print("ALL PREREQUISITES VERIFIED! Ready for Phase 1.")
        sys.exit(0)
    else:
        print("Action required: Please update backend/.env with your valid credentials.")
        sys.exit(1)
