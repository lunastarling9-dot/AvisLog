
import React, { useState } from 'react';
import { BirdSpecies } from '../types';
import { Search, Hash, Globe, Info } from 'lucide-react';

interface SpeciesCatalogProps {
  species: BirdSpecies[];
}

const SpeciesCatalog: React.FC<SpeciesCatalogProps> = ({ species }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSpecies = species.filter(s => 
    s.name.includes(searchTerm) || 
    s.latinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.taxonomy.family.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">鸟种资料库</h2>
          <p className="text-slate-500">当前共有 {species.length} 个记录鸟种</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索鸟种、学名、科属..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredSpecies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSpecies.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{s.name}</h3>
                  <p className="text-sm font-medium italic text-slate-400">{s.latinName}</p>
                </div>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded">
                  {s.taxonomy.family}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start space-x-3">
                  <Hash className="text-slate-300 mt-1 flex-shrink-0" size={14} />
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">{s.taxonomy.order}</span> · {s.taxonomy.genus}
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <Globe className="text-slate-300 mt-1 flex-shrink-0" size={14} />
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {s.distribution.join(', ')}
                  </p>
                </div>
                {s.description && (
                  <div className="flex items-start space-x-3">
                    <Info className="text-slate-300 mt-1 flex-shrink-0" size={14} />
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] text-slate-300">ID: {s.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p>没有找到相关鸟种资料</p>
        </div>
      )}
    </div>
  );
};

export default SpeciesCatalog;
