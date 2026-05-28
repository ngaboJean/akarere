// ============================================================
// IyandikishaPage - Register with Full Validation + NIDA
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { registerSchema } from '../../utils/validators';
import FormField, { ApiErrorAlert, PasswordStrength } from '../../components/ui/FormField';
import { CheckCircle, XCircle, Loader, UserPlus, Shield, AlertTriangle } from 'lucide-react';

// NIDA Status Component
function NidaStatus({ status, data }) {
  if (!status) return null;
  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <Loader size={16} className="animate-spin flex-shrink-0" />
        <span>Kugenzura indangamuntu na NIDA...</span>
      </div>
    );
  }
  if (status === 'valid' && data) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-green-800">Yemejwe na NIDA ✓</span>
        </div>
        <div className="ml-6 space-y-0.5 text-xs text-green-700">
          <p><span className="font-medium">Amazina:</span> {data.amazina}</p>
          <p><span className="font-medium">Amavuko:</span> {data.itariki_amavuko}</p>
          <p><span className="font-medium">Igitsina:</span> {data.igitsina}</p>
        </div>
      </div>
    );
  }
  if (status === 'invalid') {
    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
        <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-red-800">Indangamuntu ntiyemejwe</p>
          <p className="text-red-600 text-xs mt-0.5">
            Kugenzura neza indangamuntu yawe cyangwa vugana na NIDA.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function IyandikishaPage() {
  const [nidaStatus, setNidaStatus] = useState(null);
  const [nidaData,   setNidaData]   = useState(null);
  const [apiError,   setApiError]   = useState('');
  const [akarereList, setAkarereList] = useState([]);
  const [umurenge,    setUmurenge]    = useState([]);
  const [akagari,     setAkagari]     = useState([]);
  const [umudugudu,   setUmudugudu]   = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      intera: 'yoroheje',
    },
  });

  const indangamuntu   = watch('indangamuntu', '');
  const amazinaValue   = watch('amazina', '');
  const ijambo_banga   = watch('ijambo_banga', '');
  const selectedAkarere  = watch('akarere_id');
  const selectedUmurenge = watch('umurenge_id');
  const selectedAkagari  = watch('akagari_id');

  // Gufata Akarere
  useEffect(() => {
    api.get('/inzego/akarere')
      .then(r => setAkarereList(r.data.data))
      .catch(() => toast.error('Ntabwo bashije gufata akarere.'));
  }, []);

  // Cascading: Umurenge
  useEffect(() => {
    if (!selectedAkarere) return;
    setValue('umurenge_id', '');
    setValue('akagari_id', '');
    setValue('umudugudu_id', '');
    setUmurenge([]); setAkagari([]); setUmudugudu([]);
    api.get(`/inzego/umurenge?akarere_id=${selectedAkarere}`)
      .then(r => setUmurenge(r.data.data))
      .catch(() => {});
  }, [selectedAkarere]);

  // Cascading: Akagari
  useEffect(() => {
    if (!selectedUmurenge) return;
    setValue('akagari_id', '');
    setValue('umudugudu_id', '');
    setAkagari([]); setUmudugudu([]);
    api.get(`/inzego/akagari?umurenge_id=${selectedUmurenge}`)
      .then(r => setAkagari(r.data.data))
      .catch(() => {});
  }, [selectedUmurenge]);

  // Cascading: Umudugudu
  useEffect(() => {
    if (!selectedAkagari) return;
    setValue('umudugudu_id', '');
    setUmudugudu([]);
    api.get(`/inzego/umudugudu?akagari_id=${selectedAkagari}`)
      .then(r => setUmudugudu(r.data.data))
      .catch(() => {});
  }, [selectedAkagari]);

  // NIDA: Auto-genzura iyo indangamuntu yuzuye (imibare 16)
  useEffect(() => {
    if (/^\d{16}$/.test(indangamuntu) && indangamuntu.startsWith('1')) {
      genzuraIndangamuntu(indangamuntu);
    } else if (indangamuntu.length > 0 && indangamuntu.length < 16) {
      setNidaStatus(null);
      setNidaData(null);
      setValue('amazina', '', { shouldValidate: true });
    }
  }, [indangamuntu]);

  const genzuraIndangamuntu = async (id) => {
    setNidaStatus('checking');
    setNidaData(null);
    clearErrors('indangamuntu');
    try {
      const res = await api.post('/nida/genzura', { indangamuntu: id });
      if (res.data.success) {
        setNidaStatus('valid');
        setNidaData(res.data.data);
        // Auto-fill amazina avuye kuri NIDA only if user hasn't typed one.
        if (res.data.data?.amazina && !amazinaValue) {
          setValue('amazina', res.data.data.amazina, { shouldValidate: true });
        }
      } else {
        setNidaStatus('invalid');
        setNidaData(null);
        setValue('amazina', '', { shouldValidate: true });
        setError('indangamuntu', { message: res.data.message });
      }
    } catch (err) {
      setNidaStatus('invalid');
      setNidaData(null);
      setValue('amazina', '', { shouldValidate: true });
      const msg = err.response?.data?.message || 'Ikibazo mu kugenzura indangamuntu.';
      setError('indangamuntu', { message: msg });
    }
  };

  const onSubmit = async (data) => {
    // Kugenzura NIDA mbere yo kohereza
    if (nidaStatus !== 'valid') {
      toast.error('Genzura indangamuntu yawe na NIDA mbere yo gukomeza.');
      return;
    }

    setApiError('');
    setSubmitting(true);

    try {
      const payload = {
        indangamuntu: data.indangamuntu,
        telephone:    data.telephone,
        amazina:      data.amazina,
        ijambo_banga: data.ijambo_banga,
        email:        data.email || undefined,
        umudugudu_id: parseInt(data.umudugudu_id),
      };

      const res = await api.post('/auth/iyandikisha', payload);

      if (res.data.success) {
        toast.success('Konti yawe yashyizweho neza! Murakaza neza.');
        navigate('/');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors?.length) {
        // Gushyira amakosa kuri fields zikwiye
        errData.errors.forEach(e => {
          if (e.field) setError(e.field, { message: e.message });
        });
        setApiError(errData.errors[0]?.message || 'Kugenzura amakuru winjije.');
      } else {
        setApiError(errData?.message || 'Ikibazo mu kwiyandikisha. Gerageza nyuma.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectOptions = (list, placeholder) => [
    { value: '', label: placeholder, disabled: true },
    ...list.map(i => ({ value: String(i.id), label: i.izina })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rwanda-dark via-blue-900 to-rwanda-green py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-3">
            <Shield className="w-8 h-8 text-rwanda-dark" />
          </div>
          <h1 className="text-2xl font-bold text-white">Iyandikishe</h1>
          <p className="text-blue-200 text-sm mt-1">Fungura Konti ya System y'Ibanze 🇷🇼</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl p-5 sm:p-7 lg:p-10">
          <ApiErrorAlert error={apiError} onDismiss={() => setApiError('')} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4" noValidate>

            {/* ── NIDA Section ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                <Shield size={16} />
                Kugenzura Indangamuntu (NIDA) — Bisabwa
              </h3>

              <FormField
                label="Indangamuntu"
                name="indangamuntu"
                type="text"
                register={register}
                error={errors.indangamuntu?.message}
                required
                placeholder="Imibare 16 y'indangamuntu"
                maxLength={16}
                showCount
                inputMode="numeric"
                hint="Indangamuntu izagenzurwa na NIDA mu buryo bwikora"
              />

              <NidaStatus status={nidaStatus} data={nidaData} />

              {/* Manual retry button */}
              {nidaStatus === 'invalid' && (
                <button
                  type="button"
                  onClick={() => genzuraIndangamuntu(indangamuntu)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Gerageza nanone
                </button>
              )}
            </div>

            {/* ── Amazina ── */}
            <FormField
              label="Amazina Yuzuye"
              name="amazina"
              type="text"
              register={register}
              error={errors.amazina?.message}
              required
              placeholder="Amazina avuye kuri NIDA"
              autoComplete="name"
              hint="Amazina azuzurwa mu buryo bwikora nyuma yo kugenzura indangamuntu"
            />

            {/* ── Telefoni & Email ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Telefoni"
                name="telephone"
                type="tel"
                register={register}
                error={errors.telephone?.message}
                required
                placeholder="07XXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
                hint="Urugero: 0781234567"
              />
              <FormField
                label="Email (Ntibisabwa)"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
                placeholder="example@email.com"
                autoComplete="email"
              />
            </div>

            {/* ── Aho Utuye (Cascading) ── */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                📍 Aho Utuye — Bisabwa
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Akarere"
                  name="akarere_id"
                  type="select"
                  register={register}
                  error={errors.akarere_id?.message}
                  required
                  options={selectOptions(akarereList, 'Hitamo Akarere...')}
                />
                <FormField
                  label="Umurenge"
                  name="umurenge_id"
                  type="select"
                  register={register}
                  error={errors.umurenge_id?.message}
                  required
                  disabled={!selectedAkarere || umurenge.length === 0}
                  options={selectOptions(umurenge, umurenge.length ? 'Hitamo Umurenge...' : 'Hitamo Akarere mbere')}
                />
                <FormField
                  label="Akagari"
                  name="akagari_id"
                  type="select"
                  register={register}
                  error={errors.akagari_id?.message}
                  required
                  disabled={!selectedUmurenge || akagari.length === 0}
                  options={selectOptions(akagari, akagari.length ? 'Hitamo Akagari...' : 'Hitamo Umurenge mbere')}
                />
                <FormField
                  label="Umudugudu"
                  name="umudugudu_id"
                  type="select"
                  register={register}
                  error={errors.umudugudu_id?.message}
                  required
                  disabled={!selectedAkagari || umudugudu.length === 0}
                  options={selectOptions(umudugudu, umudugudu.length ? 'Hitamo Umudugudu...' : 'Hitamo Akagari mbere')}
                />
              </div>
            </div>

            {/* ── Ijambo Banga ── */}
            <div className="space-y-4">
              <div>
                <FormField
                  label="Ijambo Banga"
                  name="ijambo_banga"
                  type="password"
                  register={register}
                  error={errors.ijambo_banga?.message}
                  required
                  placeholder="Nibura inyuguti 8"
                  autoComplete="new-password"
                />
                <PasswordStrength password={ijambo_banga} />
              </div>

              <FormField
                label="Emeza Ijambo Banga"
                name="emeza_ijambo_banga"
                type="password"
                register={register}
                error={errors.emeza_ijambo_banga?.message}
                required
                placeholder="Subiramo ijambo banga"
                autoComplete="new-password"
              />
            </div>

            {/* ── NIDA Warning ── */}
            {nidaStatus !== 'valid' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Ugomba kugenzura indangamuntu yawe na NIDA mbere yo gukomeza kwiyandikisha.
                </p>
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={isSubmitting || nidaStatus !== 'valid'}
              className="w-full bg-rwanda-dark hover:bg-blue-900 text-white font-semibold py-3.5 px-6
                         rounded-xl flex items-center justify-center gap-2 transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <UserPlus size={20} />
              )}
              {isSubmitting ? 'Gutuma...' : 'Fungura Konti'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-500 text-sm">
              Usanzwe ufite konti?{' '}
              <Link to="/injira" className="text-blue-600 hover:text-blue-800 font-semibold transition">
                Injira hano
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
