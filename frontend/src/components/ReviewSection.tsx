import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setField, saveCurrentInvestigation, clearSaveSuccess } from '../store/rcaSlice';
import { Award, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReviewSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { status, reviewer_notes, isSaving, saveSuccess, saveError, id } = useSelector(
    (state: RootState) => state.rca
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              7. Qualified Person (QP) Review & Investigation Sign-Off
            </h3>
            <p className="text-[11px] text-slate-500">
              Simulated QA review, disposition comments, and PostgreSQL database persistence
            </p>
          </div>
        </div>
      </div>

      {/* Regulatory Prototype Disclaimer */}
      <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
        <span className="font-bold">Simulated QA Workflow (Evaluation Prototype): </span>
        This interface illustrates the Quality Assurance disposition process. Formal pharmaceutical release requires authenticated role-based authorization (RBAC) and cryptographically validated electronic signatures under 21 CFR Part 11, which are intentionally decoupled in this evaluation module.
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Overall Investigation Status
            </label>
            <select
              value={status}
              onChange={(e) => dispatch(setField({ field: 'status', value: e.target.value }))}
              className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="draft">Draft (Investigation in Progress)</option>
              <option value="under_review">Under Review (QA Technical Assessment)</option>
              <option value="approved">Approved & QA Closed (Qualified Person)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Reviewer Notes / Technical Disposition
            </label>
            <textarea
              rows={2}
              value={reviewer_notes}
              onChange={(e) =>
                dispatch(setField({ field: 'reviewer_notes', value: e.target.value }))
              }
              placeholder="Qualified Person comments, CAPA approval justification, batch release recommendations..."
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Notifications */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{saveSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearSaveSuccess())}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{saveError}</span>
          </div>
        )}

        {/* Bottom Save Action Bar */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => dispatch(saveCurrentInvestigation())}
            disabled={isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-2 shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? 'Writing to Neon PostgreSQL...'
                : id
                ? `Update Investigation #${id}`
                : 'Save Investigation to Database'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
