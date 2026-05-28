// ============================================================
// IbibazoBihawe - Issues Management for Leaders
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { ArrowUpCircle, CheckCircle, Eye, Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  gutegereza:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  mu_gikorwa:       'bg-blue-100 text-blue-700 border-blue-200',
  yashyizwe_hejuru: 'bg-purple-100 text-purple-700 border-purple-200',
  yemejwe:          'bg-green-100 text-green-700 border-green-200',
  yanzwe:           'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  gutegereza: 'Gutegereza', mu_gikorwa: 'Mu Gikorwa',
  yashyizwe_hejuru: 'Yashyizwe Hejuru', yemejwe: 'Yakemutse', yanzwe: 'Yanzwe',
};

const INTERA_COLORS = {
  yoroheje: 'text-green-600', hagati: 'text-yellow-600',
  ikomeye: 'text-orange-600', byihutirwa: 'text-red-600 font-bold',
};

export default function IbibazoBihawe() {
  const [ibibazo, setIbibazo]   = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { umukoresha } = useAuthStore();

  useEffect(() => { fetchIbibazo(); }, [statusFilter]);

  const fetchIbibazo = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/ibibazo${params}`);
      setIbibazo(res.data.data);
    } catch {}
    setLoading(false);
  };

  const quickEscalate = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const reason = prompt('Sobanura impamvu yo gushyira hejuru:');
    if (!reason) return;
    try {
      await api.post(`/ibibazo/${id}/shyira-hejuru`, { ibisobanuro: reason });
      toast.success('Ikibazo cyashyizwe hejuru neza!');
      fetchIbibazo();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu gushyira hejuru.');
    }
  };

  const quickResolve = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const reason = prompt('Sobanura uko ikibazo gikemutse:');
    if (!reason) return;
    try {
      await api.post(`/ibibazo/${id}/emeza`, { ibisobanuro: reason });
      toast.success('Ikibazo gikemutse neza!');
      fetchIbibazo();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu kwemeza.');
    }
  };

  const filtered = ibibazo.filter(i =>
    i.umutwe?.toLowerCase().includes(search.toLowerCase()) ||
    i.ticket_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Shakisha ikibazo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">Status Yose</option>
          <option value="gutegereza">Gutegereza</option>
          <option value="mu_gikorwa">Mu Gikorwa</option>
          <option value="yashyizwe_hejuru">Yashyizwe Hejuru</option>
          <option value="yemejwe">Yakemutse</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Ibibazo ({filtered.length})</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nta bibazo uboneka</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nimero</th>
                  <th className="px-4 py-3 text-left">Umutwe</th>
                  <th className="px-4 py-3 text-left">Umuturage</th>
                  <th className="px-4 py-3 text-left">Icyiciro</th>
                  <th className="px-4 py-3 text-left">Intera</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Urwego</th>
                  <th className="px-4 py-3 text-left">Ibikorwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(ikibazo => (
                  <tr key={ikibazo.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{ikibazo.ticket_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 max-w-xs truncate">{ikibazo.umutwe}</p>
                      <p className="text-xs text-gray-400">{ikibazo.umudugudu_izina}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ikibazo.umuturage_amazina}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{ikibazo.icyiciro}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${INTERA_COLORS[ikibazo.intera]}`}>
                        {ikibazo.intera}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[ikibazo.status]}`}>
                        {STATUS_LABELS[ikibazo.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 capitalize">{ikibazo.urwego_rwahawe}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/umuyobozi/ikibazo/${ikibazo.id}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Reba">
                          <Eye size={15} />
                        </Link>
                        {ikibazo.status !== 'yemejwe' && ikibazo.status !== 'yanzwe' && (
                          <>
                            <button onClick={(e) => quickEscalate(ikibazo.id, e)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Shyira Hejuru">
                              <ArrowUpCircle size={15} />
                            </button>
                            <button onClick={(e) => quickResolve(ikibazo.id, e)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Emeza">
                              <CheckCircle size={15} />
                            </button>
                          </>
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
