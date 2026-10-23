import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  runAnalyzeIncident,
  acceptAllAiSuggestions
} from '../store/rcaSlice';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Check,
  RefreshCw,
  FlaskConical,
  Cpu
} from 'lucide-react';

const SAMPLE_INCIDENT_TEXT = `DEVIATION / QUALITY INCIDENT REPORT
Report No: DEV-2026-0842
Facility: API Manufacturing Block B, Line 3
Unit Operation: Final Crystallization & Isolation
Product: Atorvastatin Calcium Trihydrate API
Batch Number: ATC-2026-B089
Lot Size: 450.0 kg
Date of Incident: October 22, 2026, 04:15 IST
Reported By: Rajesh Sharma (Production Lead, Shift B)
QA Reviewer: Dr. Ananya Iyer (Senior QA Specialist)
Severity Classification: Critical (Direct API Quality Impact)

1. INCIDENT DESCRIPTION:
During release testing of Atorvastatin Calcium Trihydrate API (Batch ATC-2026-B089), Quality Control reported an Out-of-Specification (OOS) result for Related Substance Impurity D (diastereomer).
- Specification Limit: Not More Than (NMT) 0.15% w/w (as per Pharmacopeial Release Specification Spec-ATC-004 Rev 5).
- QC HPLC Assay Result: 0.38% w/w (Sample 1), 0.37% w/w (Sample 2 re-injection).
The batch failed release criteria. QC Phase 1 laboratory investigation confirmed no laboratory analytical error: HPLC system suitability criteria passed, column performance (USP tailing < 1.5, theoretical plates > 5000) was verified, standard preparation showed 99.8% recovery, and no chromatographic integration artifacts were observed. The deviation was re-directed to manufacturing operations for manufacturing root cause investigation.

2. IMMEDIATE CONTAINMENT ACTIONS TAKEN:
- Batch ATC-2026-B089 immediately placed under physical and electronic QA quarantine (Quarantine Tag #QT-2026-441).
- Crystallization Reactor CR-302 locked out pending engineering inspection.
- Downstream micronization and primary packaging of this batch halted.
- Preceding Batch ATC-2026-B088 and subsequent Batch ATC-2026-B090 placed on precautionary QA hold.

3. PROCESS DATA & PRELIMINARY OBSERVATIONS:
- Reaction Stage: Ethyl ester hydrolysis and subsequent calcium salt precipitation in Crystallization Vessel CR-302.
- Solvent mixture: Methanol/Water/Tetrahydrofuran (Lot #TH-8821).
- Temperature Sensor TE-302 showed nominal 45°C throughout dissolution, but SCADA historical trends reveal temperature fluctuations between 42°C and 58°C during anti-solvent addition (01:30 - 02:45 IST).
- Heating jacket control valve (TCV-302) exhibited pneumatic hunting (stick-slip behavior) according to utility logs.
- Agitator speed was set at 65 RPM (Standard Recipe calls for 70 ± 2 RPM). Operator noted visual vortex instability due to variable motor frequency drive (VFD) hunting.
- Addition rate of anti-solvent (purified water) was recorded manually at 3.5 L/min instead of recipe setpoint of 2.0 ± 0.2 L/min due to bypass flowmeter usage when primary mass flow meter FM-302 displayed an intermittent error code E-14.
- Raw material CoA for Methanol Lot #ME-2026-11 showed moisture content of 0.08% (within NMT 0.10% specification).
- Batch manufacturing record (BMR) entry for anti-solvent addition step was signed retroactively by the night shift operator at the end of the shift.

4. INVESTIGATION SCOPE & UNRESOLVED QUESTIONS:
- Temperature transmitter calibration certificate for TE-302 is due for re-certification next week (last calibrated 11 months ago).
- Root cause of flow meter FM-302 error E-14 has not yet been investigated by the instrumentation maintenance team.
- Need to determine whether the elevated localized temperature (up to 58°C) combined with rapid anti-solvent addition catalyzed the epimerization/degradation pathway producing Impurity D.
- Raw chromatograms from preceding 3 batches need comparative overlay to evaluate if Impurity D was creeping upward in prior runs.`;

