import { useEffect, useState } from 'react';
import { KeyRound, Smartphone } from 'lucide-react';
import Button from '../../components/common/Button.jsx';
import { TextInput } from '../../components/common/Fields.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../api/axiosClient.js';

/** Two-step SMS OTP login: mobile number -> 6-digit code. Calls onLoggedIn(user) on success. */
export default function OtpLoginForm({ onLoggedIn }) {
  const { requestOtp, loginWithOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phoneValid = /^[6-9][0-9]{9}$/.test(phone);

  const send = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await requestOtp(phone);
      setSent(true);
      setInfo(data.message);
      setResendIn(data.resendAfterSeconds);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the OTP'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onLoggedIn(await loginWithOtp(phone, otp));
    } catch (err) {
      setError(errorMessage(err, 'Invalid OTP'));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={sent ? verify : send} className="space-y-4" noValidate>
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {error}
        </div>
      )}
      <TextInput
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        icon={Smartphone}
        placeholder="10-digit mobile"
        value={phone}
        disabled={sent}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        error={phone && !phoneValid ? 'Enter a valid 10-digit mobile number' : undefined}
        required
      />

      {sent && (
        <>
          <TextInput
            label="OTP"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            icon={KeyRound}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoFocus
          />
          {info && <p className="text-xs text-slate-500">{info}</p>}
          {import.meta.env.DEV && <p className="text-xs text-amber-700">Dev: the master OTP 111111 also works.</p>}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              className="font-semibold text-slate-500 hover:text-slate-700"
              onClick={() => {
                setSent(false);
                setOtp('');
                setError('');
              }}
            >
              Change number
            </button>
            <button
              type="button"
              className="font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={resendIn > 0 || busy}
              onClick={send}
            >
              {resendIn > 0 ? `Resend OTP in ${resendIn}s` : 'Resend OTP'}
            </button>
          </div>
        </>
      )}

      <Button type="submit" size="lg" className="w-full" loading={busy} disabled={sent ? otp.length < 4 : !phoneValid}>
        {sent ? 'Verify & sign in' : 'Send OTP'}
      </Button>
    </form>
  );
}
