import { Users, Map, Building2, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useCountUp } from '@/hooks/useCountUp';
import {
  fetchMembres,
  fetchSouscriptionsTerrain,
  fetchSouscriptionsLogement,
  fetchPaiementsTerrain,
  fetchPaiementsLogement,
} from '@/lib/queries';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import Skeleton from '@/components/Skeleton';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

// ─── Carte KPI ──────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, numeric, gradient, ring, to, delay,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  numeric?: number;
  gradient: string;
  ring: string;
  to?: string | null;
  delay: number;
}) {
  const animated = useCountUp(numeric ?? 0);
  const display = numeric !== undefined ? animated.toLocaleString('fr-FR') : value;

  const content = (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border border-emerald-100 p-5 overflow-hidden',
        'transition-all duration-200 ease-out',
        to && `hover:shadow-lg hover:-translate-y-0.5 hover:border-transparent cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${ring}`
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Halo décoratif au survol */}
      {to && (
        <div className={cn('absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl', gradient)} />
      )}
      <div className="relative">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform duration-200 group-hover:scale-105 bg-gradient-to-br', gradient)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className={cn('font-black text-gray-900 tabular-nums', numeric !== undefined ? 'text-2xl' : 'text-base')}>
          {display}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <p className="text-xs text-gray-400">{label}</p>
          {to && <ArrowRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {to ? <Link to={to}>{content}</Link> : content}
    </div>
  );
}

