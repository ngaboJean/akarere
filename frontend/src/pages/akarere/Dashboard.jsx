// ============================================================
// District Master Dashboard - Akarere (Analytics + Charts)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import {
  Users, FileText, CheckCircle, TrendingUp, Star,
  FolderOpen, AlertCircle, ArrowUpCircle, Bell
} from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16'];

export default function AkarareDashboard() {
  const { umukoresha } = useAuthStore();
  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [notifications, setNotif] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread]     = useState(0);

  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/raporo/dashboard');
      setData(res.data.data);
    } catch {}
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/ubutumwa');
      setNotif(res.data.data.slice(0, 5));
      setUnread(res.data.bitasomwe);
    } catch {}
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar basePath="/akarere" />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-gradient-to-r from-rwanda-dark to-blue-900 px-6 py-5 flex items-center justify-between">
          <div className="ml-12 lg:ml-0">
            <p className="text-white/60 text-sm">Dashboard y'Akarere</p>
            <h2 className="text-xl font-bold text-white">{umukoresha?.amazina}</h2>
            <p className="text-white/50 text-xs">Umuyobozi w'Akarere 🇷🇼</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotif(!showNotif)}
              className="relative w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition">
              <Bell size={20} className="text-white" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {showNotif && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Ubutumwa</h3>
                </div>
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b border-gray-50 text-sm ${!n.yasomwe ? 'bg-blue-50' : ''}`}>
                    <p className="font-medium text-gray-800">{n.umutwe}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.ibisobanuro}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data ? (
            <DashboardContent data={data} />
          ) : null}

          <Outlet />
        </div>
      </main>
    </div>
  );
}

function DashboardContent({ data }) {
  const { statistike, byIcyiciro, byUmurenge, trend, satisfaction, ibikorwa, abakoresha_bashya } = data;

  const resolutionRate = statistike.byose > 0
    ? Math.round((statistike.yemejwe / statistike.byose) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={FileText} color="blue"
          label="Ibibazo Byose" value={statistike.byose}
          sub={`${statistike.gutegereza} gutegereza`}
        />
        <KPICard
          icon={CheckCircle} color="green"
          label="Yakemutse" value={statistike.yemejwe}
          sub={`${resolutionRate}% rate`}
        />
        <KPICard
          icon={Star} color="yellow"
          label="Gusuzuma Hagati"
          value={satisfaction.average_rating ? `${parseFloat(satisfaction.average_rating).toFixed(1)}/5` : 'N/A'}
          sub={`${satisfaction.total_ratings || 0} amasuzuma`}
        />
        <KPICard
          icon={Users} color="purple"
          label="Abakoresha Bashya" value={abakoresha_bashya}
          sub="Iminsi 7 ishize"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issues by Sector Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Ibibazo bya buri Umurenge</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byUmurenge} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="umurenge" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="byose"     name="Byose"     fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="yakemutse" name="Yakemutse" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="gutegereza" name="Gutegereza" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issues by Category Pie Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Ibibazo bitewe n'Icyiciro</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={byIcyiciro} dataKey="umubare" nameKey="icyiciro"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {byIcyiciro.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {byIcyiciro.slice(0, 5).map((item, i) => (
                <div key={item.icyiciro} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-600 truncate capitalize">{item.icyiciro}</span>
                  <span className="text-xs font-bold text-gray-800 ml-auto">{item.umubare}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Trend y'Ibibazo (Iminsi 30 Ishize)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorIbibazo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="itariki" tick={{ fontSize: 10 }}
              tickFormatter={v => new Date(v).toLocaleDateString('rw-RW', { month: 'short', day: 'numeric' })} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              labelFormatter={v => new Date(v).toLocaleDateString('rw-RW')}
            />
            <Area type="monotone" dataKey="umubare" name="Ibibazo" stroke="#3b82f6" fill="url(#colorIbibazo)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projects & Resolution Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ongoing Projects */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Ibikorwa rya Leta</h3>
            <FolderOpen size={18} className="text-gray-400" />
          </div>
          {ibikorwa.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Nta bikorwa bihari</p>
          ) : (
            <div className="space-y-3">
              {ibikorwa.map(proj => (
                <div key={proj.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-800 text-sm truncate">{proj.izina}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${proj.status === 'mu_gikorwa' ? 'bg-blue-100 text-blue-700' :
                        proj.status === 'byarangiye' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'}`}>
                      {proj.status}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${proj.aho_bigeze || 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{proj.aho_bigeze || 0}% byarangiye</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolution Rate by Sector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Intera yo Gukemura bya buri Umurenge</h3>
          <div className="space-y-3">
            {byUmurenge.map(um => {
              const rate = um.byose > 0 ? Math.round((um.yakemutse / um.byose) * 100) : 0;
              return (
                <div key={um.umurenge}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{um.umurenge}</span>
                    <span className={`text-sm font-bold ${rate >= 70 ? 'text-green-600' : rate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all
                      ${rate >= 70 ? 'bg-green-500' : rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{um.yakemutse}/{um.byose} yakemutse</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, color, label, value, sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  };
  const c = colors[color];
  return (
    <div className={`bg-white rounded-2xl p-5 border ${c.border} shadow-sm`}>
      <div className={`w-11 h-11 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-3`}>
        <Icon size={22} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
