import { NavLink } from 'react-router-dom';

/** Fixed bottom tab bar shown only below the md breakpoint. */
export default function BottomNav({ items }) {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-b-0 pb-safe md:hidden" aria-label="Primary">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                    isActive ? 'text-brand-700' : 'text-slate-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative rounded-xl px-4 py-1 transition ${isActive ? 'bg-brand-50' : ''}`}>
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                      {item.badge > 0 && (
                        <span className="absolute -right-0.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
