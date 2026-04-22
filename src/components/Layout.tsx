import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Map, Building2, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/membres',    icon: Users,           label: 'Membres'          },
  { to: '/terrains',   icon: Map,             label: 'Terrains Simples' },
  { to: '/logements',  icon: Building2,       label: 'Logements / TF'   },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}>G</div>
            <div>
              <p className="font-black text-sm text-gray-900 leading-none">GIE Maria</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Masagna</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
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

        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">© 2026 GIE Maria Masagna</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
          <button
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <PageTitle />
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageTitle() {
  const { pathname } = useLocation();
  const match = NAV.find(n => pathname.startsWith(n.to));
  return <h1 className="text-base font-semibold text-gray-900">{match?.label ?? 'GIE Maria Masagna'}</h1>;
}
