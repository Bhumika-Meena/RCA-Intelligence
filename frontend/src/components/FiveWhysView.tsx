import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { updateFiveWhy, addFiveWhy, removeFiveWhy } from '../store/rcaSlice';
import { GitBranch, Plus, Trash2, ArrowDown } from 'lucide-react';

export const FiveWhysView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { five_whys } = useSelector((state: RootState) => state.rca);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              2. 5 Whys Causal Interrogation Tree
            </h3>
            <p className="text-[11px] text-slate-500">
              Iterative interrogative chain isolating root mechanism from surface symptoms
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(addFiveWhy())}
          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Why Step
        </button>
      </div>

      {five_whys.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">No 5 Whys chain generated yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Run AI Analysis from the left panel or click "Add Why Step" above.
          </p>
        </div>
      ) : (
        <div className="space-y-3 relative">
          {five_whys.map((item, index) => (
            <React.Fragment key={index}>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {item.why_number}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Why Level {item.why_number}
                    </span>
                    {index === five_whys.length - 1 && (
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200">
                        Probable Root Failure
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch(removeFiveWhy(index))}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Remove Step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Question:
                    </label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) =>
                        dispatch(updateFiveWhy({ index, question: e.target.value }))
                      }
                      className="w-full mt-0.5 px-2.5 py-1 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Causal Finding / Answer:
                    </label>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={(e) =>
                        dispatch(updateFiveWhy({ index, answer: e.target.value }))
                      }
                      className="w-full mt-0.5 px-2.5 py-1 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {index < five_whys.length - 1 && (
                <div className="flex justify-center -my-1">
                  <ArrowDown className="w-4 h-4 text-slate-400 animate-bounce" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
