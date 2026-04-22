import { Users, Map, Building2, TrendingUp } from 'lucide-react';

const CARDS = [
  { icon: Users,     label: 'Membres actifs',        value: '—', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: Map,       label: 'Terrains souscrits',     value: '—', color: '#16A34A', bg: '#F0FDF4' },
  { icon: Building2, label: 'Dossiers logements',     value: '—', color: '#7C3AED', bg: '#F5F3FF' },
  { icon: TrendingUp,label: 'Cotisations du mois',    value: '—', color: '#D97706', bg: '#FFFBEB' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-black text-gray-900">Tableau de bord</h2>
        <p className="text-sm text-gray-400 mt-1">Vue générale du GIE Maria Masagna</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder modules */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Module Terrains Simples</h3>
          </div>
          <p className="text-sm text-gray-400">
            Suivi des souscriptions, cotisations mensuelles et attributions de terrains à construire.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Souscriptions', 'Cotisations', 'Attributions', 'Rapports'].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F0FDF4', color: '#16A34A' }}>{t}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Module Logements / Titre Foncier</h3>
          </div>
          <p className="text-sm text-gray-400">
            Gestion des dossiers logements sociaux et terrains en titre foncier avec suivi des paiements.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Dossiers', 'Paiements', 'Documents', 'Rapports'].map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: '#F5F3FF', color: '#7C3AED' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-800">⚙️ Configuration en cours</p>
        <p className="text-xs text-amber-600 mt-1">
          Les modules seront configurés après analyse des fichiers Excel et PowerPoint fournis.
        </p>
      </div>
    </div>
  );
}