export default function DashboardPage() {
  const { data: membres,       loading: lm } = useAsync(fetchMembres);
  const { data: souscTerrain,  loading: lt } = useAsync(fetchSouscriptionsTerrain);
  const { data: souscLogement, loading: ll } = useAsync(fetchSouscriptionsLogement);
  const { data: paiTerrains,   loading: lpt } = useAsync(fetchPaiementsTerrain);
  const { data: paiLogements,  loading: lpl } = useAsync(fetchPaiementsLogement);

  const loading = lm || lt || ll || lpt || lpl;

  const nbMembresActifs      = (membres ?? []).filter(m => m.statut === 'actif').length;
  const nbTerrainsTotal      = (souscTerrain ?? []).reduce((a, s) => a + s.nb_terrains, 0);
  const nbDossiersLog        = (souscLogement ?? []).length;
  const totalVerseTerrains   = (souscTerrain ?? []).reduce((a, s) => a + s.montant_verse, 0);
  const totalVersePaiLog     = (paiLogements ?? []).reduce((a, p) => a + p.montant, 0);
  const totalVerse           = totalVerseTerrains + totalVersePaiLog;
  const totalMontantTotal    = (souscTerrain ?? []).reduce((a, s) => a + s.montant_total, 0);
  const avancementGlobal     = totalMontantTotal > 0 ? Math.round((totalVerseTerrains / totalMontantTotal) * 100) : 0;

  const derniersVersements = [...(paiTerrains ?? [])]
    .sort((a, b) => new Date(b.date_versement).getTime() - new Date(a.date_versement).getTime())
    .slice(0, 5);

  const dossiersEnCours = (souscLogement ?? []).filter(s => s.statut === 'en_cours').slice(0, 4);

  const CARDS = [
    { icon: Users,      label: 'Membres actifs',    value: String(nbMembresActifs),    numeric: nbMembresActifs, gradient: 'from-blue-500 to-blue-600',     ring: 'ring-blue-300',    to: '/membres' },
    { icon: Map,        label: 'Terrains souscrits', value: String(nbTerrainsTotal),    numeric: nbTerrainsTotal, gradient: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-300', to: '/terrains' },
    { icon: Building2,  label: 'Dossiers logements', value: String(nbDossiersLog),      numeric: nbDossiersLog,  gradient: 'from-purple-500 to-purple-600',  ring: 'ring-purple-300',  to: '/logements' },
    { icon: TrendingUp, label: 'Total encaissé',     value: formatCurrency(totalVerse), numeric: undefined,      gradient: 'from-amber-500 to-amber-600',    ring: 'ring-amber-300',   to: null },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-black text-gray-900">Tableau de bord</h2>
        <p className="text-sm text-gray-500 mt-1">Vue générale du GIE Mariama SAGNA</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? CARDS.map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-emerald-100 p-5">
                <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                <Skeleton className="h-7 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : CARDS.map((card, i) => <KpiCard key={card.label} {...card} delay={i * 60} />)
        }
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Module Terrains */}
        <div className="animate-fade-in-up bg-white rounded-2xl border border-emerald-100 p-5 space-y-4 transition-shadow duration-200 hover:shadow-md" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Map className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Terrains Simples</h3>
            </div>
            <Link to="/terrains" className="group flex items-center gap-0.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors">
              Voir tout
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Avancement global</span><span className="font-semibold text-gray-600">{avancementGlobal}%</span>
                </div>
                <ProgressBar value={avancementGlobal} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50 rounded-lg p-2.5 transition-colors duration-200 hover:bg-emerald-100/70">
                  <p className="text-gray-400">Encaissé</p>
                  <p className="font-bold text-emerald-700">{formatCurrency(totalVerseTerrains)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-2.5 transition-colors duration-200 hover:bg-orange-100/70">
                  <p className="text-gray-400">Reste</p>
                  <p className="font-bold text-orange-600">{formatCurrency(totalMontantTotal - totalVerseTerrains)}</p>
                </div>
              </div>

              {derniersVersements.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Derniers versements</p>
                  <div className="space-y-0.5">
                    {derniersVersements.map(p => {
                      const souscription = (souscTerrain ?? []).find(s => s.id === p.souscription_id);
                      const membre = (membres ?? []).find(m => m.id === souscription?.membre_id);
                      return (
                        <div key={p.id} className="flex items-center justify-between text-xs px-2 -mx-2 py-1.5 rounded-lg transition-colors duration-150 hover:bg-gray-50">
                          <span className="text-gray-700 truncate">{membre?.prenom} {membre?.nom}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-gray-400">{formatDate(p.date_versement)}</span>
                            <span className="font-semibold text-emerald-700">{formatCurrency(p.montant)}</span>
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
        <div className="animate-fade-in-up bg-white rounded-2xl border border-emerald-100 p-5 space-y-4 transition-shadow duration-200 hover:shadow-md" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">Logements / Titre Foncier</h3>
            </div>
            <Link to="/logements" className="group flex items-center gap-0.5 text-xs text-purple-600 hover:text-purple-700 transition-colors">
              Voir tout
              <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'En cours',  count: (souscLogement ?? []).filter(s => s.statut === 'en_cours').length },
                  { label: 'Validés',   count: (souscLogement ?? []).filter(s => s.statut === 'valide').length },
                  { label: 'Attribués', count: (souscLogement ?? []).filter(s => s.statut === 'attribue').length },
                ].map(item => (
                  <div key={item.label} className="bg-purple-50/60 rounded-lg p-2.5 text-center transition-colors duration-200 hover:bg-purple-100/60">
                    <p className="font-black text-gray-900 text-base">{item.count}</p>
                    <p className="text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {dossiersEnCours.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Dossiers en cours d'acompte</p>
                  <div className="space-y-1">
                    {dossiersEnCours.map(s => {
                      const membre = (membres ?? []).find(m => m.id === s.membre_id);
                      const pct = Math.round((s.acompte_verse / s.acompte_requis) * 100);
                      return (
                        <div key={s.id} className="flex items-center gap-2 text-xs px-2 -mx-2 py-1.5 rounded-lg transition-colors duration-150 hover:bg-gray-50">
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

              <div className="bg-purple-50/60 rounded-lg p-2.5 text-xs transition-colors duration-200 hover:bg-purple-100/60">
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
