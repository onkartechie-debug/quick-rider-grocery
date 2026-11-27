import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import OtpLoginForm from './OtpLoginForm.jsx';
import Button from '../../components/common/Button.jsx';
import { TextInput } from '../../components/common/Fields.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../api/axiosClient.js';
import { ROLE_HOME } from '../../utils/constants.js';

// Accounts created by V2__seed_data.sql for local development only.
const DEMO_ACCOUNTS = import.meta.env.DEV
  ? [
      { role: 'Admin', email: 'admin@quickrider.com' },
      { role: 'Shopkeeper', email: 'ravi.fresh@quickrider.com' },
      { role: 'Customer', email: 'priya@example.com' },
    ]
  : [];

/** Only allow redirects back into this app, and only into the portal that matches the role. */
function resolveDestination(from, role) {
  const home = ROLE_HOME[role] || '/';
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) return home;
  if (role === 'ADMIN') return from.startsWith('/admin') ? from : home;
  if (role === 'SHOPKEEPER') return from.startsWith('/shopkeeper') ? from : home;
  return from.startsWith('/admin') || from.startsWith('/shopkeeper') ? home : from;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('password');

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(resolveDestination(location.state?.from, user.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to QuickRider."
      footer={
        <>
          New to QuickRider?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist">
        {[
          ['password', 'Password'],
          ['otp', 'Mobile OTP'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => {
              setMode(key);
              setError('');
            }}
            className={`rounded-lg py-2 transition ${mode === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'otp' ? (
        <OtpLoginForm onLoggedIn={(user) => navigate(resolveDestination(location.state?.from, user.role), { replace: true })} />
      ) : (
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {error}
          </div>
        )}
        <TextInput
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder="you@example.com"
          value={form.email}
          onChange={update}
          required
        />
        <div className="relative">
          <TextInput
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            icon={Lock}
            placeholder="Your password"
            value={form.password}
            onChange={update}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[38px] rounded-md p-1 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!form.email || !form.password}>
          Sign in
        </Button>
      </form>
      )}

      {mode === 'password' && DEMO_ACCOUNTS.length > 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Local demo accounts</p>
          <p className="mt-1 text-xs text-slate-500">Seeded by Flyway. Fills the email; password is in the seed file.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setForm((f) => ({ ...f, email: acc.email }))}
                className="chip chip-idle text-xs"
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
