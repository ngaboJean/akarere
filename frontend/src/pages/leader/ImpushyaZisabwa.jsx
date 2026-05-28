// ============================================================
// ImpushyaZisabwa - Certificate Requests Management (Leaders)
// ============================================================
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

const UBWOKO_LABELS = {
  indangamuntu: '🪪 Indangamuntu Nshya',
  ubutaka:      '🌍 Indangagaciro y\'Ubutaka',
  ubuzima:      '🏥 Indangagaciro y\'Ubuzima',
  ubuturage:    '🏠 Indangagaciro y\'Ubuturage',
  ubukene:      '💙 Indangagaciro y\'Ubukene',
  ibindi:       '📋 Ibindi',
};

export default function ImpushyaZisabwa() {
  const [impushya, setImpushya] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('');

  useEffect(() => { fetchImpushya(); }, [filter]);

  const fetchImpushya = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/impushya${params}`);
      setImpushya(res.data.data);
    } catch {}
    setLoading(false);
  };

  const emeza = async (id) => {
    if (!window.confirm('Emeza impushya iyi?')) return;
    try {
      await api.put(`/impushya/${id}/emeza`);
      toast.success('Impushya yemejwe neza!');
      fetchImpushya();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu kwemeza.');
    }
  };

  const anze = async (id) => {
    if (!window.confirm('Anza impushya iyi?')) return;
    try {
      await api.put(`/impushya/${id}/anze`);
      toast.success('Impushya yanzwe.');
      fetchImpushya();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu kwanga.');
    }
  };

  const filtered = impushya.filter(c =>
    c.umuturage_amazina?.toLowerCase().includes(search.toLowerCase()) ||
    c.cert_number?.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    gutegereza: { label: 'Gutegereza', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    yemejwe:    { label: 'Yemejwe',    color: 'bg-green-100 text-green-700',   icon: CheckCircle },
    yanzwe:     { label: 'Yanzwe',     color: 'bg-red-100 text-red-700',       icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <Shield size={20} className="text-blue-600" />
        Impushya Zisabwa ({filtered.length})
      </h3>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Shakisha amazina cyangwa nimero..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['', 'gutegereza', 'yemejwe', 'yanzwe'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition
                ${filter === s ? 'bg-rwanda-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {s === '' ? 'Byose' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nta mpushya uboneka</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nimero</th>
                  <th className="px-4 py-3 text-left">Umuturage</th>
                  <th className="px-4 py-3 text-left">Ubwoko</th>
                  <th className="px-4 py-3 text-left">Umudugudu</th>
                  <th className="px-4 py-3 text-left">Itariki</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ibikorwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(cert => {
                  const cfg = statusConfig[cert.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={cert.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{cert.cert_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{cert.umuturage_amazina}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{UBWOKO_LABELS[cert.ubwoko] || cert.ubwoko}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{cert.umudugudu_izina}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(cert.created_at).toLocaleDateString('rw-RW')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cert.status === 'gutegereza' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => emeza(cert.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition"
                            >
                              <CheckCircle size={12} /> Emeza
                            </button>
                            <button
                              onClick={() => anze(cert.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition"
                            >
                              <XCircle size={12} /> Anza
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
