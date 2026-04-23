import { Users, Map, Building2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import {
  fetchMembres,
  fetchSouscriptionsTerrain,
  fetchSouscriptionsLogement,
  fetchPaiementsTerrain,
  fetchPaiementsLogement,
} from '@/lib/queries';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { data: membres,       loading: lm } = useAsync(fetchMembres);
  const { data: souscTerrain,  loading: lt } = useAsync(fetchSouscriptionsTerrain);
  const { data: souscLogement, loading: ll } = useAsync(fetchSouscriptionsLogement);
  const { data: paiTerrains,   loading: lpt } = useAsync(fetchPaiementsTerrain);
  const { data: paiLogements,  loading: lpl } = useAsync(fetchPaiementsLogement);

  const loading = lm || lt || ll || lpt || lpl;

  // KPIs
  const nbMembresActifs      = (membres ?? []).filter(m => m.statut === 'actif').length;
  const nbTerrainsTotal      = (souscTerrain ?? []).reduce((a, s) => a + s.nb_terrains, 0);
  const nbDossiersLog        = (souscLogement ?? []).length;
  const totalVerseTerrains   = (souscTerrain ?? []).reduce((a, s) => a + s.montant_verse, 0);
  const totalVersePaiLog     = (paiLogements ?? []).reduce((a, p) => a + p.montant, 0);
  const totalVerse           = totalVerseTerrains + totalVersePaiLog;
  const totalMontantTotal    = (souscTerrain ?? []).reduce((a, s) => a + s.montant_total, 0);
  const avancementGlobal     = totalMontantTotal > 0 ? Math.round((totalVerseTerrains / totalMontantTotal) * 100) : 0;

  // Derniers paiements terrains
  const derniersVersements = [...(paiTerrains ?? [])]
    .sort((a, b) => new Date(b.date_versement).getTime() - new Date(a.date_versement).getTime())
    .slice(0, 5);

  // Dossiers logements en cours
  const dossiersEnCours = (souscLogement ?? []).filter(s => s.statut === 'en_cours').slice(0, 4);

  const CARDS = [
    { icon: Users,      label: 'Membres actifs',    value: nbMembresActifs,           color: '#3B82F6', bg: '#EFF6FF', to: '/membres' },
    { icon: Map,        label: 'Terrains souscrits', value: nbTerrainsTotal,           color: '#16A34A', bg: '#F0FDF4', to: '/terrains' },
    { icon: Building2,  label: 'Dossiers logements', value: nbDossiersLog,             color: '#7C3AED', bg: '#F5F3FF', to: '/logements' },
    { icon: TrendingUp, label: 'Total encaissé',     value: formatCurrency(totalVerse),color: '#D97706', bg: '#FFFBEB', to: null, small: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">Tableau de bord</h2>
        <p className="text-sm text-gray-400 mt-1">Vue générale du GIE Mariama SAGNA</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ icon: Icon, label, value, color, bg, to, small }) => {
          const inner = (
            <div className={`bg-white rounded-2xl border border-gray-100 p-5 transition-shadow ${to ? 'hover:shadow-md cursor-pointer' : ''}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              {loading
                ? <div className="h-8 w-12 bg-gray-100 rounded animate-pulse mb-1" />
                : <p className={`font-black text-gray-900 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
              }
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          );
          return to ? <Link key={label} to={to}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Module Terrains */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Terrains Simples</h3>
            </div>
            <Link to="/terrains" className="text-xs text-green-600 hover:underline">Voir tout</Link>
          </div>

          {loading ? <Spinner /> : (
            <>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Avancement global</span><span>{avancementGlobal}%</span>
                </div>
                <ProgressBar value={avancementGlobal} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400">Encaissé</p>
                  <p className="font-bold text-green-700">{formatCurrency(totalVerseTerrains)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-gray-400">Reste</p>
                  <p className="font-bold text-amber-600">{formatCurrency(totalMontantTotal - totalVerseTerrains)}</p>
                </div>
              </div>

              {derniersVersements.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Derniers versements</p>
                  <div className="space-y-1.5">
                    {derniersVersements.map(p => {
                      const souscription = (souscTerrain ?? []).find(s => s.id === p.souscription_id);
                      const membre = (membres ?? []).find(m => m.id === souscription?.membre_id);
                      return (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate">{membre?.prenom} {membre?.nom}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-gray-400">{formatDate(p.date_versement)}</span>
                            <span className="font-semibold text-green-700">{formatCurrency(p.montant)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {derniersVersements.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Aucun versement enregistré</p>
              )}
            </>
          )}
        </div>

        {/* Module Logements */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Logements / Titre Foncier</h3>
            </div>
            <Link to="/logements" className="text-xs text-purple-600 hover:underline">Voir tout</Link>
          </div>

          {loading ? <Spinner /> : (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'En cours',  count: (souscLogement ?? []).filter(s => s.statut === 'en_cours').length },
                  { label: 'Validés',   count: (souscLogement ?? []).filter(s => s.statut === 'valide').length },
                  { label: 'Attribués', count: (souscLogement ?? []).filter(s => s.statut === 'attribue').length },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="font-black text-gray-900 text-base">{item.count}</p>
                    <p className="text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {dossiersEnCours.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Dossiers en cours d'acompte</p>
                  <div className="space-y-2">
                    {dossiersEnCours.map(s => {
                      const membre = (membres ?? []).find(m => m.id === s.membre_id);
                      const pct = Math.round((s.acompte_verse / s.acompte_requis) * 100);
                      return (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 truncate">{membre?.prenom} {membre?.nom}</p>
                            <ProgressBar value={pct} className="mt-0.5" />
                          </div>
                          <Badge variant={s.type_villa === 'F3' ? 'purple' : 'blue'} className="flex-shrink-0">
                            {s.type_villa}
                          </Badge>
                          <span className="text-gray-400 flex-shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {dossiersEnCours.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">Aucun dossier en cours</p>
              )}

              <div className="bg-gray-50 rounded-lg p-2.5 text-xs">
                <p className="text-gray-400">Total encaissé logements</p>
                <p className="font-bold text-purple-700">{formatCurrency(totalVersePaiLog)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
