import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import {
  fetchMembres,
  fetchSouscriptionsLogement,
  fetchPaiementsLogement,
  fetchPaiementsLogementBySouscription,
} from '@/lib/queries';
import type { Membre, SouscriptionLogement, PaiementLogement, TypeBien } from '@/types';
import { LABELS_MODE, LABELS_SITE, LABELS_TYPE_BIEN } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import NouveauDossierModal from '@/components/NouveauDossierModal';
import { formatCurrency, formatDate } from '@/lib/utils';

function statutVariant(statut: SouscriptionLogement['statut']) {
  return statut === 'livre' ? 'green' : statut === 'attribue' ? 'blue' : statut === 'valide' ? 'purple' : 'amber';
}
function statutLabel(statut: SouscriptionLogement['statut']) {
  return statut === 'livre' ? 'Livré' : statut === 'attribue' ? 'Attribué' : statut === 'valide' ? 'Validé' : 'En cours';
}

function typeBadge(type: TypeBien) {
  if (type === 'F3')      return <Badge variant="purple">Villa F3</Badge>;
  if (type === 'terrain') return <Badge variant="green">Terrain TF</Badge>;
  return                         <Badge variant="blue">Villa F2</Badge>;
}

// ─── Panneau de détail ────────────────────────────────────────────────────────
function DetailLogement({
  souscription,
  membres,
  onClose,
  onPaiementAdded,
}: {
  souscription: SouscriptionLogement;
  membres: Membre[];
  onClose: () => void;
  onPaiementAdded: () => void;
}) {
  const membre = membres.find(m => m.id === souscription.membre_id);
  const { data: paiements, loading, refetch } = useAsync(
    () => fetchPaiementsLogementBySouscription(souscription.id),
    [souscription.id]
  );

  const isTerrainTF    = souscription.type_villa === 'terrain';
  const acomptePct     = souscription.acompte_requis > 0
    ? Math.round((souscription.acompte_verse / souscription.acompte_requis) * 100)
    : 0;
  const mensualitesPct = Math.round((souscription.nb_mensualites_payees / 120) * 100);
  const totalVerse     = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct       = souscription.prix_total > 0 ? Math.round((totalVerse / souscription.prix_total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end z-50" onClick={onClose}>
      <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {membre?.id_membre} · {LABELS_TYPE_BIEN[souscription.type_villa]} · {souscription.titre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        {/* Infos */}
        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-gray-400">Type</p><p className="font-semibold text-gray-900">{LABELS_TYPE_BIEN[souscription.type_villa]}</p></div>
            <div><p className="text-gray-400">Titre</p><p className="font-semibold text-gray-900">{souscription.titre}</p></div>
            <div className="col-span-2"><p className="text-gray-400">Site</p><p className="font-semibold text-gray-900">{LABELS_SITE[souscription.site]}</p></div>
            <div><p className="text-gray-400">Prix total</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.prix_total)}</p></div>
            <div>
              <p className="text-gray-400">{isTerrainTF ? 'Mensualité' : 'Mensualité'}</p>
              <p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}/mois</p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {typeBadge(souscription.type_villa)}
            <Badge variant={statutVariant(souscription.statut)}>{statutLabel(souscription.statut)}</Badge>
          </div>
        </div>

        {/* Acompte */}
        <div className="p-6 border-b border-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acompte (8%)</p>
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
          <p className="text-xs text-gray-400">{acomptePct}% de l'acompte versé</p>
        </div>

        {/* Mensualités */}
        <div className="p-6 border-b border-gray-50 space-y-3">
          <div className="flex justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mensualités</p>
            <span className="text-xs text-gray-400">{souscription.nb_mensualites_payees} / 120</span>
          </div>
          <ProgressBar value={mensualitesPct} />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><p className="text-gray-400">Mensualité</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}</p></div>
            <div><p className="text-gray-400">Total versé</p><p className="font-semibold text-green-700">{formatCurrency(souscription.nb_mensualites_payees * souscription.mensualite)}</p></div>
          </div>
        </div>

        {/* Avancement global */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Avancement global</span><span>{totalPct}%</span>
          </div>
          <ProgressBar value={totalPct} />
          <p className="text-xs text-gray-400 mt-2">{formatCurrency(totalVerse)} sur {formatCurrency(souscription.prix_total)}</p>
        </div>

        {/* Historique */}
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

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-2">
          <button
            onClick={() => { refetch(); onPaiementAdded(); }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            + Mensualité
          </button>
          <button
            onClick={() => { refetch(); onPaiementAdded(); }}
            className="flex-1 border border-green-600 text-green-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            + Acompte
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte dossier ────────────────────────────────────────────────────────────
function DossierCard({ s, membres, onSelect }: { s: SouscriptionLogement; membres: Membre[]; onSelect: (s: SouscriptionLogement) => void }) {
  const membre     = membres.find(m => m.id === s.membre_id);
  const acomptePct = s.acompte_requis > 0 ? Math.round((s.acompte_verse / s.acompte_requis) * 100) : 0;
  const totalVerse = s.acompte_verse + s.nb_mensualites_payees * s.mensualite;
  const totalPct   = s.prix_total > 0 ? Math.round((totalVerse / s.prix_total) * 100) : 0;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-green-200 transition-all"
      onClick={() => onSelect(s)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{membre?.prenom} {membre?.nom}</p>
          <p className="text-xs text-gray-400">{membre?.id_membre}</p>
        </div>
        <Badge variant={statutVariant(s.statut)}>{statutLabel(s.statut)}</Badge>
      </div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {typeBadge(s.type_villa)}
        <Badge variant="gray">{s.titre}</Badge>
        <Badge variant="gray">{s.site === 'ndoyenne' ? 'Sébikhotane' : 'Diender'}</Badge>
      </div>
      <div className="space-y-1.5 text-xs text-gray-600 mb-3">
        <div className="flex justify-between">
          <span>Acompte</span>
          <span className={acomptePct >= 100 ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
            {formatCurrency(s.acompte_verse)} / {formatCurrency(s.acompte_requis)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Mensualités</span>
          <span className="font-semibold">{s.nb_mensualites_payees} / 120</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Avancement</span><span>{totalPct}%</span>
      </div>
      <ProgressBar value={totalPct} />
      <p className="text-xs text-gray-400 mt-2 text-right">{formatCurrency(s.prix_total)}</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
type FiltreType = 'tous' | 'F2' | 'F3' | 'terrain';
type FiltreStatut = 'tous' | 'en_cours' | 'valide' | 'attribue';

export default function LogementsPage() {
  const [search, setSearch]             = useState('');
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous');
  const [filtreType, setFiltreType]     = useState<FiltreType>('tous');
  const [selected, setSelected]         = useState<SouscriptionLogement | null>(null);
  const [showModal, setShowModal]       = useState(false);

  const { data: membres,       loading: lm, refetch: rm } = useAsync(fetchMembres);
  const { data: souscriptions, loading: ls, refetch: rs } = useAsync(fetchSouscriptionsLogement);
  const { data: paiements,     loading: lp               } = useAsync(fetchPaiementsLogement);

  const loading = lm || ls || lp;
  const refetchAll = () => { rm(); rs(); };

  const filtered = useMemo(() => {
    if (!souscriptions || !membres) return [];
    return souscriptions.filter(s => {
      const membre = membres.find(m => m.id === s.membre_id);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (membre?.nom ?? '').toLowerCase().includes(q) ||
        (membre?.prenom ?? '').toLowerCase().includes(q) ||
        (membre?.id_membre ?? '').toLowerCase().includes(q);
      return matchSearch &&
        (filtreStatut === 'tous' || s.statut === filtreStatut) &&
        (filtreType   === 'tous' || s.type_villa === filtreType);
    });
  }, [souscriptions, membres, search, filtreStatut, filtreType]);

  const stats = useMemo(() => {
    const list = souscriptions ?? [];
    return {
      nb_f2:               list.filter(s => s.type_villa === 'F2').length,
      nb_f3:               list.filter(s => s.type_villa === 'F3').length,
      nb_terrain:          list.filter(s => s.type_villa === 'terrain').length,
      total_acompte_verse: list.reduce((a, s) => a + s.acompte_verse, 0),
      nb_valides:          list.filter(s => s.statut !== 'en_cours').length,
    };
  }, [souscriptions]);

  const totalPaiements = useMemo(() =>
    (paiements ?? []).reduce((a, p) => a + p.montant, 0), [paiements]);

  const filtresType: { id: FiltreType; label: string; count: number }[] = [
    { id: 'tous',    label: 'Tous',         count: (souscriptions ?? []).length },
    { id: 'F2',      label: 'Villa F2',     count: stats.nb_f2 },
    { id: 'F3',      label: 'Villa F3',     count: stats.nb_f3 },
    { id: 'terrain', label: 'Terrain TF',   count: stats.nb_terrain },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Logements &amp; Terrains TF</h2>
          <p className="text-sm text-gray-400 mt-1">Programme PICLOM 2026–2029 · Le Millénium 7SD</p>
        </div>
        <button onClick={refetchAll} className="text-xs text-gray-400 hover:text-green-600 transition-colors">
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Villa F2',         value: stats.nb_f2,                            color: 'text-blue-600' },
          { label: 'Villa F3',         value: stats.nb_f3,                            color: 'text-purple-600' },
          { label: 'Terrains TF',      value: stats.nb_terrain,                       color: 'text-green-600' },
          { label: 'Total encaissé',   value: formatCurrency(totalPaiements),          color: 'text-gray-900', small: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`font-black ${s.color} ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Offre promoteur */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { type: 'F2',      label: 'Villa F2',   prix: '16 000 000', mensualite: '133 333', acompte: '1 280 000', color: 'border-blue-200 bg-blue-50/50' },
          { type: 'F3',      label: 'Villa F3',   prix: '20 000 000', mensualite: '166 667', acompte: '1 600 000', color: 'border-purple-200 bg-purple-50/50' },
          { type: 'terrain', label: 'Terrain TF', prix: 'Variable',   mensualite: 'Variable', acompte: '8% du prix', color: 'border-green-200 bg-green-50/50' },
        ].map(v => (
          <div key={v.type} className={`rounded-xl border p-4 ${v.color}`}>
            <p className="text-sm font-black text-gray-900 mb-2">{v.label}</p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <div><p className="text-gray-400">Prix</p><p className="font-semibold">{v.prix}{v.type !== 'terrain' ? ' F' : ''}</p></div>
              <div><p className="text-gray-400">Acompte</p><p className="font-semibold">{v.acompte}{v.type !== 'terrain' ? ' F' : ''}</p></div>
              <div><p className="text-gray-400">Mensualité</p><p className="font-semibold">{v.mensualite}{v.type !== 'terrain' ? ' F' : ''}</p></div>
            </div>
            {v.type !== 'terrain' && <p className="text-xs text-gray-400 mt-2">Durée : 120 mois</p>}
            {v.type === 'terrain' && <p className="text-xs text-gray-400 mt-2">Sites : Sébikhotane · Diender</p>}
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-green-400 placeholder:text-gray-300 bg-white"
        />
        <div className="flex gap-1 flex-wrap">
          {filtresType.map(f => (
            <button key={f.id} onClick={() => setFiltreType(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtreType === f.id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['tous', 'en_cours', 'valide', 'attribue'] as FiltreStatut[]).map(f => (
            <button key={f} onClick={() => setFiltreStatut(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtreStatut === f
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'tous' ? 'Tous statuts' : f === 'en_cours' ? 'En cours' : f === 'valide' ? 'Validés' : 'Attribués'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
        >
          + Nouveau dossier
        </button>
      </div>

      {/* Grille de dossiers */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">Aucun dossier correspondant</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-green-600 hover:underline"
          >
            Créer le premier dossier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <DossierCard key={s.id} s={s} membres={membres ?? []} onSelect={setSelected} />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-right">
        {filtered.length} dossier{filtered.length > 1 ? 's' : ''} · Total encaissé :{' '}
        <span className="font-semibold text-green-700">{formatCurrency(totalPaiements)}</span>
      </div>

      {selected && (
        <DetailLogement
          souscription={selected}
          membres={membres ?? []}
          onClose={() => setSelected(null)}
          onPaiementAdded={refetchAll}
        />
      )}

      {showModal && (
        <NouveauDossierModal
          membres={membres ?? []}
          onClose={() => setShowModal(false)}
          onCreated={refetchAll}
        />
      )}
    </div>
  );
}
