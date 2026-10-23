import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setField, acceptAiSuggestion } from '../store/rcaSlice';
import { Sparkles, FlaskConical, ShieldCheck } from 'lucide-react';

export const IncidentHeader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    deviation_number,
    title,
    facility,
    unit_operation,
    product_name,
    batch_number,
    severity,
    incident_date,
    reported_by,
    containment_actions,
    aiExtracted,
    acceptedFields
  } = useSelector((state: RootState) => state.rca);

  const handleChange = (field: string, value: string) => {
    dispatch(setField({ field, value }));
  };

  const isAiSuggested = (field: string) => {
    return aiExtracted && (aiExtracted.incident_facts as any)[field] && !acceptedFields[field];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <FlaskConical className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            1. Deviation Identification & Incident Metadata
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
          ICH Q7 cGMP API Manufacturing
        </span>
      </div>

      {/* Main Title */}
      <div>
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>Deviation / Incident Title</span>
          {isAiSuggested('title') && (
            <button
              type="button"
              onClick={() => dispatch(acceptAiSuggestion('title'))}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Accept AI Suggestion</span>
            </button>
          )}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g. Out-of-Specification (OOS) Impurity D in Atorvastatin Calcium Batch ATC-2026-B089"
          className="mt-1 w-full px-3 py-2 text-xs font-medium text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
        />
      </div>

      {/* Grid: Batch, Product, Deviation Number, Severity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Deviation Report No.
          </label>
          <input
            type="text"
            value={deviation_number || ''}
            onChange={(e) => handleChange('deviation_number', e.target.value)}
            placeholder="DEV-2026-0842"
            className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Batch / Lot Number
          </label>
          <input
            type="text"
            value={batch_number || ''}
            onChange={(e) => handleChange('batch_number', e.target.value)}
            placeholder="ATC-2026-B089"
            className="mt-1 w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            API Product Name
          </label>
          <input
            type="text"
            value={product_name || ''}
            onChange={(e) => handleChange('product_name', e.target.value)}
            placeholder="Atorvastatin Calcium Trihydrate"
            className="mt-1 w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Severity Classification
          </label>
          <select
            value={severity || 'Major'}
            onChange={(e) => handleChange('severity', e.target.value)}
            className="mt-1 w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          >
            <option value="Critical">Critical (Direct OOS / Patient Impact)</option>
            <option value="Major">Major (Process Parameter Drift)</option>
            <option value="Minor">Minor (Documentation / Housekeeping)</option>
          </select>
        </div>
      </div>

      {/* Grid: Facility, Unit Operation, Date, Reported By */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Facility / Building
          </label>
          <input
            type="text"
            value={facility || ''}
            onChange={(e) => handleChange('facility', e.target.value)}
            placeholder="API Manufacturing Block B, Line 3"
            className="mt-1 w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Unit Operation / Stage
          </label>
          <input
            type="text"
            value={unit_operation || ''}
            onChange={(e) => handleChange('unit_operation', e.target.value)}
            placeholder="Final Crystallization & Isolation"
            className="mt-1 w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Incident Occurrence Date
          </label>
          <input
            type="text"
            value={incident_date || ''}
            onChange={(e) => handleChange('incident_date', e.target.value)}
            placeholder="October 22, 2026, 04:15 IST"
            className="mt-1 w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block">
            Reported By / QA Reviewer
          </label>
          <input
            type="text"
            value={reported_by || ''}
            onChange={(e) => handleChange('reported_by', e.target.value)}
            placeholder="Rajesh Sharma / Dr. Ananya Iyer"
            className="mt-1 w-full px-2.5 py-1.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Immediate Containment Actions */}
      <div>
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immediate Containment Actions Taken</span>
          </span>
          {isAiSuggested('containment_actions') && (
            <button
              type="button"
              onClick={() => dispatch(acceptAiSuggestion('containment_actions'))}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Accept AI Suggestion</span>
            </button>
          )}
        </label>
        <textarea
          value={containment_actions || ''}
          onChange={(e) => handleChange('containment_actions', e.target.value)}
          rows={2}
          placeholder="e.g. Batch placed on QA quarantine, equipment locked out, downstream micronization halted..."
          className="mt-1 w-full px-3 py-2 text-xs text-slate-900 bg-slate-50/50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white"
        />
      </div>
    </div>
  );
};
