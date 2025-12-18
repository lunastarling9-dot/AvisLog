
import React from 'react';
import { BirdSpecies, Observation } from '../types';
import { Bird, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PROVINCES } from '../constants';

interface DashboardProps {
  species: BirdSpecies[];
  observations: Observation[];
}

const Dashboard: React.FC<DashboardProps> = ({ species, observations }) => {
  const recentObs = [...observations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  
  // Stats calculation
  const totalSpeciesFound = new Set(observations.map(o => o.speciesId)).size;
  const provincesTouched = new Set(observations.map(o => o.province)).size;
  
  // Chart data: Top 5 provinces
  const provinceStats = PROVINCES.map(p => ({
    name: p.replace('市', '').replace('省', '').replace('自治区', '').replace('特别行政区', ''),
    count: observations.filter(o => o.province === p).length
  })).sort((a, b) => b.count - a.count).slice(0, 8).filter(p => p.count > 0);

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">欢迎回来，观察者</h2>
          <p className="text-slate-500 mt-1">这是您的个人鸟类观测概览</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 rounded-2xl">
            <Bird className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">已解锁鸟种</p>
            <p className="text-2xl font-bold">{totalSpeciesFound} / {species.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 rounded-2xl">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">探索省份</p>
            <p className="text-2xl font-bold">{provincesTouched} / 34</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-amber-50 rounded-2xl">
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">累计观测次数</p>
            <p className="text-2xl font-bold">{observations.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <MapPin className="mr-2 text-emerald-600" size={20} />
            观测热度排行
          </h3>
          <div className="h-64 w-full">
            {provinceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={provinceStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {provinceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p>暂无地理观测数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <Calendar className="mr-2 text-emerald-600" size={20} />
            最近观测
          </h3>
          <div className="space-y-4">
            {recentObs.length > 0 ? recentObs.map(obs => {
              const bird = species.find(s => s.id === obs.speciesId);
              return (
                <div key={obs.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group transition-all hover:bg-emerald-50">
                  <div className="flex items-center space-x-4">
                    {obs.photo ? (
                      <img src={obs.photo} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-300">
                        <Bird size={24} />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{bird?.name || '未知鸟种'}</p>
                      <p className="text-xs text-slate-500">{obs.province} · {obs.location}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-white px-3 py-1 rounded-full group-hover:text-emerald-600">
                    {obs.date}
                  </span>
                </div>
              );
            }) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <p>开启您的第一次观测吧</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
