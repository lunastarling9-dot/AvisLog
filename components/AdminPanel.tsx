
import React, { useState, useEffect } from 'react';
import { BirdSpecies, AuthLevel } from '../types';
import { 
  Plus, Database, Sparkles, X, Save, Trash2, Shield, Lock, Cloud, Globe, BookOpen, AlertCircle, Edit3, UserPlus, CheckCircle2, Server, Key, FolderSync, Info
} from 'lucide-react';
import { PROVINCES } from '../constants';
import { putItem, deleteItem, getItem } from '../db';

interface AdminPanelProps {
  species: BirdSpecies[];
  onUpdate: () => void;
  masterPin: string;
  adminPin: string;
  authLevel: AuthLevel;
  initialEditId: string | null;
  onClearEdit: () => void;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  species, onUpdate, masterPin, adminPin, authLevel, initialEditId, onClearEdit 
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'security' | 'sync'>('data');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<BirdSpecies | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  
  const [formData, setFormData] = useState({
    name: '', latinName: '',
    taxonomy: { class: '鸟纲', order: '', family: '', genus: '', species: '' },
    distribution: [] as string[],
    description: ''
  });

  const [pins, setPins] = useState({ masterOld: '', masterNew: '', adminNew: '' });

  // Sync states
  const [syncConfig, setSyncConfig] = useState({
    url: '',
    username: '',
    password: '',
    path: '/AvisLog'
  });

  useEffect(() => {
    const loadSyncConfig = async () => {
      const config = await getItem<{key: string, value: any}>('settings', 'webdavConfig');
      if (config) setSyncConfig(config.value);
    };
    loadSyncConfig();
  }, []);

