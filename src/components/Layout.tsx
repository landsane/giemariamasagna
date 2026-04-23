import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Building2, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Accueil',    short: 'Accueil'    },
  { to: '/membres',   icon: Users,           label: 'Membres',    short: 'Membres'    },
  { to: '/terrains',  icon: Map,             label: 'Terrains',   short: 'Terrains'   },
  { to: '/logements', icon: Building2,       label: 'Logements',  short: 'Logements'  },
  { to: '/offres',    icon: Tag,             label: 'Offres',     short: 'Offres'     },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-13 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)' }}
            >G</div>
            <p className="font-black text-sm text-gray-900 leading-none">GIE Maria Masagna</p>
          </div>
          <PageTitle />
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 overflow-x-hidden">
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>

      {/* ── Barre de navigation bas ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV.map(({ to, icon: Icon, short }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors relative',
              isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                <span className={cn('text-[10px] font-medium leading-none', isActive ? 'text-green-600' : 'text-gray-400')}>
                  {short}
                </span>
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-500 rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

    </div>
  );
}

function PageTitle() {
  const { pathname } = useLocation();
  const match = NAV.find(n => pathname.startsWith(n.to));
  return (
    <p className="text-sm font-semibold text-gray-500">{match?.label ?? ''}</p>
  );
}
