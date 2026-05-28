// ============================================================
// InyandikoZibanga - Internal Messages Overview (Leaders)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { MessageSquare, ArrowRight, Clock } from 'lucide-react';

export default function InyandikoZibanga() {
  const [ibibazo, setIbibazo] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetchIbibazoWithMessages();
  }, []);

  const fetchIbibazoWithMessages = async () => {
    setLoading(true);
    try {
      // Gufata ibibazo bifite inyandiko
      const res = await api.get('/ibibazo?status=mu_gikorwa');
      setIbibazo(res.data.data);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-600" />
        Inyandiko z'Ibanga
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        💬 Inyandiko z'ibanga ziri mu kibazo kimwe na kimwe. Kanda "Reba" kugira ngo uboneke inyandiko.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ibibazo.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nta nyandiko zihari</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ibibazo.map(ikibazo => (
            <div key={ikibazo.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{ikibazo.umutwe}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span className="font-mono">{ikibazo.ticket_number}</span>
                    <span>•</span>
                    <span>{ikibazo.umuturage_amazina}</span>
                    <span>•</span>
                    <Clock size={11} />
                    <span>{new Date(ikibazo.updated_at).toLocaleDateString('rw-RW')}</span>
                  </div>
                </div>
              </div>
              <Link
                to={`/umuyobozi/ikibazo/${ikibazo.id}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-rwanda-dark text-white rounded-xl text-xs font-medium hover:bg-blue-900 transition"
              >
                Reba <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
