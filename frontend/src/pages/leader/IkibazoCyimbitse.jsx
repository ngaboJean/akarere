// ============================================================
// IkibazoCyimbitse - Issue Detail + Internal Chat
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowUpCircle, CheckCircle, Send, ArrowLeft, Clock, User } from 'lucide-react';

export default function IkibazoCyimbitse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { umukoresha } = useAuthStore();
  const [ikibazo, setIkibazo]   = useState(null);
  const [message, setMessage]   = useState('');
  const [isLoading, setLoading] = useState(true);
  const [sending, setSending]   = useState(false);
  const chatRef = useRef(null);

  useEffect(() => { fetchIkibazo(); }, [id]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [ikibazo?.inyandiko]);

  const fetchIkibazo = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ibibazo/${id}`);
      setIkibazo(res.data.data);
    } catch { navigate('/umuyobozi/ibibazo'); }
    setLoading(false);
  };

  const handleEscalate = async () => {
    const reason = prompt('Sobanura impamvu yo gushyira hejuru:');
    if (!reason) return;
    try {
      await api.post(`/ibibazo/${id}/shyira-hejuru`, { ibisobanuro: reason });
      toast.success('Ikibazo cyashyizwe hejuru!');
      fetchIkibazo();
    } catch (err) { toast.error(err.response?.data?.message || 'Ikibazo.'); }
  };

  const handleResolve = async () => {
    const reason = prompt('Sobanura uko ikibazo gikemutse:');
    if (!reason) return;
    try {
      await api.post(`/ibibazo/${id}/emeza`, { ibisobanuro: reason });
      toast.success('Ikibazo gikemutse!');
      fetchIkibazo();
    } catch (err) { toast.error(err.response?.data?.message || 'Ikibazo.'); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/ibibazo/${id}/inyandiko`, { ubutumwa: message });
      setMessage('');
      fetchIkibazo();
    } catch { toast.error('Ikibazo mu kohereza ubutumwa.'); }
    setSending(false);
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ikibazo) return null;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button onClick={() => navigate('/umuyobozi/ibibazo')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition">
        <ArrowLeft size={16} /> Subira Inyuma
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issue Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-gray-400">{ikibazo.ticket_number}</span>
                <h2 className="text-xl font-bold text-gray-800 mt-1">{ikibazo.umutwe}</h2>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold
                ${ikibazo.status === 'yemejwe' ? 'bg-green-100 text-green-700' :
                  ikibazo.status === 'gutegereza' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'}`}>
                {ikibazo.status}
              </span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">{ikibazo.ibisobanuro}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Umuturage', value: ikibazo.umuturage_amazina },
                { label: 'Icyiciro',  value: ikibazo.icyiciro },
                { label: 'Intera',    value: ikibazo.intera },
                { label: 'Urwego',    value: ikibazo.urwego_rwahawe },
                { label: 'Umudugudu',value: ikibazo.umudugudu_izina },
                { label: 'Itariki',   value: new Date(ikibazo.created_at).toLocaleDateString('rw-RW') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-700 font-semibold mt-0.5 capitalize">{value}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {ikibazo.status !== 'yemejwe' && ikibazo.status !== 'yanzwe' && (
              <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
                <button onClick={handleEscalate}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition">
                  <ArrowUpCircle size={16} /> Shyira Hejuru
                </button>
                <button onClick={handleResolve}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition">
                  <CheckCircle size={16} /> Emeza / Kemura
                </button>
              </div>
            )}
          </div>

          {/* Action Log Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" /> Ibyakozwe (Audit Trail)
            </h3>
            <div className="space-y-3">
              {ikibazo.ibyakozwe?.map((log, i) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    {i < ikibazo.ibyakozwe.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{log.ukoreye_amazina}</span>
                      <span className="text-xs text-gray-400">({log.ukoreye_role})</span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">{log.igikorwa}</span>
                    </div>
                    {log.ibisobanuro && <p className="text-sm text-gray-600 mt-1">{log.ibisobanuro}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString('rw-RW')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Internal Chat */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Inyandiko z'Ibanga</h3>
            <p className="text-xs text-gray-400">Hagati y'Abayobozi gusa</p>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {!ikibazo.inyandiko?.length ? (
              <p className="text-center text-gray-400 text-sm py-8">Nta nyandiko zihari</p>
            ) : ikibazo.inyandiko.map(msg => {
              const isMe = msg.uwanditse_id === umukoresha?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-rwanda-dark text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 text-blue-600">{msg.uwanditse_amazina}</p>
                    )}
                    <p className="text-sm">{msg.ubutumwa}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Andika ubutumwa..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={sending || !message.trim()}
              className="w-9 h-9 bg-rwanda-dark hover:bg-blue-900 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
