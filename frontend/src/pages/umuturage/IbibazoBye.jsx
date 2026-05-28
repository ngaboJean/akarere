// ============================================================
// IbibazoBye - Issue Tracker with Timeline (Citizen)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Clock, CheckCircle, AlertCircle, ArrowUpCircle, XCircle, Plus, Filter } from 'lucide-react';

const STATUS_CONFIG = {
  gutegereza:       { label: 'Gutegereza',    color: 'bg-yellow-100 text-yellow-700', icon: Clock,          dot: 'bg-yellow-400' },
  mu_gikorwa:       { label: 'Mu Gikorwa',    color: 'bg-blue-100 text-blue-700',    icon: AlertCircle,    dot: 'bg-blue-400' },
  yashyizwe_hejuru: { label: 'Yashyizwe Hejuru', color: 'bg-purple-100 text-purple-700', icon: ArrowUpCircle, dot: 'bg-purple-400' },
  yemejwe:          { label: 'Yakemutse',     color: 'bg-green-100 text-green-700',  icon: CheckCircle,    dot: 'bg-green-400' },
  yanzwe:           { label: 'Yanzwe',        color: 'bg-red-100 text-red-700',      icon: XCircle,        dot: 'bg-red-400' },
  ifunzwe:          { label: 'Ifunzwe',       color: 'bg-gray-100 text-gray-600',    icon: XCircle,        dot: 'bg-gray-400' },
};

const URWEGO_LABELS = {
  umudugudu: "Umudugudu",
  akagari:   "Akagari",
  umurenge:  "Umurenge",
  akarere:   "Akarere",
};

export default function IbibazoBye() {
  const [ibibazo, setIbibazo]   = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [filter, setFilter]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchIbibazo();
  }, [filter]);

  const fetchIbibazo = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await api.get(`/ibibazo${params}`);
      setIbibazo(res.data.data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Ibibazo Byanjye</h3>
        <Link to="/umuturage/gutanga-ikibazo"
          className="flex items-center gap-1.5 bg-rwanda-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-900 transition">
          <Plus size={16} /> Ikibazo Gishya
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: 'Byose' },
          { value: 'gutegereza', label: 'Gutegereza' },
          { value: 'mu_gikorwa', label: 'Mu Gikorwa' },
          { value: 'yemejwe', label: 'Yakemutse' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${filter === f.value ? 'bg-rwanda-dark text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ibibazo.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Nta bibazo uboneka</p>
          <p className="text-gray-400 text-sm mt-1">Tangira gutanga ikibazo cyawe</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ibibazo.map(ikibazo => {
            const statusCfg = STATUS_CONFIG[ikibazo.status] || STATUS_CONFIG.gutegereza;
            const StatusIcon = statusCfg.icon;
            return (
              <div key={ikibazo.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => setSelected(selected?.id === ikibazo.id ? null : ikibazo)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{ikibazo.ticket_number}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 truncate">{ikibazo.umutwe}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>📍 {ikibazo.umudugudu_izina}</span>
                      <span>🏷️ {ikibazo.icyiciro}</span>
                      <span>📅 {new Date(ikibazo.created_at).toLocaleDateString('rw-RW')}</span>
                    </div>
                  </div>
                  {/* Progress Indicator */}
                  <div className="flex flex-col items-center gap-1">
                    {['umudugudu','akagari','umurenge','akarere'].map((level, i) => {
                      const levels = ['umudugudu','akagari','umurenge','akarere'];
                      const currentIdx = levels.indexOf(ikibazo.urwego_rwahawe);
                      const isReached = i <= currentIdx;
                      return (
                        <div key={level} className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${isReached ? 'bg-blue-500' : 'bg-gray-200'}`} />
                          {i < 3 && <div className={`w-0.5 h-3 ${isReached && i < currentIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded Timeline */}
                {selected?.id === ikibazo.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Inzira y'Ikibazo</p>
                    <div className="flex items-center gap-2">
                      {['umudugudu','akagari','umurenge','akarere'].map((level, i, arr) => {
                        const levels = ['umudugudu','akagari','umurenge','akarere'];
                        const currentIdx = levels.indexOf(ikibazo.urwego_rwahawe);
                        const isActive  = i === currentIdx;
                        const isReached = i <= currentIdx;
                        return (
                          <React.Fragment key={level}>
                            <div className={`flex flex-col items-center ${isActive ? 'scale-110' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition
                                ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                                  isReached ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {isReached && !isActive ? '✓' : i + 1}
                              </div>
                              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : isReached ? 'text-green-600' : 'text-gray-400'}`}>
                                {URWEGO_LABELS[level]}
                              </span>
                            </div>
                            {i < arr.length - 1 && (
                              <div className={`flex-1 h-0.5 mb-4 ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
