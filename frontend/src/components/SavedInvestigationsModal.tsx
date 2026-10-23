import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  setSavedModalOpen,
  loadInvestigationById,
  fetchSavedInvestigations
} from '../store/rcaSlice';
import { X, Database, FolderOpen, RefreshCw, Search } from 'lucide-react';

export const SavedInvestigationsModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isSavedModalOpen, savedList, isLoadingSaved, id: currentId } = useSelector(
    (state: RootState) => state.rca
  );

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isSavedModalOpen) {
      dispatch(fetchSavedInvestigations());
    }
  }, [isSavedModalOpen, dispatch]);

  if (!isSavedModalOpen) return null;

  const filtered = savedList.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      (item.title || '').toLowerCase().includes(q) ||
      (item.batch_number || '').toLowerCase().includes(q) ||
      (item.deviation_number || '').toLowerCase().includes(q) ||
      (item.product_name || '').toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'under_review':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Saved Quality Investigations</h3>
              <p className="text-[11px] text-slate-500">Persisted in Neon PostgreSQL database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch(setSavedModalOpen(false))}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-white flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by Batch#, Deviation#, Product, or Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchSavedInvestigations())}
            title="Refresh List"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingSaved ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Investigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoadingSaved ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
              <span>Loading saved investigations from Neon...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No saved investigations found.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Save your first reviewed RCA using the "Save Investigation" button.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCurrentlyActive = currentId === item.id;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrentlyActive
                      ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      {isCurrentlyActive && (
                        <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.2 rounded-full">
                          Currently Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {item.deviation_number && (
                        <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.deviation_number}
                        </span>
                      )}
                      {item.batch_number && (
                        <span className="font-mono text-slate-600">
                          Batch: <strong>{item.batch_number}</strong>
                        </span>
                      )}
                      {item.product_name && (
                        <span className="text-slate-600 truncate max-w-[200px]">
                          {item.product_name}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-slate-400">
                        {item.capa_count} CAPA{item.capa_count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(loadInvestigationById(item.id))}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shrink-0 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                    Reopen Investigation
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} total saved investigations</span>
          <button
            type="button"
            onClick={() => dispatch(setSavedModalOpen(false))}
            className="px-3 py-1 bg-white border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
