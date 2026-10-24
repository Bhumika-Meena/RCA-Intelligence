# AIVOA RCA Intelligence — Technical Code Walkthrough Outline
**Duration**: 5–10 Minutes  
**Audience**: Technical Evaluators, Senior Software Architects, AI Engineers  
**Objective**: Deep-dive explanation of system architecture, stateful LangGraph orchestration, Pydantic schemas, Neon PostgreSQL persistence, and Redux Toolkit state management.

---

## Technical Walkthrough Table of Contents

| Segment | Target Code / Files | Key Concepts & Discussion Points |
| :--- | :--- | :--- |
| **1. Architecture Overview (1:00)** | Root architecture diagram, `backend/` and `frontend/` folders | • Clean separation: Decoupled FastAPI backend and React 19 frontend.<br>• Minimalist, high-performance footprint: zero local weights, Groq Cloud API for sub-second inference, Neon serverless PostgreSQL for relational storage. |
| **2. LangGraph State Machine (2:30)** | `backend/app/services/langgraph_rca.py` | • Stateful graph definition (`RCAWorkflowState`).<br>• Node 1 (`extract_facts`): Regex + JSON mode extraction.<br>• Node 2 (`five_whys`): Causal chain enforcement (5 steps), gap fallbacks.<br>• Node 3 (`fishbone`): Ishikawa 6M categorization guarantee.<br>• Node 4 (`evidence_gaps`): Missing data audit.<br>• Node 5 (`root_causes`): Evidence-anchored hypothesis formulation.<br>• Node 6 (`capa_recommendations`): ICH Q10 corrective & preventive remediations.<br>• Resiliency: `invoke_with_retry` exponential backoff handling transient Groq 429 rate limits. |
| **3. Pydantic Schemas & Data Contracts (1:30)** | `backend/app/schemas/rca.py` | • Type safety across boundaries: `AnalyzeResponse`, `IncidentFacts`, `FiveWhyItem`, `FishboneCategories`, `CapaItem`.<br>• Strict Pydantic validation preventing silent prompt drifts. |
| **4. Database Models & Alembic Migrations (1:30)** | `backend/app/models/` (`investigation.py`, `capa.py`) | • Hybrid relational + document architecture: PostgreSQL JSONB for flexible tree/nested RCA data, relational table with `ForeignKey(ondelete="CASCADE")` for CAPA items.<br>• Alembic migration workflow (`alembic/versions/d76a38512481_create_investigations_and_capa_.py`). |
| **5. FastAPI Endpoints & Dual Intake (1:00)** | `backend/app/api/rca.py`, `backend/app/services/extractor.py` | • Dual intake: Inspects `raw_request.headers` to gracefully handle both JSON payloads and multipart PDF uploads without FastAPI endpoint conflicts.<br>• PyMuPDF text stream extraction with 422 error handling for scanned raster documents. |
| **6. Frontend State & React Components (1:30)** | `frontend/src/store/rcaSlice.ts`, `frontend/src/components/` | • Redux Toolkit single source of truth.<br>• Granular actions: `setField`, `acceptAiSuggestion`, `updateFiveWhy`, `removeFishboneFactor`, `updateCapaAction`.<br>• TypeScript 6 strict typing (`verbatimModuleSyntax: true`). |
| **7. Testing Suite & Reliability (1:00)** | `backend/tests/` (12 tests) | • Pytest suite covering database roundtrip, health checks, CRUD lifecycle, empty inputs, scanned PDFs, 404s, and validation errors.<br>• `verify_vertical_slice.py` end-to-end integration test against live Groq and Neon. |

---

## Detailed Code Walkthrough Script

### 1. High-Level Architecture
Open `README.md` and display the Mermaid architecture diagram:
> *"AIVOA RCA Intelligence is architected around a modern full-stack decoupling. The frontend is built on React 19, TypeScript, Vite, and Redux Toolkit. The backend is powered by FastAPI, SQLAlchemy 2.0, and Pydantic v2. For causal AI reasoning, instead of simple monolithic prompt chaining, we implemented a multi-stage directed graph using LangGraph orchestrated on Groq's hosted LPU inference engine. Persistent storage is provided by Neon hosted PostgreSQL with automated Alembic migrations."*

---

