import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { fetchMembres } from '@/lib/queries';
import type { Membre } from '@/types';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { formatDate } from '@/lib/utils';

type Filtre = 'tous' | 'terrains' | 'logements' | 'les_deux' | 'inactif';

function getInitiales(nom: string, prenom: string) {
  return `${prenom[0]}${nom[0]}`.toUpperCase();
}

function MemberRow({ m }: { m: Membre }) {
  const hasTerrain  = m.modules.includes('terrains');
  const hasLogement = m.modules.includes('logements');

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {getInitiales(m.nom, m.prenom)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{m.prenom} {m.nom}</p>
            <p className="text-xs text-gray-400">{m.id_membre}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">{m.telephone ?? '—'}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1 flex-wrap">
          {hasTerrain  && <Badge variant="blue">Terrains</Badge>}
          {hasLogement && <Badge variant="purple">Logements</Badge>}
          {!hasTerrain && !hasLogement && <span className="text-xs text-gray-300">—</span>}
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge variant={m.statut === 'actif' ? 'green' : 'gray'}>
          {m.statut === 'actif' ? 'Actif' : 'Inactif'}
        </Badge>
      </td>
      <td className="py-3 px-4 text-xs text-gray-400">{formatDate(m.created_at)}</td>
    </tr>
  );
}

export default function MembresPage() {
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  const { data: membres, loading, error, refetch } = useAsync(fetchMembres);

  const stats = useMemo(() => {
    if (!membres) return { total: 0, actifs: 0, terrains: 0, logements: 0, les_deux: 0 };
    return {
      total:     membres.length,
      actifs:    membres.filter(m => m.statut === 'actif').length,
      terrains:  membres.filter(m => m.modules.includes('terrains')).length,
      logements: membres.filter(m => m.modules.includes('logements')).length,
      les_deux:  membres.filter(m => m.modules.includes('terrains') && m.modules.includes('logements')).length,
    };
  }, [membres]);

  const filtered = useMemo(() => {
    if (!membres) return [];
    return membres.filter(m => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.nom.toLowerCase().includes(q) ||
        m.prenom.toLowerCase().includes(q) ||
        m.id_membre.toLowerCase().includes(q) ||
        (m.telephone ?? '').includes(q);

      const matchFiltre =
        filtre === 'tous'      ? true :
        filtre === 'terrains'  ? (m.modules.includes('terrains') && !m.modules.includes('logements')) :
        filtre === 'logements' ? (m.modules.includes('logements') && !m.modules.includes('terrains')) :
        filtre === 'les_deux'  ? (m.modules.includes('terrains') && m.modules.includes('logements')) :
        m.statut === 'inactif';

      return matchSearch && matchFiltre;
    });
  }, [membres, search, filtre]);

  const filtres: { id: Filtre; label: string; count: number }[] = [
    { id: 'tous',      label: 'Tous',          count: stats.total },
    { id: 'terrains',  label: 'Terrains seul', count: stats.terrains - stats.les_deux },
    { id: 'logements', label: 'Logements seul',count: stats.logements - stats.les_deux },
    { id: 'les_deux',  label: 'Les deux',      count: stats.les_deux },
    { id: 'inactif',   label: 'Inactifs',      count: stats.total - stats.actifs },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Membres</h2>
          <p className="text-sm text-gray-400 mt-1">Annuaire complet des membres du GIE</p>
        </div>
        <button
          onClick={refetch}
          className="text-xs text-gray-400 hover:text-green-600 transition-colors"
        >
          Actualiser
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total membres', value: stats.total,     color: 'text-gray-900' },
          { label: 'Actifs',        value: stats.actifs,    color: 'text-green-600' },
          { label: 'Terrains',      value: stats.terrains,  color: 'text-blue-600' },
          { label: 'Logements',     value: stats.logements, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400 placeholder:text-gray-300"
          />
          <div className="flex gap-1 flex-wrap">
            {filtres.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  filtre === f.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                }`}
              >
                {f.label} <span className="opacity-70">({f.count})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={refetch} className="mt-3 text-xs text-green-600 hover:underline">Réessayer</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Membre</th>
                  <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Téléphone</th>
                  <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Modules</th>
                  <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Statut</th>
                  <th className="text-left text-xs font-semibold text-gray-400 py-3 px-4">Adhésion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                      Aucun membre correspondant
                    </td>
                  </tr>
                ) : (
                  filtered.map(m => <MemberRow key={m.id} m={m} />)
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} membre{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          + Nouveau membre
        </button>
      </div>
    </div>
  );
}
