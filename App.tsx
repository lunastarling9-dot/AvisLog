
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bird, 
  LayoutDashboard, 
  Map, 
  ClipboardList, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  Plus, 
  Download, 
  Upload,
  Search,
  Camera,
  Mic,
  Trash2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { AppView, BirdSpecies, Observation } from './types';
import { getAll, putItem, deleteItem, clearStore, getItem } from './db';
import Dashboard from './components/Dashboard';
import SpeciesCatalog from './components/SpeciesCatalog';
import Observations from './components/Observations';
import RegionalStats from './components/RegionalStats';
import AdminPanel from './components/AdminPanel';
import { DEFAULT_ADMIN_PIN } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [species, setSpecies] = useState<BirdSpecies[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [storedAdminPin, setStoredAdminPin] = useState(DEFAULT_ADMIN_PIN);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const fetchData = useCallback(async () => {
    const s = await getAll<BirdSpecies>('species');
    const o = await getAll<Observation>('observations');
    const pinSetting = await getItem<{key: string, value: string}>('settings', 'adminPin');
    
    setSpecies(s);
    setObservations(o);
    if (pinSetting) {
      setStoredAdminPin(pinSetting.value);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  const handleAdminAuth = () => {
    if (pinInput === storedAdminPin) {
      setIsAdmin(true);
      setIsPinModalOpen(false);
      setPinInput('');
      setView('admin');
    } else {
      alert('PIN 码错误');
      setPinInput('');
    }
  };

  const exportData = () => {
    const data = { species, observations, adminPin: storedAdminPin };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avislog_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.species && data.observations) {
          await clearStore('species');
          await clearStore('observations');
          for (const s of data.species) await putItem('species', s);
          for (const o of data.observations) await putItem('observations', o);
          if (data.adminPin) {
            await putItem('settings', { key: 'adminPin', value: data.adminPin });
          }
          alert('数据导入成功！');
          fetchData();
        }
      } catch (err) {
        alert('导入失败：文件格式不正确');
      }
    };
    reader.readAsText(file);
  };

  const NavItem: React.FC<{ target: AppView; icon: React.ReactNode; label: string }> = ({ target, icon, label }) => (
    <button
      onClick={() => setView(target)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        view === target 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Bird className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">AvisLog</h1>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem target="dashboard" icon={<LayoutDashboard size={20} />} label="仪表盘" />
            <NavItem target="species" icon={<Bird size={20} />} label="鸟种库" />
            <NavItem target="observations" icon={<ClipboardList size={20} />} label="观测记录" />
            <NavItem target="regions" icon={<Map size={20} />} label="区域探索" />
          </nav>

          <div className="mt-auto space-y-4">
            {!isOnline && (
              <div className="flex items-center justify-center space-x-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100">
                <WifiOff size={14} />
                <span>离线模式：AI功能受限</span>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100">
              {isAdmin ? (
                <button
                  onClick={() => setView('admin')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    view === 'admin' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <ShieldCheck size={20} />
                  <span className="font-medium">管理中心</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all"
                >
                  <ShieldCheck size={20} />
                  <span className="font-medium">管理员入口</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={exportData} className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                <Download size={18} />
                <span className="text-[10px] mt-1 uppercase tracking-wider font-bold">导出</span>
              </button>
              <label className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer">
                <Upload size={18} />
                <span className="text-[10px] mt-1 uppercase tracking-wider font-bold">导入</span>
                <input type="file" onChange={importData} className="hidden" accept=".json" />
              </label>
            </div>

            {isAdmin && (
              <button onClick={() => setIsAdmin(false)} className="w-full flex items-center justify-center space-x-2 py-2 text-slate-400 hover:text-rose-500 text-sm transition-all">
                <LogOut size={16} />
                <span>退出管理模式</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center space-x-3">
             <Bird className="w-6 h-6 text-emerald-600" />
             <span className="font-bold text-lg">AvisLog</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard species={species} observations={observations} />}
          {view === 'species' && <SpeciesCatalog species={species} />}
          {view === 'observations' && <Observations species={species} observations={observations} onUpdate={fetchData} />}
          {view === 'regions' && <RegionalStats species={species} observations={observations} />}
          {view === 'admin' && isAdmin && <AdminPanel species={species} onUpdate={fetchData} currentPin={storedAdminPin} />}
        </div>
      </main>

      {/* PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in">
            <h3 className="text-xl font-bold text-center mb-6">管理身份验证</h3>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="请输入 PIN 码"
                className="w-full px-4 py-4 text-center text-2xl tracking-[1em] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
              />
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsPinModalOpen(false)} className="py-3 font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-all">取消</button>
                <button onClick={handleAdminAuth} className="py-3 font-bold bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">验证</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
