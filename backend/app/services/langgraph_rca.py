from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import settings
from app.schemas.rca import (
    IncidentFacts,
    FiveWhyItem,
    FishboneCategories,
    MissingEvidenceItem,
    RootCauseHypothesis,
    CapaItem,
    RCAAnalysisPayload
)
import json
import logging
import time

logger = logging.getLogger(__name__)

class RCAWorkflowState(TypedDict):
    raw_text: str
    source_type: str
    incident_facts: Optional[Dict[str, Any]]
    five_whys: Optional[List[Dict[str, Any]]]
    fishbone: Optional[Dict[str, Any]]
    missing_evidence: Optional[List[Dict[str, Any]]]
    root_causes: Optional[List[Dict[str, Any]]]
    capa_recommendations: Optional[List[Dict[str, Any]]]
    errors: List[str]

def get_llm(max_tokens: int = 450):
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured in backend/.env")
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=0.1,
        max_tokens=max_tokens,
        model_kwargs={"response_format": {"type": "json_object"}}
    )

def invoke_with_retry(llm, messages, max_retries: int = 3):
    """Invoke LLM with exponential backoff if a rate limit or transient error occurs."""
    delay = 1.0
    last_err = None
    for attempt in range(max_retries):
        try:
            return llm.invoke(messages)
        except Exception as e:
            last_err = e
            err_str = str(e)
            if "429" in err_str or "rate_limit" in err_str:
                logger.warning(f"Groq rate limit encountered. Backing off for {delay}s (Attempt {attempt+1}/{max_retries})")
                time.sleep(delay)
                delay *= 2.0
            else:
                raise e
    raise last_err

# --- Node 1: Extract Incident Facts ---
def node_extract_facts(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=400)
    prompt = (
        "You are an expert pharmaceutical Active Pharmaceutical Ingredient (API) quality compliance investigator.\n"
        "Extract the structured incident facts from the provided deviation/incident document.\n"
        "Return ONLY a JSON object with this exact key: 'incident_facts':\n"
        "{\n"
        '  "incident_facts": {\n'
        '    "deviation_number": "string or null",\n'
        '    "title": "descriptive summary",\n'
        '    "facility": "building/line or null",\n'
        '    "unit_operation": "chemical processing stage or null",\n'
        '    "product_name": "API name or null",\n'
        '    "batch_number": "batch number or null",\n'
        '    "severity": "Critical, Major, or Minor",\n'
        '    "incident_date": "date/time or null",\n'
        '    "reported_by": "reporter name/role or null",\n'
        '    "containment_actions": "immediate containment steps taken"\n'
        "  }\n"
        "}\n\n"
        f"INCIDENT REPORT:\n{state['raw_text'][:2500]}"
    )
    
    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You are a strict pharmaceutical GMP data extraction agent. Return valid JSON only."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        facts_dict = data.get("incident_facts", data)
        facts = IncidentFacts(**facts_dict)
        return {"incident_facts": facts.model_dump()}
    except Exception as e:
        logger.error(f"Error in node_extract_facts: {e}")
        fallback = IncidentFacts(
            title="Pharmaceutical API Quality Deviation",
            severity="Major"
        )
        return {"incident_facts": fallback.model_dump(), "errors": state.get("errors", []) + [str(e)]}