### 2. Deep Dive: LangGraph Causal Workflow (`langgraph_rca.py`)
Open [`backend/app/services/langgraph_rca.py`](file:///c:/My%20workspace/AIVOA%20Assignment/backend/app/services/langgraph_rca.py):
> *"Let's look at the heart of our AI reasoning pipeline: `langgraph_rca.py`.  
>  
> We define a typed `RCAWorkflowState` class using Python's `TypedDict`. This state accumulates intermediate artifacts as execution traverses the graph.  
>  
> Notice how we build the state machine using `StateGraph`:
> ```python
> workflow = StateGraph(RCAWorkflowState)
> workflow.add_node("extract_facts", node_extract_facts)
> workflow.add_node("five_whys", node_five_whys)
> workflow.add_node("fishbone", node_fishbone)
> workflow.add_node("evidence_gaps", node_evidence_gaps)
> workflow.add_node("root_causes", node_root_causes)
> workflow.add_node("capa", node_capa)
> ```
>  
> Why did we break this down into 6 discrete nodes rather than one massive prompt?
> 1. **Cognitive Specialization**: Each node focuses on a specific analytical task (e.g., distinguishing immediate operational symptoms from systemic SOP lapses).
> 2. **Token Efficiency**: Splitting tasks allows us to keep `max_tokens` around 450-500 per call, fitting comfortably within Groq's token-per-minute limits.
> 3. **Deterministic Structure**: In `node_five_whys`, we strictly enforce five sequential levels. If physical incident evidence only accounts for three levels, the code programmatically injects structured 'Unresolved' investigation tags for levels 4 and 5 rather than allowing the model to hallucinate false root causes.
> 4. **Resiliency**: We wrapped all invocations in `invoke_with_retry` with exponential backoff and jitter to seamlessly recover from transient network or rate-limit delays."*

---

### 3. Data Contracts & Pydantic Validation (`schemas/rca.py`)
Open [`backend/app/schemas/rca.py`](file:///c:/My%20workspace/AIVOA%20Assignment/backend/app/schemas/rca.py):
> *"All inter-service communication is strictly validated through Pydantic v2 schemas.  
>  
> Notice `FiveWhyItem`, `FishboneCategories`, `MissingEvidenceItem`, and `CapaItem`. Each model defines explicit fields and defaults. By requiring Pydantic validation on every LLM output, any schema mismatch is caught immediately at runtime, preventing malformed JSON from propagating to the frontend."*

---

### 4. Database Models & PostgreSQL JSONB (`models/investigation.py`, `models/capa.py`)
Open [`backend/app/models/investigation.py`](file:///c:/My%20workspace/AIVOA%20Assignment/backend/app/models/investigation.py):
> *"For data persistence, we selected a hybrid relational-document architecture in SQLAlchemy:
> - **Relational Investigation Metadata**: Core operational columns (`deviation_number`, `batch_number`, `product_name`, `severity`, `status`, `incident_date`) are indexed relational columns for fast querying and filtering.
> - **PostgreSQL JSONB for RCA Analysis**: The complete 5 Whys tree, 6M Fishbone, Evidence gaps, and Root Cause hypotheses are persisted in a native PostgreSQL `JSONB` column (`rca_analysis`). This preserves hierarchical graph relationships without complex junction tables.
> - **Relational CAPA Actions**: Because CAPA actions require independent tracking, status updating, and ownership attribution under ICH Q10, they are stored in a dedicated `capa_actions` table linked via foreign key with `ondelete='CASCADE'`."*

---

### 5. API Design & Dual Intake (`api/rca.py`)
Open [`backend/app/api/rca.py`](file:///c:/My%20workspace/AIVOA%20Assignment/backend/app/api/rca.py):
> *"Our primary endpoint `POST /api/rca/analyze` supports both raw JSON text payloads and multipart file uploads (such as digital PDF batch records). By inspecting `raw_request.headers['content-type']`, we route multipart streams directly to `extract_text_from_upload` in `extractor.py`.  
>  
> In `extractor.py`, we use PyMuPDF to extract text streams across all pages. If an uploaded document is a scanned raster PDF with zero extractable text, we immediately return a clear `422 Unprocessable Entity` error rather than producing silent failures or inaccurate OCR guesses."*

---

### 6. Frontend Architecture & Redux Store (`rcaSlice.ts`)
Open [`frontend/src/store/rcaSlice.ts`](file:///c:/My%20workspace/AIVOA%20Assignment/frontend/src/store/rcaSlice.ts):
> *"On the frontend, Redux Toolkit serves as the single source of truth.  
>  
> The `rcaSlice` manages form fields, AI extraction results, and human review states. We implemented async thunks for:
> - `runAnalyzeIncident`: dispatches API analysis.
> - `saveCurrentInvestigation`: routes to `POST /api/rca` (create) or `PATCH /api/rca/{id}` (update).
> - `loadInvestigationById`: loads a selected investigation from Neon and populates all form sections.
>  
> User interactions like adding a Why level (`addFiveWhy`), removing a fishbone factor (`removeFishboneFactor`), or updating CAPA parameters are purely functional Redux actions, ensuring instant UI responsiveness."*

---

### 7. Testing & Quality Engineering
Open [`backend/tests/`](file:///c:/My%20workspace/AIVOA%20Assignment/backend/tests/):
> *"Quality and test coverage were treated as first-class citizens throughout development:
> 1. `test_database_integration.py`: Validates multi-record relational persistence and cascading deletes against live Neon PostgreSQL.
> 2. `test_health.py`: Validates database-aware health checks.
> 3. `test_rca_api.py`: Validates full CRUD lifecycles.
> 4. `test_reliability_and_errors.py`: 7 automated edge-case tests verifying graceful rejection of empty text, short text (<20 characters), scanned PDFs, 404s, and invalid payloads.
>  
> Across all 12 automated backend tests, we have 100% pass rate, complemented by an end-to-end smoke test script and a sub-second TypeScript production build."*
