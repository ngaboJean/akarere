// ============================================================
// GutangaIkibazo - Submit Issue (Full Validation)
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { createIssueSchema, validateFiles } from '../../utils/validators';
import FormField, { ApiErrorAlert } from '../../components/ui/FormField';
import { Send, Upload, MapPin, AlertTriangle, X, FileText, Image } from 'lucide-react';

const ICYICIRO_OPTIONS = [
  { value: '',                label: 'Hitamo icyiciro...',          disabled: true },
  { value: 'umutekano',       label: '🔒 Umutekano (Security)' },
  { value: 'isuku',           label: '🧹 Isuku (Sanitation)' },
  { value: 'imibereho',       label: '❤️ Imibereho (Social Welfare)' },
  { value: 'ibikorwa_remezo', label: '🏗️ Ibikorwa Remezo (Infrastructure)' },
  { value: 'uburezi',         label: '📚 Uburezi (Education)' },
  { value: 'ubuzima',         label: '🏥 Ubuzima (Health)' },
  { value: 'ubuhinzi',        label: '🌾 Ubuhinzi (Agriculture)' },
  { value: 'ibindi',          label: '📋 Ibindi (Other)' },
];

const INTERA_OPTIONS = [
  { value: 'yoroheje',   label: '🟢 Yoroheje',   bg: 'bg-green-50  border-green-300  text-green-700' },
  { value: 'hagati',     label: '🟡 Hagati',     bg: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { value: 'ikomeye',    label: '🟠 Ikomeye',    bg: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'byihutirwa', label: '🔴 Byihutirwa', bg: 'bg-red-50    border-red-300    text-red-700' },
];

export default function GutangaIkibazo() {
  const [files,     setFiles]     = useState([]);
  const [fileError, setFileError] = useState('');
  const [location,  setLocation]  = useState(null);
  const [locError,  setLocError]  = useState('');
  const [apiError,  setApiError]  = useState('');
  const [isLoading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createIssueSchema),
    mode: 'onBlur',
    defaultValues: { intera: 'yoroheje' },
  });

  const selectedIntera = watch('intera', 'yoroheje');
  const umutweValue    = watch('umutwe', '');
  const ibisobanuroVal = watch('ibisobanuro', '');

  // GPS Location
  const getLocation = () => {
    setLocError('');
    if (!navigator.geolocation) {
      setLocError('Sisitemu yawe ntishobora kubona aho uri.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        setValue('latitude',  loc.lat);
        setValue('longitude', loc.lng);
        toast.success('Aho uri haboneka!');
      },
      (err) => {
        const msgs = {
          1: 'Ntabwo wemeye sisitemu kubona aho uri.',
          2: 'Ntabwo bashije kubona aho uri.',
          3: 'Igihe cyarangiye mu gushaka aho uri.',
        };
        setLocError(msgs[err.code] || 'Ikibazo mu kubona aho uri.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // File handling
  const handleFiles = (e) => {
    setFileError('');
    const selected = Array.from(e.target.files || []);
    const err = validateFiles(selected);
    if (err) {
      setFileError(err);
      e.target.value = '';
      return;
    }
    setFiles(prev => {
      const combined = [...prev, ...selected];
      if (combined.length > 5) {
        setFileError('Amafoto menshi cyane. Max: 5.');
        return prev;
      }
      return combined;
    });
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('umutwe',      data.umutwe.trim());
      formData.append('ibisobanuro', data.ibisobanuro.trim());
      formData.append('icyiciro',    data.icyiciro);
      formData.append('intera',      data.intera || 'yoroheje');
      if (data.latitude)  formData.append('latitude',  data.latitude);
      if (data.longitude) formData.append('longitude', data.longitude);
      files.forEach(f => formData.append('attachments', f));

      const res = await api.post('/ibibazo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(`✅ Ikibazo cyashyizwe! Nimero: ${res.data.data.ticket_number}`);
        navigate('/umuturage/ibibazo');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors?.length) {
        setApiError(errData.errors[0].message);
      } else {
        setApiError(errData?.message || 'Ikibazo mu gutanga. Gerageza nyuma.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rwanda-dark to-blue-800 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle size={22} />
            Gutanga Ikibazo Gishya
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            Sobanura ikibazo cyawe neza kugira ngo gikemuke vuba
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5" noValidate>
          <ApiErrorAlert error={apiError} onDismiss={() => setApiError('')} />

          {/* Umutwe */}
          <FormField
            label="Umutwe w'Ikibazo"
            name="umutwe"
            type="text"
            register={register}
            error={errors.umutwe?.message}
            value={umutweValue}
            required
            placeholder="Sobanura ikibazo mu magambo make..."
            maxLength={200}
            showCount
          />

          {/* Icyiciro */}
          <FormField
            label="Icyiciro cy'Ikibazo"
            name="icyiciro"
            type="select"
            register={register}
            error={errors.icyiciro?.message}
            required
            options={ICYICIRO_OPTIONS}
          />

          {/* Intera */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Intera y'Ikibazo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTERA_OPTIONS.map(({ value, label, bg }) => (
                <label
                  key={value}
                  className={`flex items-center justify-center gap-1.5 p-2.5 border-2 rounded-xl
                              cursor-pointer text-xs font-medium transition-all
                              ${selectedIntera === value
                                ? `${bg} border-current shadow-sm`
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    value={value}
                    className="hidden"
                    {...register('intera')}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Ibisobanuro */}
          <FormField
            label="Ibisobanuro Birambuye"
            name="ibisobanuro"
            type="textarea"
            register={register}
            error={errors.ibisobanuro?.message}
            value={ibisobanuroVal}
            required
            rows={5}
            placeholder="Sobanura ikibazo cyawe neza: aho kiri, igihe cyatangiye, n'ibindi..."
            maxLength={5000}
            showCount
          />

          {/* Location & Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GPS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Aho Ikibazo Kiri (GPS)
              </label>
              <button
                type="button"
                onClick={getLocation}
                className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed
                            rounded-xl text-sm transition-all
                            ${location
                              ? 'border-green-400 bg-green-50 text-green-700'
                              : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}
              >
                <MapPin size={18} />
                {location
                  ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : 'Kanda kugira ngo uboneke'}
              </button>
              {locError && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> {locError}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Amafoto / Inyandiko ({files.length}/5)
              </label>
              <label className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed
                                rounded-xl text-sm cursor-pointer transition-all
                                ${fileError
                                  ? 'border-red-400 bg-red-50 text-red-600'
                                  : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
                <Upload size={18} />
                Shyiramo amafoto (JPEG, PNG, PDF)
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="hidden"
                  onChange={handleFiles}
                  disabled={files.length >= 5}
                />
              </label>
              {fileError && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> {fileError}
                </p>
              )}
            </div>
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amafoto Yashyizweho
              </p>
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i}
                    className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    {f.type.startsWith('image/') ? (
                      <Image size={16} className="text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText size={16} className="text-red-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {(f.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-gray-400 hover:text-red-500 transition flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rwanda-dark hover:bg-blue-900 text-white font-semibold py-3.5 px-6
                       rounded-xl flex items-center justify-center gap-2 transition-all duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
            {isLoading ? 'Gutuma...' : 'Ohereza Ikibazo'}
          </button>
        </form>
      </div>
    </div>
  );
}
