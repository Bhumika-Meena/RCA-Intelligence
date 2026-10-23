import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { toggleEvidenceVerified } from '../store/rcaSlice';
import { ClipboardCheck, CheckSquare, Square, Info } from 'lucide-react';

export const EvidenceGapList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { missing_evidence } = useSelector((state: RootState) => state.rca);

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              4. Evidence Gap Analysis & Missing Information Auditor
            </h3>
            <p className="text-[11px] text-slate-500">
              Unverified records, missing calibration certificates, and open analytical questions
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {missing_evidence.filter((e) => e.verified).length} / {missing_evidence.length} Verified
        </span>
      </div>

      {missing_evidence.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No evidence gaps flagged.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Run AI Analysis to scan batch records and logs for unverified information.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {missing_evidence.map((item, idx) => (
            <div
              key={idx}
              onClick={() => dispatch(toggleEvidenceVerified(idx))}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                item.verified
                  ? 'bg-slate-50/70 border-slate-200 opacity-75'
                  : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
              }`}
            >
              <div className="mt-0.5 text-indigo-600">
                {item.verified ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`text-xs font-semibold ${
                      item.verified ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {item.item}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {item.priority} Priority
                  </span>
                </div>
                {item.rationale && (
                  <p className="text-[11px] text-slate-500 leading-relaxed flex items-start space-x-1">
                    <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5 mr-1" />
                    <span>{item.rationale}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
