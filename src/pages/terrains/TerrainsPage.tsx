import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import {
  fetchMembres,
  fetchSouscriptionsTerrain,
  fetchPaiementsTerrain,
  fetchPaiementsTerrainBySouscription,
} from '@/lib/queries';
import type { Membre, SouscriptionTerrain, PaiementTerrain } from '@/types';
import { LABELS_VERSEMENT, LABELS_MODE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Panneau de détail ────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 bg-black/30 flex items-start justify-end z-50" onClick={onClose}>
      <div
        className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto flex flex-col"
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

// ─── Ligne souscription ───────────────────────────────────────────────────────
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
  const [search, setSearch]           = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'tous' | 'en_cours' | 'solde'>('tous');
  const [selected, setSelected]       = useState<SouscriptionTerrain | null>(null);

  const { data: membres,       loading: lm, refetch: rm } = useAsync(fetchMembres);
  const { data: souscriptions, loading: ls, refetch: rs } = useAsync(fetchSouscriptionsTerrain);
  const { data: paiements,     loading: lp               } = useAsync(fetchPaiementsTerrain);

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
    <div className="space-y-5 max-w-6xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
          ) : (
            <div className="overflow-x-auto">
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                        Aucune souscription trouvée
                      </td>
                    </tr>
                  ) : (
                    filtered.map(s => (
                      <SouscriptionRow
                        key={s.id}
                        s={s}
                        membres={membres ?? []}
                        onSelect={setSelected}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
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

          {/* Modes de paiement */}
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

      {selected && (
        <DetailSouscription
          souscription={selected}
          membres={membres ?? []}
          onClose={() => setSelected(null)}
          onPaiementAdded={refetchAll}
        />
      )}
    </div>
  );
}
