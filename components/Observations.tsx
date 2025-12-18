
import React, { useState, useRef } from 'react';
import { BirdSpecies, Observation } from '../types';
import { Plus, Search, Calendar, MapPin, Camera, Mic, X, Trash2, SlidersHorizontal, Sparkles, Play, Pause, Square } from 'lucide-react';
import { PROVINCES } from '../constants';
import { putItem, deleteItem } from '../db';
import { getBirdInsight } from '../geminiService';

interface ObservationsProps {
  species: BirdSpecies[];
  observations: Observation[];
  onUpdate: () => void;
}

const Observations: React.FC<ObservationsProps> = ({ species, observations, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [insight, setInsight] = useState<{id: string, text: string} | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Form states
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [province, setProvince] = useState('');
  const [location, setLocation] = useState('');
  const [count, setCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [speciesSearch, setSpeciesSearch] = useState('');

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  const filteredSpeciesForSearch = species.filter(s => 
    s.name.includes(speciesSearch) || s.latinName.toLowerCase().includes(speciesSearch.toLowerCase())
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setAudio(reader.result as string);
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSpeciesId || !province || !location) {
      alert('请填写完整信息');
      return;
    }

    const newObs: Observation = {
      id: crypto.randomUUID(),
      speciesId: selectedSpeciesId,
      date,
      province,
      location,
      count,
      notes,
      photo: photo || undefined,
      audio: audio || undefined,
      createdAt: Date.now()
    };

    await putItem('observations', newObs);
    onUpdate();
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSpeciesId('');
    setProvince('');
    setLocation('');
    setCount(1);
    setNotes('');
    setPhoto(null);
    setAudio(null);
    setSpeciesSearch('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('确认删除此观测记录？')) {
      await deleteItem('observations', id);
      onUpdate();
    }
  };

  const handleGetInsight = async (obs: Observation) => {
    const bird = species.find(s => s.id === obs.speciesId);
    if (!bird) return;
    
    setIsLoadingInsight(true);
    try {
      const text = await getBirdInsight(bird.name, obs.notes);
      setInsight({ id: obs.id, text });
    } finally {
      setIsLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">观测日志</h2>
          <p className="text-slate-500">记录您的每一次邂逅</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all font-bold"
        >
          <Plus size={20} />
          <span>添加观测</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {observations.sort((a, b) => b.createdAt - a.createdAt).map(obs => {
          const bird = species.find(s => s.id === obs.speciesId);
          const isUnexpected = bird && !bird.distribution.includes(obs.province);

          return (
            <div key={obs.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
              {obs.photo ? (
                <div className="h-48 relative">
                  <img src={obs.photo} className="w-full h-full object-cover" />
                  {isUnexpected && (
                    <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center">
                      <Sparkles size={10} className="mr-1" />
                      惊喜发现
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 bg-slate-50 flex items-center justify-center relative">
                   <BirdSpeciesPlaceholder isUnexpected={isUnexpected} />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{bird?.name || '未知鸟种'}</h4>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter italic">{bird?.latinName}</p>
                  </div>
                  <button onClick={() => handleDelete(obs.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center text-slate-600">
                    <Calendar size={14} className="mr-2 text-emerald-500" />
                    {obs.date}
                  </div>
                  <div className="flex items-center text-slate-600">
                    <MapPin size={14} className="mr-2 text-emerald-500" />
                    {obs.province} · {obs.location}
                  </div>
                  {obs.audio && (
                    <div className="mt-3 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                      <audio src={obs.audio} controls className="w-full h-8" />
                    </div>
                  )}
                  {obs.notes && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                      “{obs.notes}”
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                   {insight?.id === obs.id ? (
                     <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-700 leading-relaxed border border-emerald-100">
                        <span className="font-bold block mb-1">AI 见解:</span>
                        {insight.text}
                     </div>
                   ) : (
                     <button 
                        onClick={() => handleGetInsight(obs)} 
                        disabled={isLoadingInsight}
                        className="w-full py-2 flex items-center justify-center space-x-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        <span>{isLoadingInsight ? '思考中...' : '生成鸟类见解'}</span>
                     </button>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Observation Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in my-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">记录新发现</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">物种</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索资料库..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      value={speciesSearch}
                      onChange={(e) => setSpeciesSearch(e.target.value)}
                    />
                    {speciesSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                        {filteredSpeciesForSearch.map(s => (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedSpeciesId(s.id);
                              setSpeciesSearch(s.name);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-sm flex justify-between items-center"
                          >
                            <span className="font-bold">{s.name}</span>
                            <span className="text-xs text-slate-400 italic">{s.latinName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">观测日期</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">多媒体采集</label>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => photoInputRef.current?.click()}
                      className={`flex-1 flex items-center justify-center space-x-2 bg-slate-50 border border-dashed rounded-xl py-3 transition-all ${photo ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-300 text-slate-500'}`}
                    >
                      <Camera size={18} />
                      <span className="text-xs font-bold uppercase tracking-wider">{photo ? '重选照片' : '上传照片'}</span>
                    </button>
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex-1 flex items-center justify-center space-x-2 border border-dashed rounded-xl py-3 transition-all ${isRecording ? 'bg-rose-50 border-rose-500 text-rose-600' : audio ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-300 text-slate-500'}`}
                    >
                      {isRecording ? <Square size={16} className="recording-pulse" /> : <Mic size={18} />}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isRecording ? '停止录制' : audio ? '重录鸣声' : '录制鸣声'}
                      </span>
                    </button>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">省份</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  >
                    <option value="">请选择省份</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {(photo || audio) && (
                <div className="grid grid-cols-2 gap-4">
                  {photo && (
                    <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-100">
                      <img src={photo} className="w-full h-full object-cover" />
                      <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 p-1 bg-white/70 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {audio && (
                    <div className="relative h-32 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-4">
                      <Mic className="text-emerald-500 mb-2" size={20} />
                      <audio src={audio} controls className="w-full h-8 scale-90" />
                      <button onClick={() => setAudio(null)} className="absolute top-2 right-2 p-1 bg-white/70 rounded-full">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">地点详情与笔记</label>
                <div className="grid grid-cols-3 gap-4 mb-2">
                   <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="地点：如西溪湿地"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                   </div>
                   <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                  />
                </div>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="写下当下的心情或细节..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex space-x-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">取消</button>
                <button onClick={handleSave} className="flex-1 py-4 font-bold bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">保存观测</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BirdSpeciesPlaceholder: React.FC<{isUnexpected?: boolean}> = ({isUnexpected}) => (
  <div className="text-slate-200 flex flex-col items-center">
    <Search size={40} className="mb-2 opacity-20" />
    <span className="text-[10px] font-bold tracking-widest uppercase opacity-30">NO IMAGE RECORDED</span>
    {isUnexpected && (
      <div className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center">
        <Sparkles size={10} className="mr-1" />
        惊喜发现
      </div>
    )}
  </div>
);

export default Observations;
