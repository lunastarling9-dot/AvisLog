
import React, { useState } from 'react';
import { BirdSpecies } from '../types';
// Fixed: Added AlertCircle to the lucide-react imports
import { Plus, Database, Sparkles, X, Save, Trash2, ListChecks, Shield, Lock, Key, AlertCircle } from 'lucide-react';
import { PROVINCES } from '../constants';
import { putItem, deleteItem } from '../db';
import { parseSpeciesFromText } from '../geminiService';

interface AdminPanelProps {
  species: BirdSpecies[];
  onUpdate: () => void;
  currentPin: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ species, onUpdate, currentPin }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'security'>('data');
  const [isManualAdding, setIsManualAdding] = useState(false);
  const [isAiAdding, setIsAiAdding] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // PIN Change state
  const [pinChange, setPinChange] = useState({ old: '', new: '', confirm: '' });

  // Manual form states
  const [name, setName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [order, setOrder] = useState('');
  const [family, setFamily] = useState('');
  const [genus, setGenus] = useState('');
  const [distribution, setDistribution] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const handleManualSave = async () => {
    if (!name || !latinName) {
      alert('请至少填写中文名和学名');
      return;
    }

    const newBird: BirdSpecies = {
      id: crypto.randomUUID(),
      name,
      latinName,
      taxonomy: { order, family, genus },
      distribution,
      description,
      createdAt: Date.now()
    };

    await putItem('species', newBird);
    onUpdate();
    setIsManualAdding(false);
    resetManualForm();
  };

  const resetManualForm = () => {
    setName(''); setLatinName(''); setOrder(''); setFamily(''); setGenus('');
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
          taxonomy: { order: p.order, family: p.family, genus: p.genus },
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
      alert('AI 解析失败，请检查输入或 API Key');
    } finally {
      setIsParsing(false);
    }
  };

  const handlePinChange = async () => {
    if (pinChange.old !== currentPin) {
      alert('原 PIN 码错误');
      return;
    }
    if (pinChange.new !== pinChange.confirm) {
      alert('两次输入的新 PIN 码不一致');
      return;
    }
    if (pinChange.new.length < 4) {
      alert('新 PIN 码至少需要 4 位');
      return;
    }

    await putItem('settings', { key: 'adminPin', value: pinChange.new });
    alert('管理员 PIN 码已更新！');
    setPinChange({ old: '', new: '', confirm: '' });
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm('删除鸟种资料将导致相关的观测记录变得不可识别，确定删除？')) {
      await deleteItem('species', id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Database className="mr-2 text-emerald-600" />
            管理中心
          </h2>
          <p className="text-slate-500">维护系统数据与安全配置</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'data' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            资料管理
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            安全设置
          </button>
        </div>
      </div>

      {activeTab === 'data' ? (
        <div className="space-y-6">
          <div className="flex justify-end space-x-3">
            <button 
              onClick={() => setIsManualAdding(true)} 
              className="flex items-center space-x-2 px-6 py-3 bg-white border border-emerald-600 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span>手动录入</span>
            </button>
            <button 
              onClick={() => setIsAiAdding(true)} 
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Sparkles size={18} />
              <span>AI 批量解析</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">中文名/学名</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">科属</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider">理论分布</th>
                    <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-wider text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {species.sort((a,b) => b.createdAt - a.createdAt).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs italic text-slate-400">{s.latinName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600">{s.taxonomy.family}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{s.taxonomy.genus}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 max-w-xs truncate">{s.distribution.join(', ')}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {species.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <Database size={48} className="mx-auto mb-4 opacity-10" />
                  <p>暂无鸟种数据</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto space-y-8 animate-in">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Shield className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">修改管理员 PIN 码</h3>
                <p className="text-sm text-slate-500">用于访问管理中心及保护核心数据</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Lock size={14} className="mr-2" /> 原 PIN 码
                </label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  value={pinChange.old} 
                  onChange={e => setPinChange({...pinChange, old: e.target.value})}
                  placeholder="当前使用的 PIN"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Key size={14} className="mr-2" /> 新 PIN 码
                </label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  value={pinChange.new} 
                  onChange={e => setPinChange({...pinChange, new: e.target.value})}
                  placeholder="输入新 PIN"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <ListChecks size={14} className="mr-2" /> 确认新 PIN 码
                </label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500" 
                  value={pinChange.confirm} 
                  onChange={e => setPinChange({...pinChange, confirm: e.target.value})}
                  placeholder="再次输入新 PIN"
                />
              </div>

              <button 
                onClick={handlePinChange}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
              >
                <Save size={18} />
                <span>更新安全凭据</span>
              </button>
            </div>
          </div>
          
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start space-x-4">
             <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
             <div className="text-xs text-amber-800 leading-relaxed">
               <p className="font-bold mb-1">提示：</p>
               <p>管理员 PIN 码将保存在浏览器的本地存储（IndexedDB）中。若清除浏览器缓存或更换设备，默认 PIN 码将恢复为 <code className="bg-amber-200/50 px-1 rounded">8888</code>。</p>
             </div>
          </div>
        </div>
      )}

      {/* AI Batch Add Modal (Data Tab) */}
      {isAiAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-in p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Sparkles className="text-emerald-600" size={20} />
                </div>
                <h3 className="text-xl font-bold">AI 智能解析录入</h3>
              </div>
              <button onClick={() => setIsAiAdding(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <textarea
              className="w-full h-64 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-700"
              placeholder="例如：红嘴蓝鹊（学名：Urocissa erythroryncha）..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />

            <div className="mt-8 flex space-x-4">
              <button onClick={() => setIsAiAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">取消</button>
              <button onClick={handleAiParse} disabled={isParsing || !aiText} className="flex-1 py-4 font-bold bg-emerald-600 text-white rounded-2xl shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                {isParsing ? '正在解析...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal (Data Tab) */}
      {isManualAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in my-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">手动录入鸟种</h3>
              <button onClick={() => setIsManualAdding(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input placeholder="中文名" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={name} onChange={e => setName(e.target.value)} />
                <input placeholder="拉丁学名" className="w-full px-4 py-3 bg-slate-50 border rounded-xl" value={latinName} onChange={e => setLatinName(e.target.value)} />
              </div>
              <button onClick={handleManualSave} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">保存鸟种</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
