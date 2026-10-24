# AIVOA RCA Intelligence — Product Demonstration Script
**Duration**: 5–8 Minutes  
**Audience**: Quality Assurance Leaders, Pharmaceutical Operations, Product Assessors  
**Scenario**: Out-of-Specification (OOS) Impurity D during Atorvastatin Calcium Trihydrate API Crystallization (Batch ATC-2026-B089, Deviation DEV-2026-0842)

---

## Video Outline & Timecodes

| Timecode | Segment | Core Action on Screen | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 – 1:00** | Introduction & Problem Context | Browser showing application header and clean interface at `http://localhost:5173` | • Welcome & introduction.<br>• Problem: When an OOS deviation occurs in API manufacturing, investigators spend days sifting through BMRs, SCADA logs, and QC assays.<br>• Introduce AIVOA RCA Intelligence: An AI copilot built on ICH Q7/Q9/Q10 principles to accelerate root cause investigations with scientific rigor. |
| **1:00 – 2:00** | Incident Ingestion & AI Copilot | Click **"Load Demo Incident"** in left panel; scroll through text | • Explain the synthetic scenario: Atorvastatin Calcium API batch failed HPLC release due to Impurity D (0.38% vs spec NMT 0.15%).<br>• QC lab error ruled out; manufacturing operations flagged temperature fluctuations (42°C–58°C) and flowmeter bypass.<br>• Note the clear synthetic evaluation disclaimer badge.<br>• Click **"Extract & Analyze Root Cause"**.<br>• Observe live LangGraph stage progression (Facts → 5-Whys → Fishbone → Evidence Gaps → Hypotheses → CAPA). |
| **2:00 – 3:30** | 5 Whys & 6M Fishbone Analysis | Review the right investigation pane after clicking **"Sync All AI Suggestions to Form"** | • **Incident Metadata**: Auto-populated deviation number, batch, product, severity, unit operation.<br>• **5 Whys Tree**: Highlight the 5 sequential steps. Show how steps 4 and 5 indicate unresolved calibration/system questions if physical evidence ends, rather than hallucinating certainty.<br>• **6M Fishbone**: Point out all 6 dimensions (Machine, Method, Material, Man, Measurement, Milieu). Explain that empty categories show *"No contributing factors observed in available evidence"*. |
| **3:30 – 4:45** | Evidence Gaps, Hypotheses & CAPA | Scroll to Sections 4, 5, and 6 | • **Evidence Gaps**: Interactive checklist auditing uncalibrated sensors (TE-302) and flowmeter error E-14. Toggle a gap checkbox.<br>• **Root Cause Hypotheses**: Highlight candidate status. Show supporting vs contradicting evidence side by side. Toggle QA Status from *Candidate* to *Confirmed by Qualified Person*.<br>• **CAPAs**: Point out distinct Corrective (lockout/inspection) and Preventive (VFD interlocks, SOP updates) actions with ICH Q10 measurable effectiveness criteria. |
| **4:45 – 6:00** | Human-in-the-Loop & Database Persistence | Edit a field, enter Qualified Person notes, and save | • Emphasize: AI advises, humans decide.<br>• Edit a CAPA target date or description live.<br>• Scroll to **Section 7: Qualified Person Review**.<br>• Point out the regulatory disclaimer regarding unauthenticated evaluation sandbox.<br>• Select status: *"Approved & QA Closed"*, add reviewer notes: *"Reviewed SCADA traces; thermal epimerization confirmed. Engineering CAPA approved."*<br>• Click **"Save Investigation to Database"**.<br>• Observe confirmation toast with assigned Neon PostgreSQL ID. |
| **6:00 – 7:15** | Reopening Saved Investigation & Proof of Roundtrip | Click **"Saved Investigations"** button in navbar | • Open the Saved Investigations drawer.<br>• Click to reopen the saved record.<br>• Demonstrate that all edited fields, 5 Whys steps, 6M cards, and CAPAs are faithfully restored from PostgreSQL JSONB and relational tables.<br>• Make a quick edit and click **"Update Investigation"** to show PATCH capability. |
| **7:15 – 8:00** | Conclusion & Engineering Highlights | Return to main dashboard | • Recap technical stack: React 19, FastAPI, LangGraph, Groq hosted inference, Neon PostgreSQL.<br>• Emphasize scientific integrity: zero hallucinated certainty, traceable evidence, clear evaluation disclaimers.<br>• Thank the viewers and invite questions. |

---

## Speaker Script / Verbatim Voiceover Guide

