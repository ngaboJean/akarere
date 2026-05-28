// ============================================================
// Abakoresha Page - User Management (District Admin)
// ============================================================
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Search, Shield, CheckCircle, XCircle, Edit2 } from 'lucide-react';

const ROLE_COLORS = {
  umuturage:          'bg-gray-100 text-gray-700',
  umukuru_umudugudu:  'bg-green-100 text-green-700',
  es_akagari:         'bg-blue-100 text-blue-700',
  es_umurenge:        'bg-purple-100 text-purple-700',
  admin_akarere:      'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

export default function AbakoreshaPage() {
  const [abakoresha, setAbakoresha] = useState([]);
  const [isLoading, setLoading]     = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [roles, setRoles]           = useState([]);
  const [editUser, setEditUser]     = useState(null);

  useEffect(() => {
    fetchAbakoresha();
    fetchRoles();
  }, [roleFilter]);

  const fetchAbakoresha = async () => {
    setLoading(true);
    try {
      const params = roleFilter ? `?role_id=${roleFilter}` : '';
      const res = await api.get(`/abakoresha${params}`);
      setAbakoresha(res.data.data);
    } catch {}
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      // Roles ziri mu database
      setRoles([
        { id: 1, izina: "Umuturage",            slug: "umuturage" },
        { id: 2, izina: "Umukuru w'Umudugudu",  slug: "umukuru_umudugudu" },
        { id: 3, izina: "ES w'Akagari",          slug: "es_akagari" },
        { id: 4, izina: "ES w'Umurenge",         slug: "es_umurenge" },
        { id: 5, izina: "Umuyobozi w'Akarere",   slug: "admin_akarere" },
      ]);
    } catch {}
  };

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/abakoresha/${id}/status`, { status });
      toast.success('Status yahindutse neza.');
      fetchAbakoresha();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu guhindura status.');
    }
  };

  const changeRole = async (id, role_id) => {
    try {
      await api.put(`/abakoresha/${id}/role`, { role_id });
      toast.success('Uruhare rwahinduwe neza.');
      setEditUser(null);
      fetchAbakoresha();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu guhindura uruhare.');
    }
  };

  const filtered = abakoresha.filter(u =>
    u.amazina?.toLowerCase().includes(search.toLowerCase()) ||
    u.indangamuntu?.includes(search) ||
    u.telephone?.includes(search)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          Abakoresha ({filtered.length})
        </h3>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Shakisha amazina, indangamuntu, telefoni..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">Inzego Zose</option>
          {roles.map(r => (
            <option key={r.id} value={r.id}>{r.izina}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Nta bakoresha uboneka</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Amazina</th>
                  <th className="px-4 py-3 text-left">Indangamuntu</th>
                  <th className="px-4 py-3 text-left">Telefoni</th>
                  <th className="px-4 py-3 text-left">Uruhare</th>
                  <th className="px-4 py-3 text-left">Aho Atuye</th>
                  <th className="px-4 py-3 text-left">NIDA</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ibikorwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${ROLE_COLORS[user.role_slug]?.replace('bg-', 'bg-').replace('text-', '') || 'bg-gray-400'}`}
                          style={{ background: '#1a2e44' }}>
                          {user.amazina?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.amazina}</p>
                          <p className="text-xs text-gray-400">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.indangamuntu}</td>
                    <td className="px-4 py-3 text-gray-600">{user.telephone}</td>
                    <td className="px-4 py-3">
                      {editUser === user.id ? (
                        <select
                          defaultValue={roles.find(r => r.slug === user.role_slug)?.id}
                          onChange={e => changeRole(user.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onBlur={() => setEditUser(null)}
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.izina}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role_slug] || 'bg-gray-100 text-gray-600'}`}>
                          {user.role_izina}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <p>{user.umudugudu || '—'}</p>
                      <p className="text-gray-400">{user.akagari}</p>
                    </td>
                    <td className="px-4 py-3">
                      {user.nida_verified ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle size={14} /> Yemejwe
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs">
                          <XCircle size={14} /> Ntiyemejwe
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditUser(editUser === user.id ? null : user.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Hindura Uruhare"
                        >
                          <Edit2 size={14} />
                        </button>
                        {user.status === 'active' ? (
                          <button
                            onClick={() => changeStatus(user.id, 'suspended')}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition text-xs font-medium"
                            title="Hagarika"
                          >
                            <XCircle size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => changeStatus(user.id, 'active')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Fungura"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