  useEffect(() => {
    if (initialEditId) {
      const bird = species.find(s => s.id === initialEditId);
      if (bird) {
        openEdit(bird);
      }
      onClearEdit();
    }
  }, [initialEditId, species]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const openAdd = () => {
    setEditingBird(null);
    setFormData({
      name: '', latinName: '',
      taxonomy: { class: '鸟纲', order: '', family: '', genus: '', species: '' },
      distribution: [],
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (bird: BirdSpecies) => {
    setEditingBird(bird);
    setFormData({
      name: bird.name,
      latinName: bird.latinName,
      taxonomy: { ...bird.taxonomy },
      distribution: bird.distribution,
      description: bird.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.latinName) return showToast('请填写必填项', 'error');
    
    const bird: BirdSpecies = {
      id: editingBird ? editingBird.id : crypto.randomUUID(),
      ...formData,
      createdAt: editingBird ? editingBird.createdAt : Date.now()
    };

    await putItem('species', bird);
    onUpdate();
    setIsModalOpen(false);
    showToast(editingBird ? '物种资料已更新' : '新物种已录入资料库');
  };

  const handlePinUpdate = async (type: 'master' | 'admin') => {
    if (type === 'master') {
      if (pins.masterOld !== masterPin) return showToast('当前群主验证码不正确', 'error');
      if (pins.masterNew.length < 4) return showToast('验证码至少需要4位', 'error');
      await putItem('settings', { key: 'adminPin', value: pins.masterNew });
      showToast('群主管理验证码已更新');
      setPins({ ...pins, masterOld: '', masterNew: '' });
    } else {
      if (pins.adminNew.length < 4) return showToast('验证码至少需要4位', 'error');
      await putItem('settings', { key: 'collabPin', value: pins.adminNew });
      showToast('管理员协作码已成功设置');
      setPins({ ...pins, adminNew: '' });
    }
    onUpdate();
  };

  const handleSyncSave = async () => {
    await putItem('settings', { key: 'webdavConfig', value: syncConfig });
    showToast('同步设置已保存');
  };

  const toggleProvince = (p: string) => {
    setFormData(prev => ({
      ...prev,
      distribution: prev.distribution.includes(p) 
        ? prev.distribution.filter(item => item !== p) 
        : [...prev.distribution, p]
    }));
  };

  return (
    <div className="space-y-8 animate-in relative z-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] animate-bounce-in">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
            <CheckCircle2 size={20} />
            <span className="font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center serif-title text-slate-800">
            <Database className="mr-3 text-emerald-600" />
            资料与协作中心
          </h2>
          <p className="text-slate-500 mt-1">
            {authLevel === 'master' ? '管理全库资料与成员权限' : '您正在以管理员身份协助录入资料'}
          </p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'data' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'
            }`}
          >
            <BookOpen size={16} />
            <span>资料管理</span>
          </button>
          
          {authLevel === 'master' && (
            <>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'security' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'
                }`}
              >
                <Shield size={16} />
                <span>成员权限</span>
              </button>
              <button 
                onClick={() => setActiveTab('sync')}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all ${
                  activeTab === 'sync' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-white'
                }`}
              >
                <Cloud size={16} />
                <span>同步设置</span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={openAdd} className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
              <Plus size={18} />
              <span>录入新物种</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">物种名称</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400">分类 (目/科/属)</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-slate-400 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {species.sort((a,b) => b.createdAt - a.createdAt).map(s => (
                  <tr key={s.id} className="hover:bg-emerald-50/30 transition-all">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-xs italic text-slate-400 font-serif">{s.latinName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {[s.taxonomy.order, s.taxonomy.family, s.taxonomy.genus].map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openEdit(s)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => { if(confirm('确定删除？')) deleteItem('species', s.id).then(onUpdate); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'security' && authLevel === 'master' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-amber-50 rounded-2xl"><Lock className="text-amber-600" size={24} /></div>
              <h3 className="text-lg font-bold text-slate-800">修改群主验证码</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">当前验证码</label>
                <input type="password" placeholder="验证身份" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={pins.masterOld} onChange={e => setPins({...pins, masterOld: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">设置新验证码</label>
                <input type="password" placeholder="建议4-6位数字" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={pins.masterNew} onChange={e => setPins({...pins, masterNew: e.target.value})} />
              </div>
            </div>
            <button onClick={() => handlePinUpdate('master')} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center space-x-2">
              <Shield size={18} />
              <span>更新群主验证码</span>
            </button>
          </div>

          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-2xl"><UserPlus className="text-blue-600" size={24} /></div>
              <h3 className="text-lg font-bold text-slate-800">设置成员协作码</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              将协作码分享给您的鸟友。他们可以使用此码登录并协助录入资料库，但无法修改系统设置。
            </p>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">协作码</label>
              <input type="text" placeholder="如：123456" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-center text-lg tracking-widest" value={pins.adminNew} onChange={e => setPins({...pins, adminNew: e.target.value})} />
            </div>
            <button onClick={() => handlePinUpdate('admin')} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
              <UserPlus size={18} />
              <span>设置协作权限码</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'sync' && authLevel === 'master' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 rounded-2xl"><Cloud className="text-emerald-600" size={24} /></div>
                <div>
                  <h3 className="text-lg font-bold">WebDAV 云端同步</h3>
                  <p className="text-xs text-slate-400 mt-0.5">多设备协作与资料库自动同步方案</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>协作功能已就绪</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center"><Server size={14} className="mr-1" /> 服务器地址 (URL)</label>
                <input placeholder="https://dav.jianguoyun.com/dav/" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={syncConfig.url} onChange={e => setSyncConfig({...syncConfig, url: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center"><UserPlus size={14} className="mr-1" /> 用户名</label>
                <input placeholder="您的账号邮箱" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={syncConfig.username} onChange={e => setSyncConfig({...syncConfig, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center"><Key size={14} className="mr-1" /> 应用授权密码</label>
                <input type="password" placeholder="不是登录密码" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={syncConfig.password} onChange={e => setSyncConfig({...syncConfig, password: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 flex items-center"><FolderSync size={14} className="mr-1" /> 同步目录</label>
                <input placeholder="/AvisLog" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" value={syncConfig.path} onChange={e => setSyncConfig({...syncConfig, path: e.target.value})} />
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start space-x-3">
              <Info className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-xs text-blue-700 leading-relaxed">
                <b>协作提示：</b>当您配置 WebDAV 后，系统将自动在该目录下创建一个 <code>birds_db.json</code> 文件。其他管理员鸟友在自己的 App 中配置相同的 WebDAV 账号后，即可实现资料库的实时互联。
              </p>
            </div>

            <div className="flex space-x-4 mt-8">
              <button className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">测试连接</button>
              <button onClick={handleSyncSave} className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">保存并启用云同步</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl animate-in my-auto">
            <div className="flex items-center justify-between p-8 border-b">
              <h3 className="text-2xl font-bold serif-title text-slate-800">{editingBird ? '修正物种资料' : '录入新鸟种'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={28} /></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">中文名称</label>
                  <input placeholder="如：白鹡鸰" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">拉丁学名</label>
                  <input placeholder="如：Motacilla alba" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-serif italic focus:ring-2 focus:ring-emerald-500" value={formData.latinName} onChange={e => setFormData({...formData, latinName: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">目 (Order)</label>
                  <input placeholder="雀形目" className="p-3 bg-slate-50 border border-slate-100 rounded-xl w-full" value={formData.taxonomy.order} onChange={e => setFormData({...formData, taxonomy: {...formData.taxonomy, order: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">科 (Family)</label>
                  <input placeholder="鹡鸰科" className="p-3 bg-slate-50 border border-slate-100 rounded-xl w-full" value={formData.taxonomy.family} onChange={e => setFormData({...formData, taxonomy: {...formData.taxonomy, family: e.target.value}})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">属 (Genus)</label>
                  <input placeholder="鹡鸰属" className="p-3 bg-slate-50 border border-slate-100 rounded-xl w-full" value={formData.taxonomy.genus} onChange={e => setFormData({...formData, taxonomy: {...formData.taxonomy, genus: e.target.value}})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">理论分布区域</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-50 p-4 rounded-2xl">
                  {PROVINCES.map(p => (
                    <button key={p} onClick={() => toggleProvince(p)} className={`p-2 rounded-lg text-[10px] border transition-all font-bold ${formData.distribution.includes(p) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}>
                      {p.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">物种特征/习性描述</label>
                <textarea placeholder="输入该鸟种的典型识别特征..." className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            <div className="p-8 border-t flex space-x-4 bg-slate-50/50 rounded-b-[2rem]">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors">取消</button>
              <button onClick={handleSave} className="flex-1 py-4 font-bold bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2">
                <Save size={20} />
                <span>{editingBird ? '保存修改' : '确认入库'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
