import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  setSavedModalOpen,
  saveCurrentInvestigation,
  resetInvestigation,
  fetchSavedInvestigations
} from '../store/rcaSlice';
import {
  ShieldAlert,
  Database,
  Save,
  RotateCcw,
  Printer
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    id,
    deviation_number,
    batch_number,
    severity,
    status,
    isSaving,
    savedList
  } = useSelector((state: RootState) => state.rca);

  const handleOpenSaved = () => {
    dispatch(fetchSavedInvestigations());
    dispatch(setSavedModalOpen(true));
  };

  const handleSave = () => {
    dispatch(saveCurrentInvestigation());
  };

  const handleReset = () => {
    if (confirm('Start a new investigation? Unsaved changes will be cleared.')) {
      dispatch(resetInvestigation());
    }
  };

  const getSeverityBadge = () => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'major':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusBadge = () => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">AIVOA</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quality Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              API Manufacturing Root Cause Analysis & CAPA (ICH Q9 / Q10)
            </p>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          {batch_number && (
            <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Batch: <span className="font-bold">{batch_number}</span>
            </div>
          )}
          {deviation_number && (
            <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Dev: <span className="font-bold">{deviation_number}</span>
            </div>
          )}
          <span className={`px-2.5 py-1 rounded-md border font-medium ${getSeverityBadge()}`}>
            {severity || 'Major'}
          </span>
          <span className={`px-2.5 py-1 rounded-md border font-medium uppercase text-[10px] tracking-wider ${getStatusBadge()}`}>
            {status || 'Draft'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={handleOpenSaved}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Saved Records
            {savedList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded-full text-[10px]">
                {savedList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title="Print Investigation Summary"
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-50 border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Print Summary
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Form"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs shadow-indigo-200 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Saving to Neon...' : id ? 'Update Investigation' : 'Save Investigation'}
          </button>
        </div>
      </div>
    </header>
  );
};
