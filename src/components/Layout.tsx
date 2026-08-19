import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil',    short: 'Accueil'    },
  { to: '/membres',   icon: Users,           label: 'Membres',    short: 'Membres'    },
  { to: '/terrains',  icon: Map,             label: 'Terrains',   short: 'Terrains'   },
  { to: '/logements', icon: Building2,       label: 'Logements',  short: 'Logements'  },
];

function Logo() {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-400 flex items-center justify-center text-[#064E3B] font-black text-sm flex-shrink-0">
        G
      </div>
    );
  }
  return (
    <img
      src="/logo.png"
      alt="Logo GIE"
      className="w-9 h-9 rounded-full object-cover border border-emerald-400/40 flex-shrink-0"
      onError={() => setHasError(true)}
    />
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen min-h-dvh md:flex">

      {/* ── Sidebar (tablette large / ordinateur) ── */}
      <aside
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-30 border-r border-emerald-900"
        style={{ background: '#064E3B' }}
      >
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/10 flex-shrink-0">
          <Logo />
          <div className="min-w-0">
            <p className="font-black text-sm text-white leading-none truncate">GIE Mariama SAGNA</p>
            <p className="text-[10px] text-emerald-300 leading-none mt-0.5">Coopérative d'Habitat</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-emerald-300' : 'text-emerald-100/60 hover:text-emerald-100 hover:bg-white/5'
              )}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Colonne principale ── */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-64">

        {/* ── Header (mobile / petite tablette uniquement) ── */}
        <header className="sticky top-0 z-30 md:hidden" style={{ background: '#064E3B' }}>
          <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5">
              <Logo />
              <div>
                <p className="font-black text-sm text-white leading-none">GIE Mariama SAGNA</p>
                <p className="text-[10px] text-emerald-300 leading-none mt-0.5">Coopérative d'Habitat</p>
              </div>
            </div>
            <PageTitle />
          </div>
        </header>

        {/* ── Contenu ── */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* ── Barre de navigation bas (mobile uniquement) ── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-emerald-900"
          style={{ background: '#064E3B', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {NAV.map(({ to, icon: Icon, short }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors relative',
                isActive ? 'text-emerald-300' : 'text-emerald-100/40 hover:text-emerald-100/70'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                  <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-emerald-300' : 'text-emerald-100/40')}>
                    {short}
                  </span>
                  {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

      </div>
    </div>
  );
}

function PageTitle() {
  const { pathname } = useLocation();
  const match = NAV.find(n => pathname.startsWith(n.to));
  return (
    <p className="text-sm font-semibold text-emerald-200">{match?.label ?? ''}</p>
  );
}
