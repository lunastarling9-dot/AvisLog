
import React, { useState } from 'react';
import { BirdSpecies } from '../types';
import { 
  Plus, Database, Sparkles, X, Save, Trash2, ListChecks, Shield, Lock, Key, 
  AlertCircle, Cloud, Globe, BookOpen, CheckSquare, Square, ChevronDown 
} from 'lucide-react';
import { PROVINCES } from '../constants';
import { putItem, deleteItem } from '../db';
import { parseSpeciesFromText } from '../geminiService';

interface AdminPanelProps {
  species: BirdSpecies[];
  onUpdate: () => void;
  currentPin: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ species, onUpdate, currentPin }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'security' | 'sync'>('data');
  const [isManualAdding, setIsManualAdding] = useState(false);
  const [isAiAdding, setIsAiAdding] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Manual form states
  const [name, setName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [taxonomy, setTaxonomy] = useState({
    class: '鸟纲',
    order: '',
    family: '',
    genus: '',
    species: ''
  });
  const [distribution, setDistribution] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  // Security & Sync states
  const [pinChange, setPinChange] = useState({ old: '', new: '', confirm: '' });
  const [syncConfig, setSyncConfig] = useState({ url: '', user: '', pass: '', status: 'disconnected' });

  const handleManualSave = async () => {
    if (!name || !latinName) {
      alert('请至少填写中文名和学名');
      return;
    }

    const newBird: BirdSpecies = {
      id: crypto.randomUUID(),
      name,
      latinName,
      taxonomy,
      distribution,
      description,
      createdAt: Date.now()
    };

    await putItem('species', newBird);
    onUpdate();
    setIsManualAdding(false);
    resetManualForm();
  };

  const handlePinUpdate = async () => {
    if (pinChange.old !== currentPin) {
      alert('原 PIN 码输入错误');
      return;
    }
    if (pinChange.new.length < 4) {
      alert('新 PIN 码长度至少为 4 位');
      return;
    }
    if (pinChange.new !== pinChange.confirm) {
      alert('两次输入的密码不一致');
      return;
    }

    await putItem('settings', { key: 'adminPin', value: pinChange.new });
    alert('管理员 PIN 码已成功更新！');
    setPinChange({ old: '', new: '', confirm: '' });
    onUpdate();
  };

  const resetManualForm = () => {
    setName(''); setLatinName('');
    setTaxonomy({ class: '鸟纲', order: '', family: '', genus: '', species: '' });
    setDistribution([]); setDescription('');
  };

  const handleAiParse = async () => {
    if (!aiText) return;
    setIsParsing(true);
    try {
      const parsed = await parseSpeciesFromText(aiText);
      for (const p of parsed) {
        const newBird: BirdSpecies = {
          id: crypto.randomUUID(),
          name: p.name,
          latinName: p.latinName,
          taxonomy: { order: p.order, family: p.family, genus: p.genus, class: '鸟纲' },
          distribution: p.distribution,
          description: p.description,
          createdAt: Date.now()
        };
        await putItem('species', newBird);
      }
      alert(`解析成功，已导入 ${parsed.length} 个物种！`);
      onUpdate();
      setIsAiAdding(false);
      setAiText('');
    } catch (err) {
      alert('AI 解析失败，请检查网络或 API Key');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleProvince = (p: string) => {
    setDistribution(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const selectAllProvinces = () => {
    setDistribution(distribution.length === PROVINCES.length ? [] : [...PROVINCES]);
  };

  return (
    <div className="space-y-8 animate-in relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center serif-title text-slate-800">
            <Database className="mr-3 text-emerald-600" />
            系统管理中心
          </h2>
          <p className="text-slate-500 mt-1">管理核心资料库、安全配置及云端同步</p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'data', label: '资料管理', icon: BookOpen },
            { id: 'security', label: '安全', icon: Shield },
            { id: 'sync', label: '云端同步', icon: Cloud }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="flex justify-end space-x-3">
            <button onClick={() => setIsManualAdding(true)} className="flex items-center space-x-2 px-6 py-3 bg-white border border-emerald-600 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all">
              <Plus size={18} />
              <span>手动录入</span>
            </button>
            <button onClick={() => setIsAiAdding(true)} className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg">
              <Sparkles size={18} />
              <span>AI 批量解析</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">物种名称 (拉丁名)</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">完整分类</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">理论分布</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider text-right">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {species.sort((a,b) => b.createdAt - a.createdAt).map(s => (
                  <tr key={s.id} className="hover:bg-emerald-50/30 transition-all group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs italic text-slate-400 font-serif">{s.latinName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {[s.taxonomy.class, s.taxonomy.order, s.taxonomy.family, s.taxonomy.genus].filter(Boolean).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{s.distribution.join(', ') || '未配置'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteItem('species', s.id).then(onUpdate)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in">
           <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Shield className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">修改管理员 PIN 码</h3>
                <p className="text-sm text-slate-500">保护您的系统设置与数据安全</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">当前 PIN 码</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  value={pinChange.old}
                  onChange={e => setPinChange({...pinChange, old: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">新 PIN 码</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                    value={pinChange.new}
                    onChange={e => setPinChange({...pinChange, new: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">确认新 PIN 码</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                    value={pinChange.confirm}
                    onChange={e => setPinChange({...pinChange, confirm: e.target.value})}
                  />
                </div>
              </div>
              <button 
                onClick={handlePinUpdate}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center space-x-2 mt-4"
              >
                <Lock size={18} />
                <span>更新管理员密码</span>
              </button>
            </div>
            
            <div className="mt-8 flex items-start space-x-3 p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-400">
               <AlertCircle size={14} className="flex-shrink-0" />
               <p>PIN 码保存在本地 IndexedDB 中，如果清除浏览器数据，PIN 码将重置为默认值 (8888)。请务必定期导出数据备份。</p>
            </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <Cloud className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">BYOS 云端同步 (Beta)</h3>
                <p className="text-sm text-slate-500">连接您自己的云存储空间，实现私有数据同步</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">WebDAV 地址</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  placeholder="https://dav.jianguoyun.com/dav/AvisLog/"
                  value={syncConfig.url}
                  onChange={e => setSyncConfig({...syncConfig, url: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">账号</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={syncConfig.user} onChange={e => setSyncConfig({...syncConfig, user: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">应用授权码</label>
                  <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={syncConfig.pass} onChange={e => setSyncConfig({...syncConfig, pass: e.target.value})} />
                </div>
              </div>
              <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
                <Cloud size={18} />
                <span>连接并测试同步</span>
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-start space-x-4">
             <Globe className="text-emerald-600 flex-shrink-0" size={20} />
             <div className="text-xs text-emerald-800 leading-relaxed">
               <p className="font-bold mb-1">为什么使用 WebDAV？</p>
               <p>AvisLog 是一款本地优先的应用。通过 WebDAV，您可以将数据同步到坚果云、Nextcloud 甚至您自家的 NAS。数据只在您的设备和您的云盘之间传输，极具隐私安全性。</p>
             </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {isManualAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl animate-in my-auto">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-emerald-100 rounded-xl"><Plus className="text-emerald-600" /></div>
                 <h3 className="text-2xl font-bold serif-title text-slate-800">录入新鸟种资料</h3>
              </div>
              <button onClick={() => setIsManualAdding(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">中文名称</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="如：红尾水鸲" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">拉丁学名</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl italic font-serif" placeholder="Phoenicurus fuliginosus" value={latinName} onChange={e => setLatinName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">生物分类学 (Taxonomy)</h4>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['class', 'order', 'family', 'genus', 'species'].map((level) => (
                      <div key={level} className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">{level}</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" 
                          value={(taxonomy as any)[level]} 
                          onChange={e => setTaxonomy({...taxonomy, [level]: e.target.value})} 
                        />
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">理论分布区域</h4>
                  <button onClick={selectAllProvinces} className="text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded">
                    {distribution.length === PROVINCES.length ? '全部取消' : '全选'}
                  </button>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {PROVINCES.map(p => (
                      <button
                        key={p}
                        onClick={() => toggleProvince(p)}
                        className={`flex items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all border ${
                          distribution.includes(p) 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {p.replace('自治区', '').replace('特别行政区', '').replace('省', '').replace('市', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">物种特征/习性描述</label>
                <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" placeholder="描述该鸟种的典型特征..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex space-x-4">
              <button onClick={() => setIsManualAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">取消</button>
              <button onClick={handleManualSave} className="flex-1 py-4 font-bold bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
                <Save size={20} />
                <span>保存并入库</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