### 1. Introduction (0:00 - 1:00)
> *"Hello everyone, and welcome to this demonstration of AIVOA RCA Intelligence. In commercial Active Pharmaceutical Ingredient manufacturing, when an Out-of-Specification quality deviation occurs, every hour of investigation downtime represents significant risk to patient supply and substantial financial cost. Traditional investigations require quality teams to manually cross-reference batch manufacturing records, SCADA historian logs, and analytical chromatography.*  
>  
> *AIVOA RCA Intelligence is an AI-powered Root Cause Analysis module specifically engineered to streamline this workflow in alignment with ICH Q7 Good Manufacturing Practice and ICH Q10 Pharmaceutical Quality Systems. Let’s dive straight in."*

### 2. Incident Ingestion & AI Copilot (1:00 - 2:00)
> *"On the left panel, we have our AI Quality Copilot. The system accepts unstructured manufacturing data—such as pasted deviation notices, operator shift handover logs, or digital PDF batch files.  
>  
> For this demonstration, we’ll click 'Load Demo Incident'. This loads a synthetic, realistic pharmaceutical scenario: Atorvastatin Calcium Trihydrate API Batch ATC-2026-B089, which failed QC release testing with an Out-of-Specification Impurity D level of 0.38% against a specification limit of Not More Than 0.15%. Phase 1 QC laboratory investigation already confirmed system suitability, redirecting the inquiry to manufacturing operations. Notice our amber banner clearly identifying this as a demonstration scenario.  
>  
> Now, I’ll click 'Extract & Analyze Root Cause'. In the background, FastAPI triggers our stateful LangGraph causal workflow. Running on Groq's high-speed inference engine, LangGraph executes six sequential analytical nodes: fact extraction, 5 Whys interrogation, 6M Ishikawa categorization, evidence gap auditing, root cause hypothesis generation, and ICH Q10 CAPA synthesis."*

### 3. Causal Analysis: 5 Whys & 6M Fishbone (2:00 - 3:30)
> *"Our AI analysis is complete in just a few seconds. Clicking 'Sync All AI Suggestions to Form' populates the structured investigation form on the right.  
>  
> In Section 1, core batch metadata is organized into editable fields.  
>  
> In Section 2, observe the 5 Whys Interrogation Tree. Rather than stopping prematurely or fabricating certainty, our pipeline strictly enforces five logical steps. Steps 1 through 3 trace the issue from the OOS result, through temperature spikes, to pneumatic control valve hunting on crystallization reactor CR-302. Notice steps 4 and 5: because the initial incident report lacks sensor calibration logs, the system explicitly marks them as 'Unresolved — Calibration records pending verification'. This preserves scientific integrity by highlighting where physical investigation must continue.  
>  
> Moving to Section 3, we have the Ishikawa Fishbone mapping across all six 6M dimensions. Machine and Method factors are clearly isolated, while dimensions without observed abnormalities explicitly show 'No contributing factors observed in available evidence'."*

### 4. Evidence Gaps, Root Causes & CAPAs (3:30 - 4:45)
> *"Section 4 audits evidence gaps—such as the pending re-certification of temperature transmitter TE-302 and flowmeter error E-14. Investigators can check these off as physical records are inspected.  
>  
> In Section 5, root cause hypotheses are presented. Crucially, AI outputs are never marked as confirmed by default. The system distinguishes candidate hypotheses from confirmed facts, presenting supporting observations and contradictions side by side. As a Qualified Person, I can formally change this status to 'Confirmed by Qualified Person'.  
>  
> In Section 6, the system generates actionable Corrective and Preventive Actions. Corrective actions address immediate equipment lockout and batch quarantine, while Preventive actions introduce automated SCADA interlocks and recipe updates. Notice each CAPA includes an assigned owner, target deadline, and measurable ICH Q10 effectiveness criteria."*

### 5. Review, Persistence & Reopening (4:45 - 7:15)
> *"Finally, in Section 7, we simulate the Qualified Person sign-off. Notice our explicit disclaimer clarifying that in commercial GMP environments, 21 CFR Part 11 compliant electronic signatures and authenticated RBAC are required.  
>  
> I’ll set the investigation status to 'Approved & QA Closed' and add reviewer notes. When I click 'Save Investigation to Database', the entire dataset—including the rich JSONB causal analysis and relational CAPA items—is committed to our hosted Neon PostgreSQL database.  
>  
> To verify roundtrip persistence, I’ll open the 'Saved Investigations' drawer. Here is our record. Clicking it reloads the complete state from the remote database with zero data loss. Any subsequent edits can be saved back using our PATCH API."*

### 6. Closing (7:15 - 8:00)
> *"AIVOA RCA Intelligence combines real AI causal reasoning with human-in-the-loop validation, strict pharmaceutical domain methodologies, and enterprise database persistence. Thank you for your time."*
