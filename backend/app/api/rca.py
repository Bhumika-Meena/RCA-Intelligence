from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.investigation import Investigation
from app.models.capa import CapaAction
from app.schemas.rca import (
    AnalyzeTextRequest,
    AnalyzeResponse,
    SaveInvestigationRequest,
    UpdateInvestigationRequest,
    InvestigationSummaryResponse,
    InvestigationDetailResponse,
    CapaItem
)
from app.services.extractor import extract_text_from_upload, normalize_text
from app.services.langgraph_rca import run_rca_workflow
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rca", tags=["Root Cause Analysis"])

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_incident(raw_request: Request):
    """
    Analyze raw incident source material (text, email, or digital PDF).
    Accepts both JSON payloads and multipart/form-data file uploads.
    Executes the multi-stage LangGraph AI workflow using Groq.
    Returns structured incident facts, 5 Whys, 6M Fishbone, missing evidence, root causes, and CAPAs.
    """
    content_type = raw_request.headers.get("content-type", "")
    raw_content = ""
    inferred_source_type = "pasted_text"
    file_name = None

    if "multipart/form-data" in content_type:
        form = await raw_request.form()
        file_obj = form.get("file")
        text_field = form.get("text")
        src_type_field = form.get("source_type")
        if file_obj and hasattr(file_obj, "filename") and file_obj.filename:
            file_name = file_obj.filename
            inferred_source_type = "pdf" if file_name.lower().endswith(".pdf") else "document"
            raw_content = await extract_text_from_upload(file_obj)
        elif text_field:
            raw_content = normalize_text(str(text_field))
            inferred_source_type = str(src_type_field or "pasted_text")
    else:
        try:
            body = await raw_request.json()
            raw_content = normalize_text(body.get("text", ""))
            inferred_source_type = body.get("source_type", "pasted_text")
        except Exception:
            raw_content = ""

    if not raw_content:
        raise HTTPException(
            status_code=400,
            detail="No incident material provided. Please provide text or upload a text-based PDF."
        )

    if len(raw_content) < 20:
        raise HTTPException(
            status_code=422,
            detail="The incident report is too short for meaningful Root Cause Analysis. Please provide more process details."
        )

    try:
        analysis_payload = run_rca_workflow(raw_content, inferred_source_type)
        return AnalyzeResponse(
            analysis=analysis_payload,
            source_text=raw_content,
            source_type=inferred_source_type,
            source_file_name=file_name
        )
    except Exception as e:
        logger.error(f"Error in LangGraph workflow: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI Root Cause Analysis workflow encountered an error: {str(e)}"
        )

@router.get("", response_model=List[InvestigationSummaryResponse])
def list_investigations(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List all saved investigations ordered by most recently updated."""
    investigations = (
        db.query(Investigation)
        .order_by(Investigation.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    summaries = []
    for inv in investigations:
        summaries.append(
            InvestigationSummaryResponse(
                id=inv.id,
                deviation_number=inv.deviation_number,
                title=inv.title,
                product_name=inv.product_name,
                batch_number=inv.batch_number,
                severity=inv.severity,
                status=inv.status,
                created_at=inv.created_at,
                updated_at=inv.updated_at,
                capa_count=len(inv.capa_actions)
            )
        )
    return summaries

@router.post("", response_model=InvestigationDetailResponse, status_code=status.HTTP_201_CREATED)
def save_investigation(
    payload: SaveInvestigationRequest,
    db: Session = Depends(get_db)
):
    """
    Persist a reviewed investigation and its associated CAPA actions in Neon PostgreSQL.
    Stores the full 5 Whys, 6M Fishbone, Evidence gaps, and Root causes in PostgreSQL JSONB.
    """
    try:
        new_inv = Investigation(
            deviation_number=payload.deviation_number,
            title=payload.title,
            facility=payload.facility,
            unit_operation=payload.unit_operation,
            product_name=payload.product_name,
            batch_number=payload.batch_number,
            severity=payload.severity,
            status=payload.status,
            incident_date=payload.incident_date,
            reported_by=payload.reported_by,
            containment_actions=payload.containment_actions,
            source_type=payload.source_type,
            source_text=payload.source_text,
            source_file_name=payload.source_file_name,
            rca_analysis=payload.rca_analysis,
            reviewer_notes=payload.reviewer_notes
        )
        db.add(new_inv)
        db.flush()  # assign new_inv.id

        for c in payload.capa_actions:
            capa = CapaAction(
                investigation_id=new_inv.id,
                action_type=c.action_type,
                description=c.description,
                rationale=c.rationale,
                owner=c.owner,
                target_date=c.target_date,
                effectiveness_criteria=c.effectiveness_criteria,
                status=c.status or "open"
            )
            db.add(capa)

        db.commit()
        db.refresh(new_inv)

        return format_investigation_detail(new_inv)
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving investigation: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save investigation to database."
        )

@router.get("/{id}", response_model=InvestigationDetailResponse)
def get_investigation(
    id: int,
    db: Session = Depends(get_db)
):
    """Retrieve a single saved investigation by ID, including its full RCA JSONB and CAPA actions."""
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation with ID {id} not found.")
    return format_investigation_detail(inv)

@router.patch("/{id}", response_model=InvestigationDetailResponse)
def update_investigation(
    id: int,
    payload: UpdateInvestigationRequest,
    db: Session = Depends(get_db)
):
    """Update review status, reviewer notes, incident fields, or CAPA actions of a saved investigation."""
    inv = db.query(Investigation).filter(Investigation.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation with ID {id} not found.")

    try:
        update_data = payload.model_dump(exclude_unset=True)
        capa_actions_data = update_data.pop("capa_actions", None)

        for field, value in update_data.items():
            setattr(inv, field, value)

        if capa_actions_data is not None:
            # Replace or update CAPAs
            db.query(CapaAction).filter(CapaAction.investigation_id == id).delete()
            for c in capa_actions_data:
                capa = CapaAction(
                    investigation_id=id,
                    action_type=c["action_type"],
                    description=c["description"],
                    rationale=c.get("rationale"),
                    owner=c.get("owner"),
                    target_date=c.get("target_date"),
                    effectiveness_criteria=c.get("effectiveness_criteria"),
                    status=c.get("status", "open")
                )
                db.add(capa)

        db.commit()
        db.refresh(inv)
        return format_investigation_detail(inv)
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating investigation {id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update investigation in database.")

def format_investigation_detail(inv: Investigation) -> InvestigationDetailResponse:
    capa_list = [
        CapaItem(
            id=c.id,
            action_type=c.action_type,
            description=c.description,
            rationale=c.rationale,
            owner=c.owner,
            target_date=c.target_date,
            effectiveness_criteria=c.effectiveness_criteria,
            status=c.status
        )
        for c in inv.capa_actions
    ]
    return InvestigationDetailResponse(
        id=inv.id,
        deviation_number=inv.deviation_number,
        title=inv.title,
        facility=inv.facility,
        unit_operation=inv.unit_operation,
        product_name=inv.product_name,
        batch_number=inv.batch_number,
        severity=inv.severity,
        status=inv.status,
        incident_date=inv.incident_date,
        reported_by=inv.reported_by,
        containment_actions=inv.containment_actions,
        source_type=inv.source_type,
        source_text=inv.source_text,
        source_file_name=inv.source_file_name,
        rca_analysis=inv.rca_analysis,
        reviewer_notes=inv.reviewer_notes,
        created_at=inv.created_at,
        updated_at=inv.updated_at,
        capa_actions=capa_list
    )
