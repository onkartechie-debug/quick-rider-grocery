export function Field({ label, htmlFor, error, hint, required, className = '', children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, error, hint, id, name, required, className = '', icon: Icon, ...props }) {
  const inputId = id || name;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          id={inputId}
          name={name}
          required={required}
          aria-invalid={!!error}
          className={`input ${Icon ? 'pl-10' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />
      </div>
    </Field>
  );
}

export function SelectInput({ label, error, hint, id, name, required, className = '', children, ...props }) {
  const inputId = id || name;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <select
        id={inputId}
        name={name}
        required={required}
        aria-invalid={!!error}
        className={`input pr-9 ${error ? 'input-error' : ''}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export function TextArea({ label, error, hint, id, name, required, className = '', rows = 3, ...props }) {
  const inputId = id || name;
  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required} className={className}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        className={`input resize-none ${error ? 'input-error' : ''}`}
        {...props}
      />
    </Field>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium text-slate-800">{label}</span>}
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      )}
    </label>
  );
}