export const CopilotPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { analysisStatus, analysisError, aiExtracted, source_text } = useSelector(
    (state: RootState) => state.rca
  );

  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  const [inputText, setInputText] = useState(source_text || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleLoadSample = () => {
    setInputMode('text');
    setInputText(SAMPLE_INCIDENT_TEXT);
  };

  const handleRunAnalysis = () => {
    if (inputMode === 'pdf') {
      if (!selectedFile) {
        alert('Please choose a text-based PDF file to upload.');
        return;
      }
      dispatch(runAnalyzeIncident({ file: selectedFile, sourceType: 'pdf' }));
    } else {
      if (!inputText.trim()) {
        alert('Please enter or paste deviation text.');
        return;
      }
      dispatch(runAnalyzeIncident({ text: inputText, sourceType: 'pasted_text' }));
    }
  };

  const handleAcceptAll = () => {
    dispatch(acceptAllAiSuggestions());
  };

  return (
    <div className="w-full lg:w-96 shrink-0 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">AI Quality Copilot</h2>
              <p className="text-[11px] text-slate-500">LangGraph Orchestration + Groq</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium px-2 py-1 rounded-md border border-indigo-200 transition-colors flex items-center cursor-pointer"
          >
            <FlaskConical className="w-3 h-3 mr-1 text-indigo-600" />
            Load Demo Incident
          </button>
        </div>

        {/* Source Mode Selector */}
        <div className="mt-3 flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Pasted Text / Email
          </button>
          <button
            type="button"
            onClick={() => setInputMode('pdf')}
            className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
              inputMode === 'pdf'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Digital PDF Upload
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 flex-1 flex flex-col space-y-3">
        {inputMode === 'text' ? (
          <div className="flex-1 flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-700">
                Incident / Deviation Material
              </label>
              <span className="text-[11px] text-slate-400 font-normal">
                {inputText.length} characters
              </span>
            </div>

            {(inputText.includes('DEV-2026-0842') || inputText.includes('Atorvastatin')) && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[10px] flex items-center space-x-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong className="font-semibold">DEMONSTRATION SCENARIO:</strong> Synthetic data for evaluation (Atorvastatin Calcium OOS Impurity D).
                </span>
              </div>
            )}

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste incident report, batch record excerpt, deviation notice, or email from manufacturing..."
              className="w-full flex-1 min-h-[180px] p-2.5 text-xs font-mono leading-relaxed bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white resize-none"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-medium text-slate-700 mb-1">
              Select Batch Incident PDF (Text-based)
            </label>
            <div className="flex-1 min-h-[160px] border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100/70 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Supports digital text-based PDF incident files.
              </p>
              {selectedFile && (
                <div className="mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={analysisStatus === 'loading'}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium text-xs shadow-md shadow-indigo-100 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {analysisStatus === 'loading' ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing with LangGraph & Groq...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Extract & Analyze Root Cause</span>
            </>
          )}
        </button>

        {/* Error notification */}
        {analysisStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Failed</p>
              <p className="text-[11px] text-red-600 mt-0.5">{analysisError}</p>
            </div>
          </div>
        )}

        {/* Animated Progress Stages */}
        {analysisStatus === 'loading' && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-indigo-900">
              <span className="flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1.5 text-indigo-600 animate-pulse" />
                LangGraph Workflow Running
              </span>
              <span className="text-indigo-600">Active</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center space-x-2 text-indigo-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>1. Normalizing & Extracting Incident Facts</span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>2. Generating 5-Whys Chain & 6M Fishbone</span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>3. Auditing Evidence Gaps & Missing Data</span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>4. Formulating Root Cause Hypotheses</span>
              </div>
              <div className="flex items-center space-x-2 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>5. Formulating Corrective & Preventive CAPA</span>
              </div>
            </div>
          </div>
        )}

        {/* Extraction Results & Accept All */}
        {aiExtracted && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>AI RCA Output Ready</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                ICH Q9/Q10
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 bg-white rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">5-Whys Depth</span>
                <span className="font-semibold text-slate-800">
                  {aiExtracted.five_whys?.length || 0} Levels
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">6M Factors</span>
                <span className="font-semibold text-slate-800">
                  {Object.values(aiExtracted.fishbone || {}).flat().length} Discovered
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">Evidence Gaps</span>
                <span className="font-semibold text-amber-700">
                  {aiExtracted.missing_evidence?.length || 0} Flagged
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-emerald-100">
                <span className="text-slate-400 block text-[10px]">CAPA Proposals</span>
                <span className="font-semibold text-indigo-700">
                  {aiExtracted.capa_recommendations?.length || 0} Actions
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAcceptAll}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sync All AI Suggestions to Form</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center">
              All suggested fields remain editable for Qualified Person review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