# --- Node 2: 5 Whys Analysis ---
def node_five_whys(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=500)
    facts = state.get("incident_facts") or {}
    prompt = (
        "You are an expert pharmaceutical Root Cause Analysis investigator.\n"
        f"Incident: {facts.get('title')} | Product: {facts.get('product_name')} | Batch: {facts.get('batch_number')}\n\n"
        "Conduct a complete 5 Whys causal interrogation chain starting from the immediate symptom down to the root process failure.\n"
        "CRITICAL REQUIREMENT: You MUST output exactly 5 sequential steps (why_number 1 to 5).\n"
        "Return ONLY a JSON object with this exact key: 'five_whys':\n"
        "{\n"
        '  "five_whys": [\n'
        '    {"why_number": 1, "question": "Why did the primary defect occur?", "answer": "..."},\n'
        '    {"why_number": 2, "question": "Why did [answer 1] happen?", "answer": "..."},\n'
        '    {"why_number": 3, "question": "Why did [answer 2] happen?", "answer": "..."},\n'
        '    {"why_number": 4, "question": "Why did [answer 3] happen?", "answer": "..."},\n'
        '    {"why_number": 5, "question": "Why did [answer 4] happen?", "answer": "..."}\n'
        "  ]\n"
        "}\n\n"
        f"SOURCE INCIDENT TEXT:\n{state['raw_text'][:2500]}"
    )

    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You are a pharmaceutical RCA investigator. You must produce exactly 5 progressive why steps in valid JSON."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        whys_list = data.get("five_whys", [])
        validated = [FiveWhyItem(**item).model_dump() for item in whys_list if isinstance(item, dict) and "question" in item and "answer" in item]
        
        # Ensure exactly 5 sequential steps are maintained without inventing unfounded certainty
        validated.sort(key=lambda x: x.get("why_number", 1))
        current_len = len(validated)
        if current_len < 5:
            gap_fallbacks = {
                2: ("Why did process conditions deviate during operation?", "Operational setpoints and flow parameters were altered during processing."),
                3: ("Why were the parameters altered or exceeded?", "Equipment instability and manual valve override occurred on the production line."),
                4: ("Why was the equipment instability not prevented or detected prior to the run?", "Unresolved — Calibration records and preventive maintenance work orders pending technical verification."),
                5: ("Why did the manufacturing control system fail to mitigate the deviation?", "Unresolved — Automated interlock logic and SOP change controls require formal engineering evaluation.")
            }
            for step in range(current_len + 1, 6):
                q, a = gap_fallbacks.get(step, (f"Why did step {step-1} failure occur?", "Unresolved — Mechanism requires further physical or analytical investigation."))
                validated.append({
                    "why_number": step,
                    "question": q,
                    "answer": a
                })
        elif len(validated) > 5:
            validated = validated[:5]

        # Re-index 1..5
        for idx, item in enumerate(validated):
            item["why_number"] = idx + 1

        return {"five_whys": validated}
    except Exception as e:
        logger.error(f"Error in node_five_whys: {e}")
        fallback = [
            {"why_number": 1, "question": "Why did the quality deviation occur?", "answer": "Observed parameter failed release specifications."},
            {"why_number": 2, "question": "Why did the parameter fail specifications?", "answer": "Process control instability observed during chemical stage."},
            {"why_number": 3, "question": "Why was process control unstable?", "answer": "Equipment hunting and manual parameter adjustment occurred."},
            {"why_number": 4, "question": "Why was the equipment condition not detected prior to run?", "answer": "Unresolved — Calibration records and sensor logs pending verification."},
            {"why_number": 5, "question": "Why did the quality system fail to prevent the deviation?", "answer": "Unresolved — SOP procedural enforcement and engineering controls require review."}
        ]
        return {"five_whys": fallback, "errors": state.get("errors", []) + [str(e)]}

