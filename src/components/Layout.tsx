import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Building2, Tag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/membres',   icon: Users,           label: 'Membres'          },
  { to: '/terrains',  icon: Map,             label: 'Terrains Simples' },
  { to: '/logements', icon: Building2,       label: 'Logements / TF'   },
  { to: '/offres',    icon: Tag,             label: 'Offres'            },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── Barre de navigation horizontale ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center h-14 px-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}
            >G</div>
            <div className="hidden sm:block">
              <p className="font-black text-sm text-gray-900 leading-none">GIE Maria</p>
              <p className="text-[10px] text-gray-400">Masagna</p>
            </div>
          </div>

          {/* Séparateur */}
          <div className="hidden lg:block w-px h-5 bg-gray-200" />

          {/* Nav items — desktop */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Titre courant — tablette */}
          <div className="flex-1 lg:hidden">
            <PageTitle />
          </div>

          {/* Bouton hamburger — mobile/tablette */}
          <button
            className="lg:hidden ml-auto h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu déroulant mobile */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-3 py-2 space-y-0.5">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Contenu */}
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

function PageTitle() {
  const { pathname } = useLocation();
  const match = NAV.find(n => pathname.startsWith(n.to));
  return <h1 className="text-base font-semibold text-gray-900">{match?.label ?? 'GIE Maria Masagna'}</h1>;
}
