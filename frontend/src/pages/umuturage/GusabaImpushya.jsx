// ============================================================
// GusabaImpushya - Certificate Request (Citizen)
// ============================================================
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Shield, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';

const UBWOKO_CERT = [
  { value: 'ubuturage',   label: '🏠 Indangagaciro y\'Ubuturage',  desc: 'Proof of Residence' },
  { value: 'ubukene',     label: '💙 Indangagaciro y\'Ubukene',    desc: 'Poverty Certificate' },
  { value: 'ubuzima',     label: '🏥 Indangagaciro y\'Ubuzima',    desc: 'Health Certificate' },
  { value: 'ubutaka',     label: '🌍 Indangagaciro y\'Ubutaka',    desc: 'Land Certificate' },
  { value: 'indangamuntu',label: '🪪 Indangamuntu Nshya',          desc: 'New ID Request' },
  { value: 'ibindi',      label: '📋 Ibindi',                      desc: 'Other' },
];

export default function GusabaImpushya() {
  const [impushya, setImpushya]   = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchImpushya(); }, []);

  const fetchImpushya = async () => {
    try {
      const res = await api.get('/impushya');
      setImpushya(res.data.data);
    } catch {}
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await api.post('/impushya', data);
      if (res.data.success) {
        toast.success(`Gusaba impushya byagenze neza! Nimero: ${res.data.data.cert_number}`);
        reset();
        setShowForm(false);
        fetchImpushya();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ikibazo mu gusaba impushya.');
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = {
    gutegereza: { label: 'Gutegereza', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    yemejwe:    { label: 'Yemejwe',    color: 'bg-green-100 text-green-700',   icon: CheckCircle },
    yanzwe:     { label: 'Yanzwe',     color: 'bg-red-100 text-red-700',       icon: XCircle },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Impushya Zanjye</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-rwanda-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-900 transition">
          <Plus size={16} /> Saba Impushya
        </button>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-4">Gusaba Impushya Nshya</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ubwoko bw'Impushya</label>
              <div className="grid grid-cols-2 gap-2">
                {UBWOKO_CERT.map(({ value, label, desc }) => (
                  <label key={value}
                    className="flex items-start gap-2 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                    <input type="radio" value={value} className="mt-0.5"
                      {...register('ubwoko', { required: 'Hitamo ubwoko bw\'impushya.' })} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {errors.ubwoko && <p className="text-red-500 text-xs mt-1">{errors.ubwoko.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ibisobanuro (Ntibisabwa)</label>
              <textarea rows={3} placeholder="Sobanura impamvu usaba iyi mpushya..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                {...register('ibisobanuro')} />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={isLoading}
                className="flex-1 bg-rwanda-dark text-white py-3 rounded-xl font-medium hover:bg-blue-900 transition disabled:opacity-60">
                {isLoading ? 'Gutuma...' : 'Ohereza Gusaba'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
                Reka
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Impushya List */}
      {impushya.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <Shield size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nta mpushya usabye</p>
        </div>
      ) : (
        <div className="space-y-3">
          {impushya.map(cert => {
            const cfg = statusConfig[cert.status];
            const Icon = cfg.icon;
            return (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400">{cert.cert_number}</p>
                  <p className="font-semibold text-gray-800 mt-0.5">
                    {UBWOKO_CERT.find(u => u.value === cert.ubwoko)?.label || cert.ubwoko}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(cert.created_at).toLocaleDateString('rw-RW')}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                  <Icon size={14} />
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