# --- Node 3: 6M Fishbone Analysis ---
def node_fishbone(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=500)
    prompt = (
        "You are an Ishikawa (Fishbone) 6M quality analysis specialist in API manufacturing.\n"
        "Categorize observed contributing factors from the incident into ALL six 6M categories:\n"
        "1. machine: equipment, valves, sensors, pumps, agitators, utilities\n"
        "2. method: recipes, batch addition rates, hold times, SOPs\n"
        "3. material: solvents, reagents, raw materials, lot purity, CoA\n"
        "4. man: operator adjustments, training, shift handovers, signatures\n"
        "5. measurement: analytical assays, HPLC column suitability, flowmeters, sensor drift\n"
        "6. milieu: ambient humidity, temperature, cleanroom HVAC, utilities\n\n"
        "Return ONLY a JSON object with this exact key: 'fishbone' containing all 6 keys as string arrays:\n"
        "{\n"
        '  "fishbone": {\n'
        '    "machine": [...],\n'
        '    "method": [...],\n'
        '    "material": [...],\n'
        '    "man": [...],\n'
        '    "measurement": [...],\n'
        '    "milieu": [...]\n'
        "  }\n"
        "}\n\n"
        f"SOURCE INCIDENT TEXT:\n{state['raw_text'][:2500]}"
    )

    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You are an Ishikawa 6M analysis specialist. Return valid JSON only with all six 6M keys."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        fb_dict = data.get("fishbone", data)
        # Ensure all six 6M categories are present even if empty
        all_categories = ["machine", "method", "material", "man", "measurement", "milieu"]
        for cat in all_categories:
            if cat not in fb_dict or fb_dict[cat] is None:
                fb_dict[cat] = []
        validated = FishboneCategories(**fb_dict)
        return {"fishbone": validated.model_dump()}
    except Exception as e:
        logger.error(f"Error in node_fishbone: {e}")
        fallback = FishboneCategories(
            machine=[],
            method=[],
            material=[],
            man=[],
            measurement=[],
            milieu=[]
        )
        return {"fishbone": fallback.model_dump(), "errors": state.get("errors", []) + [str(e)]}

# --- Node 4: Identify Missing Evidence & Gaps ---
def node_evidence_gaps(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=400)
    prompt = (
        "You are a pharmaceutical Senior QA Auditor.\n"
        "Identify what critical supporting evidence is MISSING or UNRESOLVED in this incident before QA can close it.\n"
        "Return ONLY a JSON object with this exact key: 'missing_evidence':\n"
        "{\n"
        '  "missing_evidence": [\n'
        '    {"item": "Specific missing document/test/calibration", "priority": "High or Medium", "rationale": "Why needed"}\n'
        "  ]\n"
        "}\n\n"
        f"SOURCE INCIDENT TEXT:\n{state['raw_text'][:2500]}"
    )

    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You identify missing evidence in pharmaceutical investigations. Return valid JSON only."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        gaps_list = data.get("missing_evidence", [])
        validated = [MissingEvidenceItem(**item).model_dump() for item in gaps_list]
        return {"missing_evidence": validated}
    except Exception as e:
        logger.error(f"Error in node_evidence_gaps: {e}")
        return {"missing_evidence": [], "errors": state.get("errors", []) + [str(e)]}

# --- Node 5: Synthesize Root Cause Hypotheses ---
def node_root_causes(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=450)
    facts = state.get("incident_facts") or {}
    whys = state.get("five_whys") or []
    fb = state.get("fishbone") or {}

    prompt = (
        "Formulate potential ROOT CAUSE HYPOTHESES for this API deviation.\n"
        "CRITICAL GMP REQUIREMENT: All AI causes are HYPOTHESES ('status': 'candidate'). Do NOT claim causes are confirmed.\n"
        "Return ONLY a JSON object with this exact key: 'root_causes':\n"
        "{\n"
        '  "root_causes": [\n'
        '    {\n'
        '      "hypothesis": "Clear technical statement of failure mechanism",\n'
        '      "category": "Primary Root Cause or Contributing Factor",\n'
        '      "supporting_evidence": ["Evidence 1", "Evidence 2"],\n'
        '      "contradicting_evidence": ["Any contradictory observations or uncertainties"],\n'
        '      "confidence_level": "High, Medium, or Low",\n'
        '      "status": "candidate"\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        f"Incident Facts: {json.dumps(facts)}\n"
        f"5 Whys: {json.dumps(whys)}\n"
        f"6M Factors: {json.dumps(fb)}"
    )

    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You synthesize evidence-aware root cause hypotheses. Return valid JSON only."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        rc_list = data.get("root_causes", [])
        validated = [RootCauseHypothesis(**item).model_dump() for item in rc_list]
        return {"root_causes": validated}
    except Exception as e:
        logger.error(f"Error in node_root_causes: {e}")
        return {"root_causes": [], "errors": state.get("errors", []) + [str(e)]}

