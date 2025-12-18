
import React, { useState } from 'react';
import { BirdSpecies, AuthLevel } from '../types';
import { Search, Globe, Info, ChevronRight, Edit3 } from 'lucide-react';

interface SpeciesCatalogProps {
  species: BirdSpecies[];
  authLevel: AuthLevel;
  onUpdate: () => void;
  onEdit: (bird: BirdSpecies) => void;
}

const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ species, authLevel, onUpdate, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecies = species.filter(s => 
    s.name.includes(searchTerm) || 
    s.latinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.taxonomy.family.includes(searchTerm) ||
    s.taxonomy.order.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold serif-title text-slate-800">鸟种百科全书</h2>
          <p className="text-slate-500">
            {authLevel !== 'none' ? '协作模式已激活：您可以修改现有资料或在管理中心录入' : `当前已收录 ${species.length} 个物种`}
          </p>
        </div>
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="搜索物种名称、目科或拉丁名..."
            className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSpecies.map(s => (
          <div key={s.id} className="glass-card p-8 rounded-[2.5rem] transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 serif-title">{s.name}</h3>
                <p className="text-sm font-medium italic text-slate-400 font-serif">{s.latinName}</p>
              </div>
              {authLevel !== 'none' && (
                <button 
                  onClick={() => onEdit(s)}
                  className="p-2 bg-emerald-50 text-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:text-white"
                  title="修改此鸟种资料"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.order}</span>
                 <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.family}</span>
                 <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.genus}</span>
              </div>
              
              <div className="flex items-start space-x-3">
                <Globe className="text-emerald-400 mt-1 flex-shrink-0" size={16} />
                <p className="text-xs text-slate-500 line-clamp-2">理论分布：{s.distribution.join(', ') || '未记录'}</p>
              </div>
              
              {s.description && (
                <div className="flex items-start space-x-3 pt-2 border-t border-slate-100">
                  <Info className="text-slate-300 mt-1 flex-shrink-0" size={16} />
                  <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">{s.description}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">UID: {s.id.slice(0, 8)}</span>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
      
      {filteredSpecies.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
           <Search size={48} className="mb-4 opacity-20" />
           <p className="text-lg">未找到匹配的鸟种</p>
           {authLevel !== 'none' && (
             <p className="text-sm mt-2">您可以前往管理中心手动录入该新物种</p>
           )}
        </div>
      )}
    </div>
  );
};

export default SpeciesCatalog;
