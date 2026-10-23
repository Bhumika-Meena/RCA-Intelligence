from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class IncidentFacts(BaseModel):
    deviation_number: Optional[str] = Field(default=None, description="Official deviation identifier e.g. DEV-2026-0842")
    title: str = Field(default="", description="Descriptive summary of the incident")
    facility: Optional[str] = Field(default=None, description="Manufacturing building or suite e.g. API Block B, Line 3")
    unit_operation: Optional[str] = Field(default=None, description="Specific chemical or processing unit operation e.g. Crystallization")
    product_name: Optional[str] = Field(default=None, description="Full active pharmaceutical ingredient name")
    batch_number: Optional[str] = Field(default=None, description="Production batch or lot number e.g. ATC-2026-B089")
    severity: str = Field(default="Major", description="Critical, Major, or Minor based on GMP API quality impact")
    incident_date: Optional[str] = Field(default=None, description="Date/time of deviation occurrence")
    reported_by: Optional[str] = Field(default=None, description="Name or role of reporting person")
    containment_actions: Optional[str] = Field(default=None, description="Immediate physical and electronic containment actions taken")

class FiveWhyItem(BaseModel):
    why_number: int = Field(ge=1, le=10, description="Step in the 5-Whys interrogation chain")
    question: str = Field(description="Interrogative question addressing preceding answer")
    answer: str = Field(description="Causal finding or observed phenomenon")

class FishboneCategories(BaseModel):
    machine: List[str] = Field(default_factory=list, description="Equipment, sensors, instrumentation, valves, utilities")
    method: List[str] = Field(default_factory=list, description="SOPs, recipe setpoints, parameters, addition rates")
    material: List[str] = Field(default_factory=list, description="Raw materials, solvents, reagents, intermediates, lot variations")
    man: List[str] = Field(default_factory=list, description="Personnel actions, training, shift changes, handoffs")
    measurement: List[str] = Field(default_factory=list, description="Analytical calibration, HPLC assay, sensor drift, testing methods")
    milieu: List[str] = Field(default_factory=list, description="Environmental conditions: ambient temp, humidity, pressure, HVAC")

class MissingEvidenceItem(BaseModel):
    item: str = Field(description="Specific missing record, analytical test, or maintenance data")
    priority: str = Field(default="Medium", description="High, Medium, or Low urgency for QA investigation closure")
    rationale: str = Field(default="", description="Why this evidence is vital to confirm or rule out a root cause")

class RootCauseHypothesis(BaseModel):
    hypothesis: str = Field(description="Proposed causal failure mechanism")
    category: str = Field(default="Primary Root Cause", description="Primary Root Cause, Contributing Factor, or Secondary Factor")
    supporting_evidence: List[str] = Field(default_factory=list, description="Corroborating observations from batch records or logs")
    contradicting_evidence: List[str] = Field(default_factory=list, description="Evidence inconsistent with or ruling out this cause")
    confidence_level: str = Field(default="Medium", description="High, Medium, or Low based strictly on objective evidence")
    status: str = Field(default="candidate", description="candidate, unconfirmed, or confirmed by human reviewer")

class CapaItem(BaseModel):
    id: Optional[int] = None
    action_type: str = Field(description="'corrective' (remedy current defect) or 'preventive' (prevent systemic recurrence)")
    description: str = Field(description="Action description with specific technical scope")
    rationale: Optional[str] = Field(default=None, description="Scientific or procedural rationale for this action")
    owner: Optional[str] = Field(default=None, description="Assigned department or specialist owner")
    target_date: Optional[str] = Field(default=None, description="Target completion date (YYYY-MM-DD)")
    effectiveness_criteria: Optional[str] = Field(default=None, description="Measurable verification criteria to prove effectiveness")
    status: Optional[str] = Field(default="open", description="open, in_progress, completed")

class RCAAnalysisPayload(BaseModel):
    incident_facts: IncidentFacts
    five_whys: List[FiveWhyItem]
    fishbone: FishboneCategories
    missing_evidence: List[MissingEvidenceItem]
    root_causes: List[RootCauseHypothesis]
    capa_recommendations: List[CapaItem]

class AnalyzeTextRequest(BaseModel):
    text: str = Field(min_length=10, description="Raw deviation report, email text, or incident summary")
    source_type: str = Field(default="pasted_text", description="'pasted_text' or 'email'")

class AnalyzeResponse(BaseModel):
    analysis: RCAAnalysisPayload
    source_text: str
    source_type: str
    source_file_name: Optional[str] = None

class SaveInvestigationRequest(BaseModel):
    deviation_number: Optional[str] = None
    title: str
    facility: Optional[str] = None
    unit_operation: Optional[str] = None
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    severity: str = "Major"
    status: str = "draft"
    incident_date: Optional[str] = None
    reported_by: Optional[str] = None
    containment_actions: Optional[str] = None
    source_type: str = "pasted_text"
    source_text: Optional[str] = None
    source_file_name: Optional[str] = None
    rca_analysis: Dict[str, Any]
    reviewer_notes: Optional[str] = None
    capa_actions: List[CapaItem] = Field(default_factory=list)

class UpdateInvestigationRequest(BaseModel):
    deviation_number: Optional[str] = None
    title: Optional[str] = None
    facility: Optional[str] = None
    unit_operation: Optional[str] = None
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    incident_date: Optional[str] = None
    reported_by: Optional[str] = None
    containment_actions: Optional[str] = None
    rca_analysis: Optional[Dict[str, Any]] = None
    reviewer_notes: Optional[str] = None
    capa_actions: Optional[List[CapaItem]] = None

class InvestigationSummaryResponse(BaseModel):
    id: int
    deviation_number: Optional[str]
    title: str
    product_name: Optional[str]
    batch_number: Optional[str]
    severity: str
    status: str
    created_at: datetime
    updated_at: datetime
    capa_count: int

    class Config:
        from_attributes = True

class InvestigationDetailResponse(BaseModel):
    id: int
    deviation_number: Optional[str]
    title: str
    facility: Optional[str]
    unit_operation: Optional[str]
    product_name: Optional[str]
    batch_number: Optional[str]
    severity: str
    status: str
    incident_date: Optional[str]
    reported_by: Optional[str]
    containment_actions: Optional[str]
    source_type: str
    source_text: Optional[str]
    source_file_name: Optional[str]
    rca_analysis: Optional[Dict[str, Any]]
    reviewer_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    capa_actions: List[CapaItem] = Field(default_factory=list)

    class Config:
        from_attributes = True
