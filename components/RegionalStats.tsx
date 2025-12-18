
import React, { useMemo } from 'react';
import { BirdSpecies, Observation } from '../types';
import { PROVINCES } from '../constants';
import { Map, AlertCircle, Sparkles } from 'lucide-react';

interface RegionalStatsProps {
  species: BirdSpecies[];
  observations: Observation[];
}

const RegionalStats: React.FC<RegionalStatsProps> = ({ species, observations }) => {
  const stats = useMemo(() => {
    return PROVINCES.map(province => {
      // Species theoretically in this province
      const theoreticalSpecies = species.filter(s => s.distribution.includes(province));
      
      // Species actually observed in this province
      const observedInProvince = observations.filter(o => o.province === province);
      const uniqueObservedIds = new Set(observedInProvince.map(o => o.speciesId));
      
      // Calculated Progress
      const observedTheoreticalCount = Array.from(uniqueObservedIds).filter(id => 
        theoreticalSpecies.some(s => s.id === id)
      ).length;
      
      const progress = theoreticalSpecies.length > 0 
        ? Math.round((observedTheoreticalCount / theoreticalSpecies.length) * 100) 
        : 0;

      // Unexpected Finds
      const unexpectedSpecies = Array.from(uniqueObservedIds).filter(id => 
        !theoreticalSpecies.some(s => s.id === id)
      );

      return {
        province,
        theoreticalCount: theoreticalSpecies.length,
        observedCount: uniqueObservedIds.size,
        progress,
        unexpectedCount: unexpectedSpecies.length
      };
    }).sort((a, b) => b.progress - a.progress);
  }, [species, observations]);

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
           <Map className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">区域探索概览</h2>
          <p className="text-slate-500">追踪您在各地的收集进度</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.province} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">{s.province}</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${s.progress === 100 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {s.progress === 100 ? '探索完成' : `进度 ${s.progress}%`}
              </span>
            </div>

            <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${s.progress}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">已点亮</p>
                <p className="text-lg font-bold text-slate-700">{s.observedCount} <span className="text-xs font-normal text-slate-400">/ {s.theoreticalCount}</span></p>
              </div>
              <div className={`p-3 rounded-2xl ${s.unexpectedCount > 0 ? 'bg-amber-50' : 'bg-slate-50 opacity-40'}`}>
                <p className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${s.unexpectedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>意外发现</p>
                <div className="flex items-center space-x-1">
                   {s.unexpectedCount > 0 && <Sparkles size={12} className="text-amber-500" />}
                   <p className={`text-lg font-bold ${s.unexpectedCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{s.unexpectedCount}</p>
                </div>
              </div>
            </div>

            {s.progress === 0 && s.theoreticalCount > 0 && (
              <div className="mt-4 flex items-center text-[10px] text-slate-300">
                <AlertCircle size={10} className="mr-1" />
                该省份暂无观测记录
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionalStats;
