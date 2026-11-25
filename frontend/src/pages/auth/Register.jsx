import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, User } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/common/Button.jsx';
import { TextInput } from '../../components/common/Fields.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { errorMessage, fieldErrors } from '../../api/axiosClient.js';
import { blankToNull } from '../../utils/format.js';

function validate(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email';
  if (form.phone && !/^[6-9][0-9]{9}$/.test(form.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters';
  else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = 'Include at least one letter and one number';
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match';
  return errors;
}

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
    setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: blankToNull(form.phone),
        password: form.password,
      });
      toast.success('Welcome to QuickRider!');
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start ordering from shops in your neighbourhood."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {formError}
          </div>
        )}
        <TextInput label="Full name" name="fullName" icon={User} autoComplete="name" value={form.fullName} onChange={update} error={errors.fullName} required />
        <TextInput label="Email" name="email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={update} error={errors.email} required />
        <TextInput
          label="Mobile number"
          name="phone"
          type="tel"
          inputMode="numeric"
          icon={Phone}
          autoComplete="tel-national"
          placeholder="10-digit mobile"
          value={form.phone}
          onChange={update}
          error={errors.phone}
          hint="Used by riders to reach you during delivery."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Password" name="password" type="password" icon={Lock} autoComplete="new-password" value={form.password} onChange={update} error={errors.password} required />
          <TextInput label="Confirm password" name="confirm" type="password" icon={Lock} autoComplete="new-password" value={form.confirm} onChange={update} error={errors.confirm} required />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
        <p className="text-center text-xs text-slate-500">
          Shop owners are onboarded by the QuickRider team. Contact us to list your store.
        </p>
      </form>
    </AuthShell>
  );
}
