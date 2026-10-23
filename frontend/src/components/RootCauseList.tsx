import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { updateRootCauseStatus } from '../store/rcaSlice';
import { Target, CheckCircle2, HelpCircle } from 'lucide-react';

export const RootCauseList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { root_causes } = useSelector((state: RootState) => state.rca);

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              5. Potential Root Causes & Hypotheses
            </h3>
            <p className="text-[11px] text-slate-500">
              Evidence-anchored causal hypotheses. AI findings are treated as hypotheses until Qualified Person confirmation.
            </p>
          </div>
        </div>
      </div>

      {root_causes.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No root cause hypotheses formulated yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Run AI Analysis to synthesize causal mechanisms from the 5-Whys and process data.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {root_causes.map((rc, idx) => {
            const isConfirmed = rc.status === 'confirmed';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isConfirmed
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {rc.category || 'Primary Root Cause'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getConfidenceBadge(
                        rc.confidence_level
                      )}`}
                    >
                      Confidence: {rc.confidence_level}
                    </span>
                  </div>

                  {/* Status toggle */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-500">QA Status:</span>
                    <select
                      value={rc.status}
                      onChange={(e) =>
                        dispatch(updateRootCauseStatus({ index: idx, status: e.target.value }))
                      }
                      className={`text-xs font-semibold px-2 py-1 rounded-md border transition-colors ${
                        isConfirmed
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      <option value="candidate">Candidate Hypothesis (Unconfirmed)</option>
                      <option value="confirmed">Confirmed by Qualified Person (QP)</option>
                      <option value="ruled_out">Ruled Out by Evidence</option>
                    </select>
                  </div>
                </div>

                {/* Hypothesis Statement */}
                <h4 className="text-xs font-bold text-slate-900 leading-snug mb-2.5">
                  {rc.hypothesis}
                </h4>

                {/* Supporting vs Contradicting Evidence Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Supporting Evidence
                    </span>
                    {rc.supporting_evidence?.length ? (
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                        {rc.supporting_evidence.map((ev, eIdx) => (
                          <li key={eIdx} className="leading-snug">
                            {ev}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">None noted</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1 flex items-center">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Contradicting Evidence / Uncertainties
                    </span>
                    {rc.contradicting_evidence?.length ? (
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                        {rc.contradicting_evidence.map((cev, cIdx) => (
                          <li key={cIdx} className="leading-snug">
                            {cev}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        No contradictory data reported
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
