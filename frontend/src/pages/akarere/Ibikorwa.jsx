// ============================================================
// Ibikorwa Page - Government Projects Management
// ============================================================
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FolderOpen, Plus, TrendingUp, Calendar, DollarSign, X } from 'lucide-react';

const STATUS_COLORS = {
  gutegurwa:     'bg-gray-100 text-gray-600',
  mu_gikorwa:    'bg-blue-100 text-blue-700',
  byarangiye:    'bg-green-100 text-green-700',
  byahagaritswe: 'bg-red-100 text-red-700',
};

const STATUS_LABELS = {
  gutegurwa:     'Gutegurwa',
  mu_gikorwa:    'Mu Gikorwa',
  byarangiye:    'Byarangiye',
  byahagaritswe: 'Byahagaritswe',
};

export default function IbikorwaPage() {
  const [ibikorwa, setIbikorwa]   = useState([]);
  const [umurenge, setUmurenge]   = useState([]);
  const [isLoading, setLoading]   = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [isSubmitting, setSubmit] = useState(false);
  const [editProgress, setEditProgress] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchIbikorwa();
    fetchUmurenge();
  }, []);

  const fetchIbikorwa = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ibikorwa');
      setIbikorwa(res.data.data);
    } catch {}
    setLoading(false);
  };

  const fetchUmurenge = async () => {
    try {
      // Gufata umurenge w'akarere - tukoresha akarere_id y'umukoresha
      const userRes = await api.get('/auth/jye');
      const akarereId = userRes.data.data.akarere_id;
      const res = await api.get(`/inzego/umurenge?akarere_id=${akarereId}`);
      setUmurenge(res.data.data);
    } catch {}
  };

  const onSubmit = async (data) => {
    setSubmit(true);
    try {
      await api.post('/ibikorwa', data);
      toast.success('Umushinga washyizweho neza!');
      reset();
      setShowForm(false);
      fetchIbikorwa();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu gushyiraho umushinga.');
    } finally {
      setSubmit(false);
    }
  };

  const updateProgress = async (id, aho_bigeze, status) => {
    try {
      await api.put(`/ibikorwa/${id}/progress`, { aho_bigeze, status });
      toast.success('Aho bigeze buvuguruwe!');
      setEditProgress(null);
      fetchIbikorwa();
    } catch {
      toast.error('Ikibazo mu kuvugurura.');
    }
  };

  const formatFRW = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('rw-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FolderOpen size={20} className="text-blue-600" />
          Ibikorwa rya Leta ({ibikorwa.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-rwanda-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-900 transition"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Funga' : 'Umushinga Mushya'}
        </button>
      </div>

      {/* New Project Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4">Shyiraho Umushinga Mushya</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Izina ry'Umushinga *</label>
                <input
                  type="text"
                  placeholder="Urugero: Kubaka Inzira ya Remera..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.izina ? 'border-red-400' : 'border-gray-200'}`}
                  {...register('izina', { required: 'Shyiramo izina ry\'umushinga.' })}
                />
                {errors.izina && <p className="text-red-500 text-xs mt-1">{errors.izina.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icyiciro</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  {...register('icyiciro')}
                >
                  <option value="ibikorwa_remezo">🏗️ Ibikorwa Remezo</option>
                  <option value="uburezi">📚 Uburezi</option>
                  <option value="ubuzima">🏥 Ubuzima</option>
                  <option value="ubuhinzi">🌾 Ubuhinzi</option>
                  <option value="ibindi">📋 Ibindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Umurenge</label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  {...register('umurenge_id')}
                >
                  <option value="">Akarere Yose</option>
                  {umurenge.map(u => (
                    <option key={u.id} value={u.id}>{u.izina}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingenzi (RWF)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('ingenzi')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Itariki Itangira</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('itariki_itangira')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Itariki Irangira</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('itariki_irangira')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ibisobanuro</label>
                <textarea
                  rows={3}
                  placeholder="Sobanura umushinga..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  {...register('ibisobanuro')}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-rwanda-dark text-white py-3 rounded-xl font-medium hover:bg-blue-900 transition disabled:opacity-60"
              >
                {isSubmitting ? 'Gutuma...' : 'Shyiraho Umushinga'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); reset(); }}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
              >
                Reka
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ibikorwa.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <FolderOpen size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nta bikorwa bihari</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ibikorwa.map(proj => (
            <div key={proj.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{proj.izina}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{proj.icyiciro}</p>
                </div>
                <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[proj.status]}`}>
                  {STATUS_LABELS[proj.status]}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Aho Bigeze</span>
                  <span className="text-xs font-bold text-gray-700">{proj.aho_bigeze || 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500
                      ${proj.aho_bigeze >= 100 ? 'bg-green-500' :
                        proj.aho_bigeze >= 60 ? 'bg-blue-500' :
                        proj.aho_bigeze >= 30 ? 'bg-yellow-500' : 'bg-red-400'}`}
                    style={{ width: `${proj.aho_bigeze || 0}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <DollarSign size={12} className="text-green-500" />
                  <span>{formatFRW(proj.ingenzi)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-blue-500" />
                  <span>{proj.itariki_irangira ? new Date(proj.itariki_irangira).toLocaleDateString('rw-RW') : '—'}</span>
                </div>
                {proj.umurenge_izina && (
                  <div className="col-span-2 text-gray-400">
                    📍 {proj.umurenge_izina}
                  </div>
                )}
              </div>

              {/* Update Progress */}
              {editProgress === proj.id ? (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" defaultValue={proj.aho_bigeze || 0}
                      id={`progress-${proj.id}`}
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-xs font-bold text-gray-700 w-8">
                      {proj.aho_bigeze || 0}%
                    </span>
                  </div>
                  <select
                    id={`status-${proj.id}`}
                    defaultValue={proj.status}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="gutegurwa">Gutegurwa</option>
                    <option value="mu_gikorwa">Mu Gikorwa</option>
                    <option value="byarangiye">Byarangiye</option>
                    <option value="byahagaritswe">Byahagaritswe</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const progress = document.getElementById(`progress-${proj.id}`).value;
                        const status   = document.getElementById(`status-${proj.id}`).value;
                        updateProgress(proj.id, parseInt(progress), status);
                      }}
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                    >
                      Vugurura
                    </button>
                    <button
                      onClick={() => setEditProgress(null)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition"
                    >
                      Reka
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditProgress(proj.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-xs text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition"
                >
                  <TrendingUp size={13} />
                  Vugurura Aho Bigeze
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