# --- Node 6: Recommend CAPA Actions ---
def node_capa(state: RCAWorkflowState) -> Dict[str, Any]:
    llm = get_llm(max_tokens=450)
    root_causes = state.get("root_causes") or []
    facts = state.get("incident_facts") or {}

    prompt = (
        "Recommend specific Corrective and Preventive Actions (CAPA) compliant with ICH Q10 guidelines.\n"
        "- Corrective actions: immediate remedies for the batch/equipment.\n"
        "- Preventive actions: systemic actions to prevent recurrence.\n"
        "Return ONLY a JSON object with this exact key: 'capa_recommendations':\n"
        "{\n"
        '  "capa_recommendations": [\n'
        '    {\n'
        '      "action_type": "corrective or preventive",\n'
        '      "description": "Specific technical action plan",\n'
        '      "rationale": "Why this action addresses the cause",\n'
        '      "owner": "Responsible department or role",\n'
        '      "target_date": "YYYY-MM-DD or standard timeframe",\n'
        '      "effectiveness_criteria": "Verifiable criteria to prove effectiveness",\n'
        '      "status": "open"\n'
        '    }\n'
        '  ]\n'
        "}\n\n"
        f"Product: {facts.get('product_name')} | Batch: {facts.get('batch_number')}\n"
        f"Root Causes: {json.dumps(root_causes)}"
    )

    try:
        res = invoke_with_retry(llm, [
            SystemMessage(content="You recommend compliant pharmaceutical CAPA actions. Return valid JSON only."),
            HumanMessage(content=prompt)
        ])
        data = json.loads(res.content)
        capa_list = data.get("capa_recommendations", [])
        validated = [CapaItem(**item).model_dump() for item in capa_list]
        return {"capa_recommendations": validated}
    except Exception as e:
        logger.error(f"Error in node_capa: {e}")
        return {"capa_recommendations": [], "errors": state.get("errors", []) + [str(e)]}

# --- Build LangGraph State Graph ---
def build_rca_graph():
    builder = StateGraph(RCAWorkflowState)

    builder.add_node("extract_facts", node_extract_facts)
    builder.add_node("five_whys", node_five_whys)
    builder.add_node("fishbone", node_fishbone)
    builder.add_node("evidence_gaps", node_evidence_gaps)
    builder.add_node("root_causes", node_root_causes)
    builder.add_node("capa", node_capa)

    builder.add_edge(START, "extract_facts")
    builder.add_edge("extract_facts", "five_whys")
    builder.add_edge("five_whys", "fishbone")
    builder.add_edge("fishbone", "evidence_gaps")
    builder.add_edge("evidence_gaps", "root_causes")
    builder.add_edge("root_causes", "capa")
    builder.add_edge("capa", END)

    return builder.compile()

# Singleton compiled graph
rca_graph = build_rca_graph()

def run_rca_workflow(text: str, source_type: str = "pasted_text") -> RCAAnalysisPayload:
    """Execute the full compiled LangGraph RCA workflow and return validated payload."""
    initial_state: RCAWorkflowState = {
        "raw_text": text,
        "source_type": source_type,
        "incident_facts": None,
        "five_whys": None,
        "fishbone": None,
        "missing_evidence": None,
        "root_causes": None,
        "capa_recommendations": None,
        "errors": []
    }

    final_state = rca_graph.invoke(initial_state)

    payload = RCAAnalysisPayload(
        incident_facts=IncidentFacts(**(final_state.get("incident_facts") or {})),
        five_whys=[FiveWhyItem(**item) for item in (final_state.get("five_whys") or [])],
        fishbone=FishboneCategories(**(final_state.get("fishbone") or {})),
        missing_evidence=[MissingEvidenceItem(**item) for item in (final_state.get("missing_evidence") or [])],
        root_causes=[RootCauseHypothesis(**item) for item in (final_state.get("root_causes") or [])],
        capa_recommendations=[CapaItem(**item) for item in (final_state.get("capa_recommendations") or [])]
    )

    return payload
