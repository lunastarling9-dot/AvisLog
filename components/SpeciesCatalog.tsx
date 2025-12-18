
import React, { useState } from 'react';
import { BirdSpecies } from '../types';
import { Search, Hash, Globe, Info, ChevronRight } from 'lucide-react';

interface SpeciesCatalogProps {
  species: BirdSpecies[];
}

const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ species }) => {
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
          <p className="text-slate-500">已收录 {species.length} 个物种的详细分类学资料</p>
        </div>
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="搜索中文名、拉丁名、目、科、属..."
            className="w-full pl-12 pr-4 py-4 bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredSpecies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpecies.map(s => (
            <div key={s.id} className="glass-card p-8 rounded-[2.5rem] transition-all hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <Search size={80} strokeWidth={1} />
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors serif-title">{s.name}</h3>
                  <p className="text-sm font-medium italic text-slate-400 font-serif">{s.latinName}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-2">
                   <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.order}</span>
                   <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.family}</span>
                   <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded tracking-wider">{s.taxonomy.genus}</span>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Globe className="text-emerald-400 mt-1 flex-shrink-0" size={16} />
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    理论分布：{s.distribution.length > 0 ? s.distribution.join(', ') : '暂未录入分布数据'}
                  </p>
                </div>
                
                {s.description && (
                  <div className="flex items-start space-x-3 pt-2 border-t border-slate-100">
                    <Info className="text-slate-300 mt-1 flex-shrink-0" size={16} />
                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">
                      {s.description}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[9px] font-black text-slate-300 tracking-widest uppercase">CATALOG ID: {s.id.slice(0, 8)}</span>
                <button className="text-emerald-600 hover:text-emerald-700 p-2">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <Search size={64} className="mb-4 opacity-10" />
          <p className="font-bold">百科中暂无匹配物种</p>
          <p className="text-sm opacity-60">请尝试在管理中心添加或扩充鸟种库</p>
        </div>
      )}
    </div>
  );
};

export default SpeciesCatalog;
