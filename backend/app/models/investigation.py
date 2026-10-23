from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    deviation_number = Column(String(100), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    facility = Column(String(255), nullable=True)
    unit_operation = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=True, index=True)
    batch_number = Column(String(100), nullable=True, index=True)
    severity = Column(String(50), nullable=False, default="Major")
    status = Column(String(50), nullable=False, default="draft", index=True)
    incident_date = Column(String(100), nullable=True)
    reported_by = Column(String(255), nullable=True)
    containment_actions = Column(Text, nullable=True)
    
    # Source metadata
    source_type = Column(String(50), nullable=False, default="pasted_text")
    source_text = Column(Text, nullable=True)
    source_file_name = Column(String(255), nullable=True)
    
    # Structured RCA Analysis stored as PostgreSQL JSONB
    # Contains: 5 Whys, 6M Fishbone, Evidence gaps, Root causes
    rca_analysis = Column(JSONB, nullable=True)
    
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    capa_actions = relationship(
        "CapaAction",
        back_populates="investigation",
        cascade="all, delete-orphan",
        order_by="CapaAction.id"
    )

    def __repr__(self):
        return f"<Investigation id={self.id} deviation={self.deviation_number} batch={self.batch_number}>"
