import { useState, useMemo } from 'react';
import {
  souscriptionsLogement,
  paiementsLogement,
  getPaiementsLogementBySouscription,
  getMembreById,
} from '@/data/mockData';
import type { SouscriptionLogement } from '@/types';
import { LABELS_MODE, LABELS_SITE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Couleurs helpers ─────────────────────────────────────────────────────────
function statutVariant(statut: SouscriptionLogement['statut']) {
  return statut === 'livre'   ? 'green'  :
         statut === 'attribue'? 'blue'   :
         statut === 'valide'  ? 'purple' :
                                'amber';
}

function statutLabel(statut: SouscriptionLogement['statut']) {
  return statut === 'livre'    ? 'Livré'    :
         statut === 'attribue' ? 'Attribué' :
         statut === 'valide'   ? 'Validé'   :
                                 'En cours';
}

// ─── Détail d'un dossier ──────────────────────────────────────────────────────
function DetailLogement({
  souscription,
  onClose,
}: {
  souscription: SouscriptionLogement;
  onClose: () => void;
}) {
  const membre = getMembreById(souscription.membre_id);
  const paiements = getPaiementsLogementBySouscription(souscription.id);
  const acomptePct = Math.round((souscription.acompte_verse / souscription.acompte_requis) * 100);
  const mensualitesPct = Math.round((souscription.nb_mensualites_payees / 120) * 100);
  const totalVerse = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct = Math.round((totalVerse / souscription.prix_total) * 100);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end z-50" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{membre?.prenom} {membre?.nom}</p>
            <p className="text-xs text-gray-400">
              {membre?.id_membre} · Villa {souscription.type_villa} · {souscription.titre}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        {/* Infos dossier */}
        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-400">Type</p>
              <p className="font-semibold text-gray-900">Villa {souscription.type_villa}</p>
            </div>
            <div>
              <p className="text-gray-400">Titre</p>
              <p className="font-semibold text-gray-900">{souscription.titre}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-400">Site</p>
              <p className="font-semibold text-gray-900">{LABELS_SITE[souscription.site]}</p>
            </div>
            <div>
              <p className="text-gray-400">Prix total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(souscription.prix_total)}</p>
            </div>
            <div>
              <p className="text-gray-400">Mensualité</p>
              <p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}/mois</p>
            </div>
          </div>

          <Badge variant={statutVariant(souscription.statut)}>
            {statutLabel(souscription.statut)}
          </Badge>
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
            <div>
              <p className="text-gray-400">Mensualité</p>
              <p className="font-semibold text-gray-900">{formatCurrency(souscription.mensualite)}</p>
            </div>
            <div>
              <p className="text-gray-400">Total mensualités versées</p>
              <p className="font-semibold text-green-700">{formatCurrency(souscription.nb_mensualites_payees * souscription.mensualite)}</p>
            </div>
          </div>
        </div>

        {/* Avancement global */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Avancement global</span>
            <span>{totalPct}%</span>
          </div>
          <ProgressBar value={totalPct} />
          <p className="text-xs text-gray-400 mt-2">{formatCurrency(totalVerse)} versé sur {formatCurrency(souscription.prix_total)}</p>
        </div>

        {/* Historique */}
        <div className="p-6 flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historique ({paiements.length})
          </p>
          {paiements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré</p>
          ) : (
            <div className="space-y-2">
              {paiements.map(p => (
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
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            + Mensualité
          </button>
          <button className="flex-1 border border-green-600 text-green-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-50 transition-colors">
            + Acompte
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte dossier ────────────────────────────────────────────────────────────
function DossierCard({
  s,
  onSelect,
}: {
  s: SouscriptionLogement;
  onSelect: (s: SouscriptionLogement) => void;
}) {
  const membre = getMembreById(s.membre_id);
  const acomptePct = Math.round((s.acompte_verse / s.acompte_requis) * 100);
  const totalVerse = s.acompte_verse + s.nb_mensualites_payees * s.mensualite;
  const totalPct   = Math.round((totalVerse / s.prix_total) * 100);

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

      <div className="flex gap-2 mb-3 flex-wrap">
        <Badge variant={s.type_villa === 'F3' ? 'purple' : 'blue'}>Villa {s.type_villa}</Badge>
        <Badge variant="gray">{s.titre}</Badge>
        <Badge variant="gray">{s.site === 'ndoyenne' ? 'Sébikhotane' : 'Diender'}</Badge>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
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

      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Avancement global</span>
          <span>{totalPct}%</span>
        </div>
        <ProgressBar value={totalPct} />
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">{formatCurrency(s.prix_total)}</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function LogementsPage() {
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'en_cours' | 'valide' | 'attribue'>('tous');
  const [filtreType, setFiltreType]     = useState<'tous' | 'F2' | 'F3'>('tous');
  const [selected, setSelected] = useState<SouscriptionLogement | null>(null);

  const enriched = useMemo(() =>
    souscriptionsLogement.map(s => ({
      ...s,
      membre: getMembreById(s.membre_id),
    })), []);

  const filtered = useMemo(() =>
    enriched.filter(s => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (s.membre?.nom ?? '').toLowerCase().includes(q) ||
        (s.membre?.prenom ?? '').toLowerCase().includes(q) ||
        (s.membre?.id_membre ?? '').toLowerCase().includes(q);
      const matchStatut = filtreStatut === 'tous' || s.statut === filtreStatut;
      const matchType   = filtreType === 'tous'   || s.type_villa === filtreType;
      return matchSearch && matchStatut && matchType;
    }), [search, filtreStatut, filtreType, enriched]);

  const stats = useMemo(() => {
    const nb_f2   = souscriptionsLogement.filter(s => s.type_villa === 'F2').length;
    const nb_f3   = souscriptionsLogement.filter(s => s.type_villa === 'F3').length;
    const total_acompte_requis = souscriptionsLogement.reduce((a, s) => a + s.acompte_requis, 0);
    const total_acompte_verse  = souscriptionsLogement.reduce((a, s) => a + s.acompte_verse, 0);
    const nb_valides = souscriptionsLogement.filter(s => s.statut === 'valide' || s.statut === 'attribue' || s.statut === 'livre').length;
    return { nb_f2, nb_f3, total_acompte_requis, total_acompte_verse, nb_valides };
  }, []);

  const totalVersePaiements = useMemo(() =>
    paiementsLogement.reduce((a, p) => a + p.montant, 0), []);

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-black text-gray-900">Logements &amp; Titre Foncier</h2>
        <p className="text-sm text-gray-400 mt-1">
          Programme PICLOM 2026–2029 · Le Millénium 7SD · Villa F2 &amp; F3
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Dossiers Villa F2',   value: stats.nb_f2,   color: 'text-blue-600' },
          { label: 'Dossiers Villa F3',   value: stats.nb_f3,   color: 'text-purple-600' },
          { label: 'Acomptes versés',     value: formatCurrency(stats.total_acompte_verse), color: 'text-green-600', small: true },
          { label: 'Dossiers validés',    value: stats.nb_valides, color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`font-black ${s.color} ${s.small ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info PICLOM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { type: 'F2', prix: '16 000 000', mensualite: '133 333', acompte: '1 280 000', color: 'border-blue-200 bg-blue-50/50' },
          { type: 'F3', prix: '20 000 000', mensualite: '166 667', acompte: '1 600 000', color: 'border-purple-200 bg-purple-50/50' },
        ].map(v => (
          <div key={v.type} className={`rounded-xl border p-4 ${v.color}`}>
            <p className="text-sm font-black text-gray-900 mb-2">Villa {v.type}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Prix</p>
                <p className="font-semibold text-gray-900">{v.prix} F</p>
              </div>
              <div>
                <p className="text-gray-400">Acompte 8%</p>
                <p className="font-semibold text-gray-900">{v.acompte} F</p>
              </div>
              <div>
                <p className="text-gray-400">Mensualité</p>
                <p className="font-semibold text-gray-900">{v.mensualite} F</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Durée : 120 mois (10 ans)</p>
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
          {(['tous', 'en_cours', 'valide', 'attribue'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltreStatut(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtreStatut === f
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              {f === 'tous' ? 'Tous' : f === 'en_cours' ? 'En cours' : f === 'valide' ? 'Validés' : 'Attribués'}
            </button>
          ))}
          {(['tous', 'F2', 'F3'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltreType(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filtreType === f
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
              }`}
            >
              {f === 'tous' ? 'F2 & F3' : `Villa ${f}`}
            </button>
          ))}
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
          + Nouveau dossier
        </button>
      </div>

      {/* Grille des dossiers */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">Aucun dossier correspondant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <DossierCard key={s.id} s={s} onSelect={setSelected} />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-right">
        Total encaissé (logements) : <span className="font-semibold text-green-700">{formatCurrency(totalVersePaiements)}</span>
      </div>

      {selected && (
        <DetailLogement souscription={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
