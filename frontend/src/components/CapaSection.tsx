import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { addCapaAction, updateCapaAction, removeCapaAction } from '../store/rcaSlice';
import type { CapaItem } from '../types/rca';
import { ShieldCheck, Plus, Trash2, CheckCircle, Lightbulb } from 'lucide-react';

export const CapaSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { capa_actions } = useSelector((state: RootState) => state.rca);

  const handleAddNew = (type: 'corrective' | 'preventive') => {
    const newAction: CapaItem = {
      action_type: type,
      description: `New ${type} action plan...`,
      rationale: 'Addresses identified failure mechanism',
      owner: 'Quality Assurance',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      effectiveness_criteria: 'Verify zero recurrence in next 3 consecutive batches',
      status: 'open',
    };
    dispatch(addCapaAction(newAction));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              6. Corrective & Preventive Actions (CAPA) & Effectiveness Checks
            </h3>
            <p className="text-[11px] text-slate-500">
              ICH Q10 compliant remediations with assigned ownership and verification criteria
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleAddNew('corrective')}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Corrective Action
          </button>
          <button
            type="button"
            onClick={() => handleAddNew('preventive')}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Preventive Action
          </button>
        </div>
      </div>

      {capa_actions.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No CAPA recommendations generated yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Run AI Analysis to recommend immediate remedies and systemic recurrence preventions.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {capa_actions.map((capa, idx) => {
            const isCorrective = capa.action_type === 'corrective';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCorrective
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-indigo-200 bg-indigo-50/20'
                } shadow-2xs hover:shadow-xs`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        isCorrective
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                      }`}
                    >
                      {capa.action_type} Action #{idx + 1}
                    </span>
                    <select
                      value={capa.action_type}
                      onChange={(e) =>
                        dispatch(
                          updateCapaAction({
                            index: idx,
                            data: { action_type: e.target.value as any },
                          })
                        )
                      }
                      className="text-[11px] font-medium text-slate-600 bg-white border border-slate-300 rounded px-1.5 py-0.5"
                    >
                      <option value="corrective">Corrective</option>
                      <option value="preventive">Preventive</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(removeCapaAction(idx))}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                    title="Remove Action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Technical Action Description
                    </label>
                    <textarea
                      rows={2}
                      value={capa.description}
                      onChange={(e) =>
                        dispatch(
                          updateCapaAction({
                            index: idx,
                            data: { description: e.target.value },
                          })
                        )
                      }
                      placeholder="Detailed action scope..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Rationale */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5 flex items-center">
                      <Lightbulb className="w-3 h-3 text-amber-500 mr-1" />
                      Underlying Technical / GMP Rationale
                    </label>
                    <input
                      type="text"
                      value={capa.rationale || ''}
                      onChange={(e) =>
                        dispatch(
                          updateCapaAction({
                            index: idx,
                            data: { rationale: e.target.value },
                          })
                        )
                      }
                      placeholder="Scientific reason why this resolves the cause..."
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Owner, Target Date, Status Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Assigned Owner / Dept
                      </label>
                      <input
                        type="text"
                        value={capa.owner || ''}
                        onChange={(e) =>
                          dispatch(
                            updateCapaAction({
                              index: idx,
                              data: { owner: e.target.value },
                            })
                          )
                        }
                        placeholder="e.g. Engineering Maintenance"
                        className="w-full px-2 py-1 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Target Completion Date
                      </label>
                      <input
                        type="date"
                        value={capa.target_date || ''}
                        onChange={(e) =>
                          dispatch(
                            updateCapaAction({
                              index: idx,
                              data: { target_date: e.target.value },
                            })
                          )
                        }
                        className="w-full px-2 py-1 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                        Action Status
                      </label>
                      <select
                        value={capa.status || 'open'}
                        onChange={(e) =>
                          dispatch(
                            updateCapaAction({
                              index: idx,
                              data: { status: e.target.value },
                            })
                          )
                        }
                        className="w-full px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* Effectiveness Check Criteria */}
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-emerald-800 block mb-0.5 flex items-center">
                      <CheckCircle className="w-3 h-3 text-emerald-600 mr-1" />
                      Measurable Effectiveness Check Criteria (ICH Q10)
                    </label>
                    <input
                      type="text"
                      value={capa.effectiveness_criteria || ''}
                      onChange={(e) =>
                        dispatch(
                          updateCapaAction({
                            index: idx,
                            data: { effectiveness_criteria: e.target.value },
                          })
                        )
                      }
                      placeholder="e.g. Monitor next 5 consecutive batches to verify temperature stability +/- 1 deg C"
                      className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-emerald-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
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
