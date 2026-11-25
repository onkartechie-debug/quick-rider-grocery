import { Bike, Clock, ShieldCheck, Store } from 'lucide-react';
import Logo from '../../components/common/Logo.jsx';

const HIGHLIGHTS = [
  { icon: Store, text: 'Trusted neighbourhood shops and supermarkets' },
  { icon: Clock, text: 'Fresh groceries at your door in minutes' },
  { icon: Bike, text: 'Track every order from packing to delivery' },
  { icon: ShieldCheck, text: 'Secure sign-in protected by HttpOnly cookies' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-brand-700 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <Logo inverted />
        <div className="relative my-auto max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Your local grocery aisle,
            <span className="text-brand-300"> delivered.</span>
          </h2>
          <p className="mt-4 text-base text-emerald-100/80">
            QuickRider connects you with the shops around the corner, from fresh produce to pantry staples.
          </p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-emerald-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-emerald-100/60">&copy; {new Date().getFullYear()} QuickRider</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
