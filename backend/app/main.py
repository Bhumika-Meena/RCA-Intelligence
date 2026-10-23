from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router
from app.api.rca import router as rca_router

app = FastAPI(
    title="AIVOA RCA Intelligence API",
    description="Pharmaceutical API Manufacturing Root Cause Analysis & CAPA Intelligence Service",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(health_router, prefix="/api", tags=["System"])
app.include_router(rca_router, prefix="/api", tags=["Root Cause Analysis"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
