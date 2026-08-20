import { useState, useMemo } from 'react';
import { Upload } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import {
  fetchMembres,
  fetchSouscriptionsTerrain,
  fetchPaiementsTerrain,
  fetchPaiementsTerrainBySouscription,
  fetchSouscriptionsLogement,
  fetchPaiementsLogementBySouscription,
  fetchOffres,
} from '@/lib/queries';
import type { Membre, SouscriptionTerrain, PaiementTerrain, SouscriptionLogement, PaiementLogement, Offre, TypePaiementLogement } from '@/types';
import { LABELS_VERSEMENT, LABELS_MODE, LABELS_SITE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import NouveauDossierTerrainsModal from '@/components/NouveauDossierTerrainsModal';
import ImportModal from '@/components/ImportModal';
import VersementTerrainModal from '@/components/VersementTerrainModal';
import VersementLogementModal from '@/components/VersementLogementModal';
import ParcellesEditor from '@/components/ParcellesEditor';
import CatalogueOffres from '@/components/CatalogueOffres';
import { formatCurrency, formatDate, localisationSouscription, pourcentageAcompte, formatSurface, infosMembre } from '@/lib/utils';

// ─── Panneau détail — terrain simple ─────────────────────────────────────────
function DetailSouscription({
  souscription,
  membres,
  offres,
  onClose,
  onPaiementAdded,
}: {
  souscription: SouscriptionTerrain;
  membres: Membre[];
  offres: Offre[];
  onClose: () => void;
  onPaiementAdded: () => void;
}) {
  const membre = membres.find(m => m.id === souscription.membre_id);
  const offre  = offres.find(o => o.id === souscription.offre_id);
  const { data: paiements, loading, refetch } = useAsync(
    () => fetchPaiementsTerrainBySouscription(souscription.id),
    [souscription.id]
  );
  const [showVersement, setShowVersement] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-start sm:justify-end z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full sm:h-full sm:max-w-md rounded-t-2xl sm:rounded-none shadow-2xl overflow-y-auto flex flex-col max-h-[92dvh] sm:max-h-full animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {[
                infosMembre(membre),
                `${souscription.nb_terrains} terrain${souscription.nb_terrains > 1 ? 's' : ''}${offre?.surface_m2 ? ` · ${formatSurface(offre.surface_m2)}/parcelle` : ''}`,
              ].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Montant total</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(souscription.montant_total)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Versé</p>
              <p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(souscription.montant_verse)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Reste à verser</p>
              <p className="text-sm font-bold text-amber-700 mt-0.5">{formatCurrency(souscription.reste_a_verser)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Avancement</p>
              <p className="text-sm font-bold text-blue-700 mt-0.5">{souscription.pourcentage}%</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progression</span><span>{souscription.pourcentage}%</span>
            </div>
            <ProgressBar value={souscription.pourcentage} />
          </div>
          <div className="flex gap-2">
            <Badge variant={souscription.statut === 'solde' ? 'green' : 'amber'}>
              {souscription.statut === 'solde' ? 'SOLDÉ' : 'En cours'}
            </Badge>
            {souscription.sgbs && <Badge variant="blue">SGBS</Badge>}
          </div>
        </div>

        <div className="p-6 border-b border-gray-50">
          <ParcellesEditor souscriptionTerrainId={souscription.id} />
        </div>

        <div className="p-6 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historique des versements ({paiements?.length ?? '…'})
          </p>
          {loading ? (
            <Spinner />
          ) : !paiements?.length ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun versement enregistré</p>
          ) : (
            <div className="space-y-2">
              {paiements.map((p: PaiementTerrain) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {LABELS_VERSEMENT[p.numero_versement] ?? `Versement ${p.numero_versement}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.encaisseur_prenom} {p.encaisseur_nom} · {LABELS_MODE[p.mode_paiement]}
                    </p>
                    {p.reference && <p className="text-xs text-gray-300 mt-0.5">Réf : {p.reference}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(p.montant)}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.date_versement)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-emerald-100 p-4">
          <button
            onClick={() => setShowVersement(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            + Enregistrer un versement
          </button>
        </div>
      </div>
      {showVersement && (
        <VersementTerrainModal
          souscription={souscription}
          membre={membre}
          nextNumero={(paiements?.length ?? 0) + 1}
          onClose={() => setShowVersement(false)}
          onSaved={() => { refetch(); onPaiementAdded(); }}
        />
      )}
    </div>
  );
}

// ─── Panneau détail — terrain TF ─────────────────────────────────────────────
function DetailTerrainTF({
  souscription,
  membres,
  offres,
  onClose,
  onPaiementAdded,
}: {
  souscription: SouscriptionLogement;
  membres: Membre[];
  offres: Offre[];
  onClose: () => void;
  onPaiementAdded: () => void;
}) {
  const membre = membres.find(m => m.id === souscription.membre_id);
  const offre  = offres.find(o => o.id === souscription.offre_id);
  const { data: paiements, loading, refetch } = useAsync(
    () => fetchPaiementsLogementBySouscription(souscription.id),
    [souscription.id]
  );

  const prixUnitaire = offre?.prix_unitaire ?? Math.round(souscription.prix_total / (souscription.nb_terrains || 1));
  const acomptePct = souscription.acompte_requis > 0
    ? Math.round((souscription.acompte_verse / souscription.acompte_requis) * 100)
    : 0;
  const totalVerse = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct   = souscription.prix_total > 0 ? Math.round((totalVerse / souscription.prix_total) * 100) : 0;
  const [versementType, setVersementType] = useState<TypePaiementLogement | null>(null);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-start sm:justify-end z-50 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white w-full sm:h-full sm:max-w-md rounded-t-2xl sm:rounded-none shadow-2xl overflow-y-auto flex flex-col max-h-[92dvh] sm:max-h-full animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {[infosMembre(membre), 'Terrain Viabilisé'].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-green-600 uppercase tracking-wide">Parcelles souscrites</p>
              <p className="text-lg font-black text-green-800">
                {souscription.nb_terrains} parcelle{souscription.nb_terrains > 1 ? 's' : ''}
                {offre?.surface_m2 ? ` · ${formatSurface(offre.surface_m2)} chacune` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-green-600 uppercase tracking-wide">Prix / parcelle</p>
              <p className="text-sm font-bold text-green-800">{formatCurrency(prixUnitaire)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-gray-400">Site</p><p className="font-semibold text-gray-900">{localisationSouscription(offre, souscription.site, LABELS_SITE)}</p></div>
            <div><p className="text-gray-400">Prix total</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.prix_total)}</p></div>
            <div><p className="text-gray-400">Mensualité</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}/mois</p></div>
            <div><p className="text-gray-400">Date</p><p className="font-semibold text-gray-900">{formatDate(souscription.date_souscription)}</p></div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Acompte ({pourcentageAcompte(souscription.acompte_requis, souscription.prix_total)}%)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Requis</p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(souscription.acompte_requis)}</p>
            </div>
            <div className={`rounded-xl p-3 ${souscription.acompte_verse >= souscription.acompte_requis ? 'bg-green-50' : 'bg-amber-50'}`}>
              <p className="text-xs text-gray-400">Versé</p>
              <p className={`text-sm font-bold ${souscription.acompte_verse >= souscription.acompte_requis ? 'text-green-700' : 'text-amber-700'}`}>
                {formatCurrency(souscription.acompte_verse)}
              </p>
            </div>
          </div>
          <ProgressBar value={acomptePct} />
        </div>

        <div className="p-6 border-b border-gray-50 space-y-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Avancement global</span><span>{totalPct}%</span>
          </div>
          <ProgressBar value={totalPct} />
          <p className="text-xs text-gray-400">{formatCurrency(totalVerse)} sur {formatCurrency(souscription.prix_total)}</p>
        </div>

        <div className="p-6 border-b border-gray-50">
          <ParcellesEditor souscriptionLogementId={souscription.id} />
        </div>

        <div className="p-6 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historique ({paiements?.length ?? '…'})
          </p>
          {loading ? <Spinner /> : !paiements?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-2">
              {paiements.map((p: PaiementLogement) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {p.type_paiement === 'acompte' ? 'Acompte' : 'Mensualité'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{LABELS_MODE[p.mode_paiement]}</p>
                    {p.reference && <p className="text-xs text-gray-300 mt-0.5">Réf : {p.reference}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(p.montant)}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.date_versement)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-emerald-100 p-4 flex gap-2">
          <button
            onClick={() => setVersementType('mensualite')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            + Mensualité
          </button>
          <button
            onClick={() => setVersementType('acompte')}
            className="flex-1 border border-green-600 text-green-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            + Acompte
          </button>
        </div>
      </div>
      {versementType && (
        <VersementLogementModal
          souscription={souscription}
          membre={membre}
          initialType={versementType}
          onClose={() => setVersementType(null)}
          onSaved={() => { refetch(); onPaiementAdded(); }}
        />
      )}
    </div>
  );
}

// ─── Ligne souscription terrain simple ───────────────────────────────────────
function SouscriptionRow({
  s,
  membres,
  onSelect,
}: {
  s: SouscriptionTerrain;
  membres: Membre[];
  onSelect: (s: SouscriptionTerrain) => void;
}) {
  const membre = membres.find(m => m.id === s.membre_id);

  return (
    <tr
      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
      onClick={() => onSelect(s)}
    >
      <td className="py-3 px-4">
        <p className="text-sm font-semibold text-gray-900">{membre?.prenom} {membre?.nom}</p>
        <p className="text-xs text-gray-400">{infosMembre(membre) || '—'}</p>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700 text-center font-medium">{s.nb_terrains}</td>
      <td className="py-3 px-4 text-sm text-green-700 font-semibold">{formatCurrency(s.montant_verse)}</td>
      <td className="py-3 px-4 text-sm text-amber-700 font-semibold">{formatCurrency(s.reste_a_verser)}</td>
      <td className="py-3 px-4 min-w-[120px]">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{s.pourcentage}%</span>
        </div>
        <ProgressBar value={s.pourcentage} />
      </td>
      <td className="py-3 px-4">
        <Badge variant={s.statut === 'solde' ? 'green' : s.pourcentage >= 75 ? 'blue' : s.pourcentage >= 40 ? 'amber' : 'red'}>
          {s.statut === 'solde' ? 'SOLDÉ' : 'En cours'}
        </Badge>
        {s.sgbs && <Badge variant="gray" className="ml-1">SGBS</Badge>}
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">{formatDate(s.date_souscription)}</td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
type FiltreCategorie = 'tous' | 'simple' | 'tf';

export default function TerrainsPage() {
  const [tab, setTab]                     = useState<'offres' | 'souscriptions'>('souscriptions');
  const [search, setSearch]               = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState<FiltreCategorie>('tous');
  const [filtreStatut, setFiltreStatut]   = useState<'tous' | 'en_cours' | 'solde'>('tous');
  const [selected, setSelected]           = useState<SouscriptionTerrain | null>(null);
  const [selectedTF, setSelectedTF]       = useState<SouscriptionLogement | null>(null);
  const [showNouveauDossier, setShowNouveauDossier] = useState(false);
  const [showImport,         setShowImport]         = useState(false);

  const { data: membres,          loading: lm, refetch: rm  } = useAsync(fetchMembres);
  const { data: souscriptions,    loading: ls, refetch: rs  } = useAsync(fetchSouscriptionsTerrain);
  const { data: paiements,        loading: lp               } = useAsync(fetchPaiementsTerrain);
  const { data: toutesOffres,     loading: lo, refetch: ro   } = useAsync(fetchOffres);
  const { data: souscriptionsLog, loading: ltf, refetch: rtf } = useAsync(fetchSouscriptionsLogement);

  const offresSimples = useMemo(
    () => (toutesOffres ?? []).filter(o => o.type === 'terrain_simple' && o.statut === 'active'),
    [toutesOffres]
  );
  const offresTF = useMemo(
    () => (toutesOffres ?? []).filter(o => o.type === 'terrain_tf' && o.statut === 'active'),
    [toutesOffres]
  );
  const souscriptionsTF = useMemo(
    () => (souscriptionsLog ?? []).filter(s => s.type_villa === 'terrain'),
    [souscriptionsLog]
  );

  const loading = lm || ls || lp;
  const refetchAll = () => { rm(); rs(); rtf(); ro(); };

  const filtered = useMemo(() => {
    if (!souscriptions || !membres) return [];
    return souscriptions.filter(s => {
      const membre = membres.find(m => m.id === s.membre_id);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (membre?.nom ?? '').toLowerCase().includes(q) ||
        (membre?.prenom ?? '').toLowerCase().includes(q) ||
        (membre?.ville ?? '').toLowerCase().includes(q) ||
        (membre?.pays ?? '').toLowerCase().includes(q) ||
        (membre?.telephone ?? '').toLowerCase().includes(q);
      const matchStatut = filtreStatut === 'tous' || s.statut === filtreStatut;
      return matchSearch && matchStatut;
    });
  }, [souscriptions, membres, search, filtreStatut]);

  const filteredTF = useMemo(() => {
    if (!membres) return souscriptionsTF;
    const q = search.toLowerCase();
    if (!q) return souscriptionsTF;
    return souscriptionsTF.filter(s => {
      const m = membres.find(mb => mb.id === s.membre_id);
      return (m?.nom ?? '').toLowerCase().includes(q) ||
             (m?.prenom ?? '').toLowerCase().includes(q) ||
             (m?.ville ?? '').toLowerCase().includes(q) ||
             (m?.pays ?? '').toLowerCase().includes(q) ||
             (m?.telephone ?? '').toLowerCase().includes(q);
    });
  }, [souscriptionsTF, membres, search]);

  const stats = useMemo(() => {
    const list = souscriptions ?? [];
    return {
      nb_simples:  list.length, // nombre de dossiers (souscriptions) — pas de terrains
      nb_terrains_simples: list.reduce((a, s) => a + s.nb_terrains, 0),
      verse_simple: list.reduce((a, s) => a + s.montant_verse, 0),
      nb_soldes:    list.filter(s => s.statut === 'solde').length,
    };
  }, [souscriptions]);

  const statsTF = useMemo(() => ({
    nb:           souscriptionsTF.length, // nombre de dossiers (souscriptions) — pas de terrains
    nb_terrains:  souscriptionsTF.reduce((a, s) => a + s.nb_terrains, 0),
    verse: souscriptionsTF.reduce((a, s) => a + s.acompte_verse + s.nb_mensualites_payees * s.mensualite, 0),
  }), [souscriptionsTF]);

  const totalVerse = stats.verse_simple + statsTF.verse;

  const encaisseurs = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    (paiements ?? []).forEach(p => {
      const key = `${p.encaisseur_prenom} ${p.encaisseur_nom}`;
      const prev = map.get(key) ?? { total: 0, count: 0 };
      map.set(key, { total: prev.total + p.montant, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([nom, v]) => ({ nom, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [paiements]);

  const offresTerrain = useMemo(
    () => (toutesOffres ?? []).filter(o => o.type === 'terrain_simple' || o.type === 'terrain_tf'),
    [toutesOffres]
  );

  return (
    <div className="space-y-5">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Terrains</h2>
          <p className="text-sm text-gray-400 mt-1">Simples · Viabilisés · GIE Mariama SAGNA</p>
        </div>
        <button onClick={refetchAll} className="text-xs text-gray-400 hover:text-green-600 transition-colors">
          Actualiser
        </button>
      </div>

      {/* ── Onglets Offres / Souscriptions ── */}
      <div className="flex w-full bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('offres')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'offres' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Lotissements ({offresTerrain.length})
        </button>
        <button
          onClick={() => setTab('souscriptions')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'souscriptions' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Souscriptions ({stats.nb_simples + statsTF.nb})
        </button>
      </div>

      {tab === 'offres' && (
        <CatalogueOffres
          types={['terrain_simple', 'terrain_tf']}
          offres={toutesOffres ?? []}
          loading={lo}
          onChanged={ro}
          noun="lotissement"
        />
      )}

      {tab === 'souscriptions' && (
      <div className="space-y-5">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="animate-fade-in-up bg-white rounded-xl border border-emerald-100 p-4 transition-all duration-200 hover:shadow-md hover:border-emerald-200">
          <p className="text-2xl font-black text-blue-600 tabular-nums">{stats.nb_terrains_simples}</p>
          <p className="text-xs text-gray-400 mt-0.5">Terrains Simples</p>
          {stats.verse_simple > 0 && <p className="text-xs font-semibold text-gray-700 mt-2">{formatCurrency(stats.verse_simple)}</p>}
        </div>
        <div className="animate-fade-in-up bg-white rounded-xl border border-emerald-100 p-4 transition-all duration-200 hover:shadow-md hover:border-emerald-200" style={{ animationDelay: '60ms' }}>
          <p className="text-2xl font-black text-green-600 tabular-nums">{statsTF.nb_terrains}</p>
          <p className="text-xs text-gray-400 mt-0.5">Terrains Viabilisés</p>
          {statsTF.verse > 0 && <p className="text-xs font-semibold text-gray-700 mt-2">{formatCurrency(statsTF.verse)}</p>}
        </div>
        <div className="animate-fade-in-up bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 transition-all duration-200 hover:shadow-md" style={{ animationDelay: '120ms' }}>
          <p className="text-base font-black text-green-700 tabular-nums">{formatCurrency(totalVerse)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total encaissé</p>
          <p className="text-xs text-gray-400 mt-1">{(stats.nb_simples) + statsTF.nb} dossier{(stats.nb_simples + statsTF.nb) > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Filtres + actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 placeholder:text-gray-300 bg-white"
        />
        <div className="flex gap-1 flex-wrap">
          {([
            { id: 'tous',   label: `Tous (${stats.nb_simples + statsTF.nb})` },
            { id: 'simple', label: `Simples (${stats.nb_simples})` },
            { id: 'tf',     label: `Viabilisés (${statsTF.nb})` },
          ] as { id: FiltreCategorie; label: string }[]).map(f => (
            <button key={f.id} onClick={() => setFiltreCategorie(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtreCategorie === f.id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 border border-emerald-300 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:bg-emerald-50 whitespace-nowrap">
            <Upload className="w-4 h-4" /> Importer
          </button>
          <button onClick={() => setShowNouveauDossier(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            + Nouveau dossier
          </button>
        </div>
      </div>

      {/* ── Section Terrains Viabilisés ── */}
      {filtreCategorie !== 'simple' && (
      <div className="space-y-4">
        {filtreCategorie === 'tous' && (
          <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Terrains Viabilisés</p>
        )}
        {ltf ? <Spinner /> : filteredTF.length === 0 ? (
          <div className="bg-white rounded-2xl border border-emerald-100 p-10 text-center">
            <p className="text-sm text-gray-400">Aucun dossier Terrain Viabilisé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTF.map(s => {
              const m = (membres ?? []).find(mb => mb.id === s.membre_id);
              const o = (toutesOffres ?? []).find(of => of.id === s.offre_id);
              const tv  = s.acompte_verse + s.nb_mensualites_payees * s.mensualite;
              const pct = s.prix_total > 0 ? Math.round((tv / s.prix_total) * 100) : 0;
              return (
                <div key={s.id}
                  className="bg-white rounded-2xl border border-emerald-100 p-4 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 hover:border-green-200 transition-all duration-200"
                  onClick={() => setSelectedTF(s)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{m?.prenom} {m?.nom}</p>
                      <p className="text-xs text-gray-400">{infosMembre(m) || '—'}</p>
                    </div>
                    <Badge variant="green">Terrain Viabilisé</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <p>{localisationSouscription(o, s.site, LABELS_SITE)}</p>
                    <p>{s.nb_terrains} parcelle{s.nb_terrains > 1 ? 's' : ''} × {formatCurrency(o?.prix_unitaire ?? Math.round(s.prix_total / (s.nb_terrains || 1)))}{o?.surface_m2 ? ` (${formatSurface(o.surface_m2)})` : ''}</p>
                    <p>Prix total : <span className="font-semibold text-gray-900">{formatCurrency(s.prix_total)}</span></p>
                    <p>Acompte : <span className={`font-semibold ${s.acompte_verse >= s.acompte_requis ? 'text-green-700' : 'text-amber-700'}`}>
                      {formatCurrency(s.acompte_verse)} / {formatCurrency(s.acompte_requis)}
                    </span></p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Avancement</span><span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ── Section Terrains Simples ── */}
      {filtreCategorie !== 'tf' && (
      <div className="space-y-4">
        {filtreCategorie === 'tous' && (
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Terrains Simples</p>
        )}
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex gap-1 flex-wrap">
              {(['tous', 'en_cours', 'solde'] as const).map(f => (
                <button key={f} onClick={() => setFiltreStatut(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    filtreStatut === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {f === 'tous' ? 'Tous statuts' : f === 'en_cours' ? 'En cours' : 'Soldés'}
                </button>
              ))}
            </div>

            {loading ? (
              <Spinner />
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">Aucune souscription trouvée</p>
            ) : (
              <>
                {/* Mobile */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {filtered.map(s => {
                    const m = (membres ?? []).find(mb => mb.id === s.membre_id);
                    return (
                      <div key={s.id} onClick={() => setSelected(s)}
                        className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {m ? `${m.prenom[0]}${m.nom[0]}` : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m?.prenom} {m?.nom}</p>
                          <p className="text-xs text-gray-400">
                            {[infosMembre(m), `${s.nb_terrains} terrain${s.nb_terrains > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
                          </p>
                          <ProgressBar value={s.pourcentage} className="mt-1" />
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-green-700">{formatCurrency(s.montant_verse)}</p>
                          <Badge variant={s.statut === 'solde' ? 'green' : s.pourcentage >= 75 ? 'blue' : 'amber'} className="mt-0.5">
                            {s.statut === 'solde' ? 'SOLDÉ' : `${s.pourcentage}%`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-emerald-100">
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Membre</th>
                        <th className="text-center text-xs font-semibold text-gray-400 py-3 px-4">Nbre</th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Versé</th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Reste</th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4 min-w-[110px]">Avancement</th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Statut</th>
                        <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(s => (
                        <SouscriptionRow key={s.id} s={s} membres={membres ?? []} onSelect={setSelected} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="px-4 py-3 border-t border-gray-50">
              <span className="text-xs text-gray-400">{filtered.length} souscription{filtered.length > 1 ? 's' : ''}</span>
            </div>
          </div>

        </div>
      </div>
      )}
      </div>
      )}

      {/* ── Panneaux ── */}
      {selected && (
        <DetailSouscription
          souscription={selected}
          membres={membres ?? []}
          offres={toutesOffres ?? []}
          onClose={() => setSelected(null)}
          onPaiementAdded={refetchAll}
        />
      )}
      {selectedTF && (
        <DetailTerrainTF
          souscription={selectedTF}
          membres={membres ?? []}
          offres={toutesOffres ?? []}
          onClose={() => setSelectedTF(null)}
          onPaiementAdded={refetchAll}
        />
      )}
      {showNouveauDossier && (
        <NouveauDossierTerrainsModal
          membres={membres ?? []}
          offresSimples={offresSimples}
          offresTF={offresTF}
          onClose={() => setShowNouveauDossier(false)}
          onCreated={refetchAll}
        />
      )}
      {showImport && (
        <ImportModal
          type="terrains"
          membres={membres ?? []}
          offres={toutesOffres ?? []}
          onClose={() => setShowImport(false)}
          onImported={refetchAll}
        />
      )}
    </div>
  );
}
