import { useState, useMemo } from 'react';
import { MapPin, Tag } from 'lucide-react';
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
import type { Membre, SouscriptionTerrain, PaiementTerrain, SouscriptionLogement, PaiementLogement, Offre } from '@/types';
import { LABELS_VERSEMENT, LABELS_MODE, LABELS_SITE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import NouveauDossierModal from '@/components/NouveauDossierModal';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Carte offre active (terrain simple) ─────────────────────────────────────
function OffreSimpleCard({ offre }: { offre: Offre }) {
  const mensualite = Math.round(offre.prix_unitaire / offre.nb_mensualites);
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-blue-900">{offre.nom}</p>
          <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{offre.localisation}
          </p>
        </div>
        <Tag className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Prix/parcelle</p>
          <p className="font-bold text-gray-900">{formatCurrency(offre.prix_unitaire)}</p>
        </div>
        {offre.frais_dossier > 0 && (
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-gray-400">Frais dossier</p>
            <p className="font-bold text-gray-700">{formatCurrency(offre.frais_dossier)}</p>
          </div>
        )}
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Mensualité</p>
          <p className="font-bold text-green-700">{formatCurrency(mensualite)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Durée</p>
          <p className="font-bold text-blue-700">{offre.nb_mensualites} mois</p>
        </div>
      </div>
    </div>
  );
}

// ─── Carte offre active (terrain TF) ─────────────────────────────────────────
function OffreTFCard({ offre }: { offre: Offre }) {
  const acompte    = Math.round(offre.prix_unitaire * offre.taux_acompte);
  const mensualite = Math.round(offre.prix_unitaire / offre.nb_mensualites);
  return (
    <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-green-900">{offre.nom}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{offre.localisation}
          </p>
        </div>
        <Tag className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Prix</p>
          <p className="font-bold text-gray-900">{formatCurrency(offre.prix_unitaire)}</p>
        </div>
        {acompte > 0 && (
          <div className="bg-white rounded-lg p-2 text-center">
            <p className="text-gray-400">Acompte {Math.round(offre.taux_acompte * 100)}%</p>
            <p className="font-bold text-amber-700">{formatCurrency(acompte)}</p>
          </div>
        )}
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Mensualité</p>
          <p className="font-bold text-green-700">{formatCurrency(mensualite)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Durée</p>
          <p className="font-bold text-green-700">{offre.nb_mensualites} mois</p>
        </div>
      </div>
      {offre.frais_dossier > 0 && (
        <p className="text-xs text-gray-400">Frais de dossier : {formatCurrency(offre.frais_dossier)}</p>
      )}
    </div>
  );
}

// ─── Panneau détail — terrain simple ─────────────────────────────────────────
function DetailSouscription({
  souscription,
  membres,
  onClose,
  onPaiementAdded,
}: {
  souscription: SouscriptionTerrain;
  membres: Membre[];
  onClose: () => void;
  onPaiementAdded: () => void;
}) {
  const membre = membres.find(m => m.id === souscription.membre_id);
  const { data: paiements, loading, refetch } = useAsync(
    () => fetchPaiementsTerrainBySouscription(souscription.id),
    [souscription.id]
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-start sm:justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:h-full sm:max-w-md rounded-t-2xl sm:rounded-none shadow-2xl overflow-y-auto flex flex-col max-h-[92dvh] sm:max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {membre?.id_membre} · {souscription.nb_terrains} terrain{souscription.nb_terrains > 1 ? 's' : ''}
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

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <button
            onClick={() => { refetch(); onPaiementAdded(); }}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            + Enregistrer un versement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panneau détail — terrain TF ─────────────────────────────────────────────
function DetailTerrainTF({
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

  const acomptePct = souscription.acompte_requis > 0
    ? Math.round((souscription.acompte_verse / souscription.acompte_requis) * 100)
    : 0;
  const totalVerse = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct   = souscription.prix_total > 0 ? Math.round((totalVerse / souscription.prix_total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-start sm:justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:h-full sm:max-w-md rounded-t-2xl sm:rounded-none shadow-2xl overflow-y-auto flex flex-col max-h-[92dvh] sm:max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {membre?.id_membre} · Terrain TF · {souscription.titre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-gray-400">Site</p><p className="font-semibold text-gray-900">{LABELS_SITE[souscription.site]}</p></div>
            <div><p className="text-gray-400">Prix total</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.prix_total)}</p></div>
            <div><p className="text-gray-400">Mensualité</p><p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}/mois</p></div>
            <div><p className="text-gray-400">Date</p><p className="font-semibold text-gray-900">{formatDate(souscription.date_souscription)}</p></div>
          </div>
        </div>

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
        </div>

        <div className="p-6 border-b border-gray-50 space-y-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Avancement global</span><span>{totalPct}%</span>
          </div>
          <ProgressBar value={totalPct} />
          <p className="text-xs text-gray-400">{formatCurrency(totalVerse)} sur {formatCurrency(souscription.prix_total)}</p>
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
        <p className="text-xs text-gray-400">{membre?.id_membre}</p>
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
export default function TerrainsPage() {
  const [search, setSearch]             = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'en_cours' | 'solde'>('tous');
  const [selected, setSelected]         = useState<SouscriptionTerrain | null>(null);
  const [selectedTF, setSelectedTF]     = useState<SouscriptionLogement | null>(null);
  const [showDossierModal, setShowDossierModal] = useState(false);

  const { data: membres,          loading: lm, refetch: rm } = useAsync(fetchMembres);
  const { data: souscriptions,    loading: ls, refetch: rs } = useAsync(fetchSouscriptionsTerrain);
  const { data: paiements,        loading: lp               } = useAsync(fetchPaiementsTerrain);
  const { data: toutesOffres                                 } = useAsync(fetchOffres);
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
  const refetchAll = () => { rm(); rs(); rtf(); };

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
      const matchStatut = filtreStatut === 'tous' || s.statut === filtreStatut;
      return matchSearch && matchStatut;
    });
  }, [souscriptions, membres, search, filtreStatut]);

  const stats = useMemo(() => {
    const list = souscriptions ?? [];
    return {
      total_terrains: list.reduce((a, s) => a + s.nb_terrains, 0),
      total_verse:    list.reduce((a, s) => a + s.montant_verse, 0),
      total_reste:    list.reduce((a, s) => a + s.reste_a_verser, 0),
      nb_soldes:      list.filter(s => s.statut === 'solde').length,
    };
  }, [souscriptions]);

  const statsTF = useMemo(() => {
    const list = souscriptionsTF;
    return {
      nb:    list.length,
      verse: list.reduce((a, s) => a + s.acompte_verse + s.nb_mensualites_payees * s.mensualite, 0),
    };
  }, [souscriptionsTF]);

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

  return (
    <div className="space-y-4">

      {/* ══ TERRAINS SIMPLES + TF côte à côte ════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

      {/* ── Terrains Simples ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Terrains Simples</h2>
            <p className="text-sm text-gray-400 mt-1">
              Suivi des souscriptions et versements · Objectif : 460 000 FCFA / terrain
            </p>
          </div>
          <button onClick={refetchAll} className="text-xs text-gray-400 hover:text-green-600 transition-colors">
            Actualiser
          </button>
        </div>

        {offresSimples.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Offres disponibles ({offresSimples.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {offresSimples.map(o => <OffreSimpleCard key={o.id} offre={o} />)}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Terrains souscrits', value: stats.total_terrains,              color: 'text-gray-900' },
            { label: 'Total encaissé',     value: formatCurrency(stats.total_verse),  color: 'text-green-600', small: true },
            { label: 'Reste à encaisser',  value: formatCurrency(stats.total_reste),  color: 'text-amber-600', small: true },
            { label: 'Dossiers SOLDÉS',    value: stats.nb_soldes,                    color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className={`font-black ${s.color} ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Rechercher un membre…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400 placeholder:text-gray-300"
              />
              <div className="flex gap-1">
                {(['tous', 'en_cours', 'solde'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltreStatut(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      filtreStatut === f
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                    }`}
                  >
                    {f === 'tous' ? 'Tous' : f === 'en_cours' ? 'En cours' : 'Soldés'}
                  </button>
                ))}
              </div>
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
                          <p className="text-xs text-gray-400">{m?.id_membre} · {s.nb_terrains} terrain{s.nb_terrains > 1 ? 's' : ''}</p>
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
                      <tr className="border-b border-gray-100">
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

            <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">{filtered.length} souscription{filtered.length > 1 ? 's' : ''}</span>
              <button className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                + Nouvelle souscription
              </button>
            </div>
          </div>

          {/* Encaisseurs */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-900">Encaisseurs</p>
              <p className="text-xs text-gray-400 mt-0.5">Classement par montant collecté</p>
            </div>
            {loading ? (
              <Spinner />
            ) : (
              <div className="p-4 space-y-3">
                {encaisseurs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Aucun versement enregistré</p>
                ) : (
                  encaisseurs.map(e => {
                    const pct = stats.total_verse > 0 ? Math.round((e.total / stats.total_verse) * 100) : 0;
                    return (
                      <div key={e.nom}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-800">{e.nom}</span>
                          <span className="text-gray-400">{e.count} vers.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={pct} className="flex-1" />
                          <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                        </div>
                        <p className="text-xs text-green-700 font-semibold mt-0.5">{formatCurrency(e.total)}</p>
                      </div>
                    );
                  })
                )}
              </div>
            )}
            {!loading && paiements && paiements.length > 0 && (
              <div className="p-4 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Modes de paiement</p>
                {(() => {
                  const modes: Record<string, number> = {};
                  paiements.forEach(p => { modes[p.mode_paiement] = (modes[p.mode_paiement] ?? 0) + p.montant; });
                  const total = Object.values(modes).reduce((a, b) => a + b, 0);
                  const colors: Record<string, string> = {
                    wave: 'bg-blue-500', orange_money: 'bg-orange-400',
                    banque: 'bg-green-500', autres: 'bg-gray-400',
                  };
                  return Object.entries(modes).sort(([, a], [, b]) => b - a).map(([mode, montant]) => (
                    <div key={mode} className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${colors[mode] ?? 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-600 flex-1">{LABELS_MODE[mode as keyof typeof LABELS_MODE] ?? mode}</span>
                      <span className="text-xs text-gray-400">{Math.round((montant / total) * 100)}%</span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>{/* fin Terrains Simples */}

      {/* ── Terrains TF ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">Terrains TF</h2>
            <p className="text-sm text-gray-400 mt-1">Programme PICLOM · Le Millénium 7SD · Titre Foncier</p>
          </div>
          <button
            onClick={() => setShowDossierModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            + Nouveau dossier TF
          </button>
        </div>

        {offresTF.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Offres disponibles ({offresTF.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {offresTF.map(o => <OffreTFCard key={o.id} offre={o} />)}
            </div>
          </div>
        )}

        {/* KPIs TF */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-black text-green-600">{statsTF.nb}</p>
            <p className="text-xs text-gray-400 mt-0.5">Dossiers TF</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-base font-black text-green-700">{formatCurrency(statsTF.verse)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total encaissé</p>
          </div>
        </div>

        {ltf ? <Spinner /> : souscriptionsTF.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-400">Aucun dossier Terrain TF</p>
            <button
              onClick={() => setShowDossierModal(true)}
              className="mt-3 text-sm text-green-600 hover:underline"
            >
              Créer le premier dossier TF
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {souscriptionsTF.map(s => {
              const m = (membres ?? []).find(mb => mb.id === s.membre_id);
              const totalVerse = s.acompte_verse + s.nb_mensualites_payees * s.mensualite;
              const totalPct   = s.prix_total > 0 ? Math.round((totalVerse / s.prix_total) * 100) : 0;
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-green-200 transition-all"
                  onClick={() => setSelectedTF(s)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{m?.prenom} {m?.nom}</p>
                      <p className="text-xs text-gray-400">{m?.id_membre}</p>
                    </div>
                    <Badge variant="green">Terrain TF</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <p>{LABELS_SITE[s.site]} · {s.titre}</p>
                    <p>Prix : <span className="font-semibold text-gray-900">{formatCurrency(s.prix_total)}</span></p>
                    <p>Acompte : <span className={`font-semibold ${s.acompte_verse >= s.acompte_requis ? 'text-green-700' : 'text-amber-700'}`}>
                      {formatCurrency(s.acompte_verse)} / {formatCurrency(s.acompte_requis)}
                    </span></p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Avancement</span><span>{totalPct}%</span>
                  </div>
                  <ProgressBar value={totalPct} />
                </div>
              );
            })}
          </div>
        )}
      </div>{/* fin Terrains TF */}

      </div>{/* fin grid côte à côte */}

      {/* ── Panneaux ── */}
      {selected && (
        <DetailSouscription
          souscription={selected}
          membres={membres ?? []}
          onClose={() => setSelected(null)}
          onPaiementAdded={refetchAll}
        />
      )}
      {selectedTF && (
        <DetailTerrainTF
          souscription={selectedTF}
          membres={membres ?? []}
          onClose={() => setSelectedTF(null)}
          onPaiementAdded={refetchAll}
        />
      )}
      {showDossierModal && (
        <NouveauDossierModal
          membres={membres ?? []}
          initialType="terrain"
          onClose={() => setShowDossierModal(false)}
          onCreated={refetchAll}
        />
      )}
    </div>
  );
}
