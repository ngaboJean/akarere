// ============================================================
// Citizen Dashboard - Portal y'Umuturage
// ============================================================
import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import { Bell, Plus, FileText, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function UmuturageDashboard() {
  const { umukoresha } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [stats, setStats] = useState({ byose: 0, gutegereza: 0, yemejwe: 0, mu_gikorwa: 0 });

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/ubutumwa');
      setNotifications(res.data.data.slice(0, 5));
      setUnread(res.data.bitasomwe);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/ibibazo');
      const data = res.data.data;
      setStats({
        byose:      data.length,
        gutegereza: data.filter(i => i.status === 'gutegereza').length,
        yemejwe:    data.filter(i => i.status === 'yemejwe').length,
        mu_gikorwa: data.filter(i => i.status === 'mu_gikorwa').length,
      });
    } catch {}
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar basePath="/umuturage" />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="ml-12 lg:ml-0">
            <h2 className="text-lg font-semibold text-gray-800">
              Murakaza neza, {umukoresha?.amazina?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-500 text-sm">Portal y'Umuturage</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition"
              >
                <Bell size={20} className="text-gray-600" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Ubutumwa</h3>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline"
                      onClick={() => api.put('/ubutumwa/soma-byose').then(fetchNotifications)}>
                      Soma byose
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">Nta butumwa bufite</p>
                    ) : notifications.map(n => (
                      <div key={n.id}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer
                          ${!n.yasomwe ? 'bg-blue-50' : ''}`}
                        onClick={() => api.put(`/ubutumwa/${n.id}/soma`).then(fetchNotifications)}>
                        <p className="text-sm font-medium text-gray-800">{n.umutwe}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.ibisobanuro}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action */}
            <Link to="/umuturage/gutanga-ikibazo"
              className="flex items-center gap-2 bg-rwanda-dark hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md">
              <Plus size={16} />
              <span className="hidden sm:inline">Gutanga Ikibazo</span>
            </Link>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={FileText}    color="blue"   label="Ibibazo Byose"    value={stats.byose} />
            <StatCard icon={Clock}       color="yellow" label="Gutegereza"       value={stats.gutegereza} />
            <StatCard icon={AlertCircle} color="orange" label="Mu Gikorwa"       value={stats.mu_gikorwa} />
            <StatCard icon={CheckCircle} color="green"  label="Yakemutse"        value={stats.yemejwe} />
          </div>

          {/* Page Content */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    green:  'bg-green-50 text-green-600 border-green-100',
  };
  return (
    <div className={`bg-white rounded-2xl p-4 border ${colors[color]} shadow-sm`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
