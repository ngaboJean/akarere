// ============================================================
// FormField - Reusable Validated Input Component
// Ikoresha kuri buri form muri sisitemu
// ============================================================
import React from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

/**
 * FormField - Input ifite validation state yuzuye
 *
 * Props:
 *  label       - Izina ry'ikibazo
 *  name        - name attribute
 *  type        - input type (text, password, email, tel, number, date, textarea, select)
 *  register    - react-hook-form register()
 *  error       - error message (string)
 *  required    - niba irakenewe
 *  hint        - Ibisobanuro bito munsi y'input
 *  options     - Kuri select: [{ value, label }]
 *  rows        - Kuri textarea
 *  maxLength   - Umubare w'inyuguti
 *  showCount   - Kwerekana umubare w'inyuguti
 *  value       - Agaciro k'ubu (kugira ngo twerekane counter)
 *  className   - Extra classes
 */
export default function FormField({
  label,
  name,
  type = 'text',
  register,
  error,
  required = false,
  hint,
  options = [],
  rows = 4,
  maxLength,
  showCount = false,
  value = '',
  className = '',
  placeholder,
  disabled = false,
  prefix,
  suffix,
  ...rest
}) {
  const [showPwd, setShowPwd] = React.useState(false);
  const hasError   = !!error;
  const isValid    = !hasError && value && value.toString().length > 0;

  const baseClass = `
    w-full px-4 py-3 border rounded-xl text-sm transition-all duration-150
    focus:outline-none focus:ring-2
    disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
    ${hasError
      ? 'border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400'
      : isValid
        ? 'border-green-400 bg-green-50/30 focus:ring-green-300 focus:border-green-400'
        : 'border-gray-200 bg-white focus:ring-blue-300 focus:border-blue-400'
    }
    ${prefix ? 'pl-10' : ''}
    ${suffix || type === 'password' ? 'pr-10' : ''}
    ${className}
  `;

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          id={name}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseClass} resize-none`}
          {...(register ? register(name) : {})}
          {...rest}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          id={name}
          disabled={disabled}
          className={`${baseClass} bg-white cursor-pointer`}
          {...(register ? register(name) : {})}
          {...rest}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type;

    return (
      <input
        id={name}
        type={inputType}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        className={baseClass}
        {...(register ? register(name) : {})}
        {...rest}
      />
    );
  };

  return (
    <div className="space-y-1.5">
      {/* Label */}
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="relative">
        {/* Prefix Icon */}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {prefix}
          </div>
        )}

        {renderInput()}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {/* Validation Icon (not for password/select/textarea) */}
        {!['password','select','textarea'].includes(type) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError && <AlertCircle size={16} className="text-red-500" />}
            {isValid  && <CheckCircle size={16} className="text-green-500" />}
          </div>
        )}

        {/* Suffix */}
        {suffix && !['password'].includes(type) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">
            {suffix}
          </div>
        )}
      </div>

      {/* Character Counter */}
      {showCount && maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${
            value.toString().length >= maxLength * 0.9
              ? 'text-red-500'
              : 'text-gray-400'
          }`}>
            {value.toString().length}/{maxLength}
          </span>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="flex items-center gap-1.5 text-red-600 text-xs font-medium" role="alert">
          <AlertCircle size={13} className="flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Hint (shown only when no error) */}
      {hint && !hasError && (
        <p className="text-gray-400 text-xs">{hint}</p>
      )}
    </div>
  );
}

// ── Password Strength Indicator ─────────────────────────────
export function PasswordStrength({ password = '' }) {
  const checks = [
    { label: 'Nibura inyuguti 8',          test: password.length >= 8 },
    { label: 'Inyuguti nkuru (A-Z)',        test: /[A-Z]/.test(password) },
    { label: 'Inyuguti ntoya (a-z)',        test: /[a-z]/.test(password) },
    { label: 'Umubare (0-9)',               test: /\d/.test(password) },
    { label: 'Ikimenyetso kidasanzwe (@$!)',test: /[@$!%*?&\-_#]/.test(password) },
  ];

  const score  = checks.filter(c => c.test).length;
  const levels = [
    { label: '',          color: 'bg-gray-200' },
    { label: 'Nziza gato',color: 'bg-red-500' },
    { label: 'Hagati',    color: 'bg-orange-500' },
    { label: 'Nziza',     color: 'bg-yellow-500' },
    { label: 'Ikomeye',   color: 'bg-blue-500' },
    { label: 'Ikomeye cyane', color: 'bg-green-500' },
  ];

  const level = levels[score] || levels[0];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      {/* Strength Bar */}
      <div className="flex gap-1">
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? level.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Level Label */}
      {level.label && (
        <p className={`text-xs font-medium ${
          score <= 2 ? 'text-red-600' :
          score <= 3 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          Imbaraga: {level.label}
        </p>
      )}

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, test }) => (
          <div key={label} className={`flex items-center gap-1 text-xs ${
            test ? 'text-green-600' : 'text-gray-400'
          }`}>
            <span>{test ? '✓' : '○'}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── API Error Display ────────────────────────────────────────
export function ApiErrorAlert({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
      <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Habaye ikibazo</p>
        <p className="text-sm text-red-700 mt-0.5">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition flex-shrink-0"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Success Alert ────────────────────────────────────────────
export function SuccessAlert({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl" role="status">
      <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-green-400 hover:text-green-600 transition">
          ×
        </button>
      )}
    </div>
  );
}
