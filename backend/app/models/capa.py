from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class CapaAction(Base):
    __tablename__ = "capa_actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    investigation_id = Column(
        Integer,
        ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    action_type = Column(String(50), nullable=False)  # 'corrective' or 'preventive'
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    owner = Column(String(255), nullable=True)
    target_date = Column(String(100), nullable=True)
    effectiveness_criteria = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="open")  # 'open', 'in_progress', 'completed'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship back to parent investigation
    investigation = relationship("Investigation", back_populates="capa_actions")

    def __repr__(self):
        return f"<CapaAction id={self.id} type={self.action_type} inv_id={self.investigation_id}>"
