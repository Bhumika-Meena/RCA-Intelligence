import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { addFishboneFactor, removeFishboneFactor } from '../store/rcaSlice';
import type { FishboneCategories } from '../types/rca';
import {
  Wrench,
  BookOpen,
  Boxes,
  Users,
  Gauge,
  Wind,
  Plus,
  X,
  Network
} from 'lucide-react';

interface CategoryConfig {
  key: keyof FishboneCategories;
  label: string;
  icon: React.ReactNode;
  description: string;
  badgeBg: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'machine',
    label: 'Machine (Equipment)',
    icon: <Wrench className="w-4 h-4 text-blue-600" />,
    description: 'Sensors, valves, agitators, reactors, flow meters',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'method',
    label: 'Method (Process / SOP)',
    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
    description: 'Recipe setpoints, addition rates, hold times',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    key: 'material',
    label: 'Material (Raw / Solvents)',
    icon: <Boxes className="w-4 h-4 text-amber-600" />,
    description: 'Solvent lots, reagents, raw materials, CoA',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    key: 'man',
    label: 'Man (Personnel)',
    icon: <Users className="w-4 h-4 text-purple-600" />,
    description: 'Operator actions, shift handovers, training',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'measurement',
    label: 'Measurement (QC / Assay)',
    icon: <Gauge className="w-4 h-4 text-cyan-600" />,
    description: 'HPLC calibration, sensor drift, analytical checks',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    key: 'milieu',
    label: 'Milieu (Environment)',
    icon: <Wind className="w-4 h-4 text-rose-600" />,
    description: 'Cleanroom humidity, ambient temp, utilities',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

export const SixMCards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { fishbone } = useSelector((state: RootState) => state.rca);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});

  const handleAdd = (category: keyof FishboneCategories) => {
    const val = (newInputs[category] || '').trim();
    if (val) {
      dispatch(addFishboneFactor({ category, factor: val }));
      setNewInputs({ ...newInputs, [category]: '' });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              3. Ishikawa Fishbone Analysis (6M Methodology)
            </h3>
            <p className="text-[11px] text-slate-500">
              Categorized contributing factor mapping across the 6 manufacturing dimensions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => {
          const items = fishbone[cat.key] || [];
          return (
            <div
              key={cat.key}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    {cat.icon}
                    <h4 className="text-xs font-bold text-slate-800">{cat.label}</h4>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                    {items.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2.5">{cat.description}</p>

                {/* Factor Tags */}
                <div className="space-y-1.5 min-h-[50px]">
                  {items.length === 0 ? (
                    <span className="text-[11px] text-slate-400 italic block py-1">
                      No factors identified
                    </span>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 shadow-2xs"
                      >
                        <span className="leading-snug pr-1 text-[11px]">{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(removeFishboneFactor({ category: cat.key, index: idx }))
                          }
                          className="text-slate-300 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remove factor"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add factor input */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center space-x-1.5">
                <input
                  type="text"
                  placeholder={`+ Add ${cat.label.split(' ')[0]} factor...`}
                  value={newInputs[cat.key] || ''}
                  onChange={(e) => setNewInputs({ ...newInputs, [cat.key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdd(cat.key);
                    }
                  }}
                  className="flex-1 px-2 py-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleAdd(cat.key)}
                  className="p-1 bg-slate-200 hover:bg-indigo-600 hover:text-white rounded-md text-slate-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
