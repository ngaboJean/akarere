// ============================================================
// Leader Dashboard - Village / Cell / Sector
// ============================================================
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Bell, FileText, CheckCircle, Clock, ArrowUpCircle, TrendingUp } from 'lucide-react';

const ROLE_LEVEL = {
  umukuru_umudugudu: { label: "Umudugudu", color: "from-green-700 to-green-900" },
  es_akagari:        { label: "Akagari",   color: "from-blue-700 to-blue-900" },
  es_umurenge:       { label: "Umurenge",  color: "from-purple-700 to-purple-900" },
};

export default function LeaderDashboard() {
  const { umukoresha } = useAuthStore();
  const [stats, setStats]         = useState({});
  const [notifications, setNotif] = useState([]);
  const [unread, setUnread]       = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const roleInfo = ROLE_LEVEL[umukoresha?.role_slug] || { label: 'Umuyobozi', color: 'from-gray-700 to-gray-900' };

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/ibibazo');
      const data = res.data.data;
      setStats({
        byose:            data.length,
        gutegereza:       data.filter(i => i.status === 'gutegereza').length,
        yemejwe:          data.filter(i => i.status === 'yemejwe').length,
        yashyizwe_hejuru: data.filter(i => i.status === 'yashyizwe_hejuru').length,
        mu_gikorwa:       data.filter(i => i.status === 'mu_gikorwa').length,
      });
    } catch {}
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
      <Sidebar basePath="/umuyobozi" />

      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className={`bg-gradient-to-r ${roleInfo.color} px-6 py-5 flex items-center justify-between`}>
          <div className="ml-12 lg:ml-0">
            <p className="text-white/70 text-sm">Dashboard ya {roleInfo.label}</p>
            <h2 className="text-xl font-bold text-white">{umukoresha?.amazina}</h2>
            <p className="text-white/60 text-xs mt-0.5">{umukoresha?.role_izina}</p>
          </div>

          {/* Notifications */}
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
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Ubutumwa ({unread} butasomwe)</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b border-gray-50 ${!n.yasomwe ? 'bg-blue-50' : ''}`}>
                      <p className="text-sm font-medium text-gray-800">{n.umutwe}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.ibisobanuro}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard icon={FileText}      color="gray"   label="Byose"            value={stats.byose || 0} />
            <StatCard icon={Clock}         color="yellow" label="Gutegereza"       value={stats.gutegereza || 0} />
            <StatCard icon={TrendingUp}    color="blue"   label="Mu Gikorwa"       value={stats.mu_gikorwa || 0} />
            <StatCard icon={ArrowUpCircle} color="purple" label="Yashyizwe Hejuru" value={stats.yashyizwe_hejuru || 0} />
            <StatCard icon={CheckCircle}   color="green"  label="Yakemutse"        value={stats.yemejwe || 0} />
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = {
    gray:   'bg-gray-50 text-gray-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
  };
  return (
    <div className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
