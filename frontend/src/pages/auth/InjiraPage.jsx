// ============================================================
// InjiraPage - Login (Production Validation)
// ============================================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { loginSchema } from '../../utils/validators';
import FormField, { ApiErrorAlert } from '../../components/ui/FormField';
import { LogIn, Shield } from 'lucide-react';

export default function InjiraPage() {
  const [apiError, setApiError] = useState('');
  const { injira, isLoading }   = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate iyo umukoresha asohoka mu field
  });

  const loginValue = watch('login', '');

  const onSubmit = async (data) => {
    setApiError('');
    const result = await injira(data.login.trim(), data.ijambo_banga);
    if (result.success) {
      toast.success('Murakaza neza!');
      navigate('/');
    } else {
      setApiError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rwanda-dark via-blue-900 to-rwanda-green flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rwanda-yellow/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rwanda-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Shield className="w-10 h-10 text-rwanda-dark" />
          </div>
          <h1 className="text-3xl font-bold text-white">System y'Ibanze</h1>
          <p className="text-blue-200 mt-1 text-sm">Sisitemu y'Ubutegetsi bw'Ibanze 🇷🇼</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Injira muri Konti Yawe</h2>

          {/* API Error */}
          <ApiErrorAlert error={apiError} onDismiss={() => setApiError('')} />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4" noValidate>
            {/* Indangamuntu / Telefoni */}
            <FormField
              label="Indangamuntu cyangwa Telefoni"
              name="login"
              type="text"
              register={register}
              error={errors.login?.message}
              value={loginValue}
              required
              placeholder="1199780XXXXXXXXX cyangwa 07XXXXXXXX"
              hint="Shyiramo indangamuntu (imibare 16) cyangwa telefoni"
              autoComplete="username"
              inputMode="numeric"
            />

            {/* Ijambo Banga */}
            <FormField
              label="Ijambo Banga"
              name="ijambo_banga"
              type="password"
              register={register}
              error={errors.ijambo_banga?.message}
              required
              placeholder="Injiza ijambo banga ryawe"
              autoComplete="current-password"
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-rwanda-dark hover:bg-blue-900 text-white font-semibold py-3.5 px-6
                         rounded-xl flex items-center justify-center gap-2 transition-all duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {(isLoading || isSubmitting) ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={20} />
              )}
              {(isLoading || isSubmitting) ? 'Gutegereza...' : 'Injira'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Nta konti ufite?{' '}
              <Link to="/iyandikisha" className="text-blue-600 hover:text-blue-800 font-semibold transition">
                Iyandikishe hano
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200/60 text-xs mt-6">
          © {new Date().getFullYear()} Minisiteri y'Ubutegetsi bw'Igihugu — Rwanda
        </p>
      </div>
    </div>
  );
}
