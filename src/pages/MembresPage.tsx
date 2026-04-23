import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { fetchMembres, fetchSouscriptionsTerrain, fetchSouscriptionsLogement } from '@/lib/queries';
import type { Membre, SouscriptionTerrain, SouscriptionLogement } from '@/types';
import { LABELS_SITE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import NouveauMembreModal from '@/components/NouveauMembreModal';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Types de filtre ──────────────────────────────────────────────────────────
type Filtre =
  | 'tous'
  | 'terrain_simple'
  | 'terrain_tf'
  | 'logement_f2'
  | 'logement_f3'
  | 'les_deux'
  | 'inactif';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ nom, prenom, size = 'md' }: { nom: string; prenom: string; size?: 'sm' | 'md' | 'lg' }) {
  const initiales = `${prenom[0]}${nom[0]}`.toUpperCase();
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm`}>
      {initiales}
    </div>
  );
}

// ─── Bloc souscription terrain ────────────────────────────────────────────────
function BlocTerrain({ souscription }: { souscription: SouscriptionTerrain }) {
  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <p className="text-xs font-semibold text-blue-800">
            Terrain{souscription.nb_terrains > 1 ? 's' : ''} simple{souscription.nb_terrains > 1 ? 's' : ''} · {souscription.nb_terrains} parcelle{souscription.nb_terrains > 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant={souscription.statut === 'solde' ? 'green' : 'amber'}>
          {souscription.statut === 'solde' ? 'SOLDÉ' : 'En cours'}
        </Badge>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatCurrency(souscription.montant_verse)} versés</span>
        <span className="text-gray-400">/ {formatCurrency(souscription.montant_total)}</span>
      </div>
      <ProgressBar value={souscription.pourcentage} />
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Souscrit le {formatDate(souscription.date_souscription)}</span>
        <span className="font-semibold text-gray-700">{souscription.pourcentage}%</span>
      </div>
    </div>
  );
}

// ─── Bloc souscription logement / terrain TF ──────────────────────────────────
function BlocLogement({ souscription }: { souscription: SouscriptionLogement }) {
  const isTerrainTF  = souscription.type_villa === 'terrain';
  const acomptePct   = souscription.acompte_requis > 0
    ? Math.round((souscription.acompte_verse / souscription.acompte_requis) * 100)
    : 0;
  const totalVerse   = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct     = souscription.prix_total > 0 ? Math.round((totalVerse / souscription.prix_total) * 100) : 0;
  const color        = isTerrainTF ? 'green' : souscription.type_villa === 'F3' ? 'purple' : 'blue';
  const bgClass      = isTerrainTF ? 'bg-green-50/60 border-green-100' : souscription.type_villa === 'F3' ? 'bg-purple-50/60 border-purple-100' : 'bg-indigo-50/60 border-indigo-100';
  const dotClass     = isTerrainTF ? 'bg-green-500' : souscription.type_villa === 'F3' ? 'bg-purple-500' : 'bg-indigo-500';
  const textClass    = isTerrainTF ? 'text-green-800' : souscription.type_villa === 'F3' ? 'text-purple-800' : 'text-indigo-800';

  const titre = isTerrainTF
    ? `Terrain TF · ${LABELS_SITE[souscription.site].split('–')[0].trim()}`
    : `Villa ${souscription.type_villa} · ${LABELS_SITE[souscription.site].split('–')[0].trim()} · ${souscription.titre}`;

  const statutVar = souscription.statut === 'livre' ? 'green' : souscription.statut === 'attribue' ? 'blue' : souscription.statut === 'valide' ? 'purple' : 'amber';
  const statutLbl = souscription.statut === 'livre' ? 'Livré' : souscription.statut === 'attribue' ? 'Attribué' : souscription.statut === 'valide' ? 'Validé' : 'En cours';

  return (
    <div className={`border rounded-xl p-3 space-y-2 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <p className={`text-xs font-semibold ${textClass}`}>{titre}</p>
        </div>
        <Badge variant={statutVar}>{statutLbl}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
        <span>Acompte {acomptePct >= 100 ? '✓' : `${acomptePct}%`}</span>
        <span className="text-right">{souscription.nb_mensualites_payees}/120 mensualités</span>
      </div>
      <ProgressBar value={totalPct} />
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{formatCurrency(souscription.prix_total)}</span>
        <span className={`font-semibold text-${color}-700`}>{totalPct}%</span>
      </div>
    </div>
  );
}

// ─── Carte membre ─────────────────────────────────────────────────────────────
function MembreCard({
  membre,
  souscTerrains,
  souscLogements,
}: {
  membre: Membre;
  souscTerrains: SouscriptionTerrain[];
  souscLogements: SouscriptionLogement[];
}) {
  const terrains  = souscTerrains.filter(s => s.membre_id === membre.id);
  const logements = souscLogements.filter(s => s.membre_id === membre.id);
  const nbOffres  = terrains.length + logements.length;

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 transition-shadow hover:shadow-md ${membre.statut === 'inactif' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
      {/* En-tête membre */}
      <div className="flex items-start gap-3">
        <Avatar nom={membre.nom} prenom={membre.prenom} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{membre.prenom} {membre.nom}</p>
              <p className="text-xs text-gray-400">{membre.id_membre}</p>
            </div>
            <Badge variant={membre.statut === 'actif' ? 'green' : 'gray'}>
              {membre.statut === 'actif' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {membre.telephone && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{membre.telephone}</span>
            )}
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              Adhésion {formatDate(membre.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Souscriptions */}
      {nbOffres === 0 ? (
        <p className="text-xs text-gray-300 text-center py-2 border border-dashed border-gray-100 rounded-xl">
          Aucune offre souscrite
        </p>
      ) : (
        <div className="space-y-2">
          {terrains.map(s => <BlocTerrain key={s.id} souscription={s} />)}
          {logements.map(s => <BlocLogement key={s.id} souscription={s} />)}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MembresPage() {
  const [search, setSearch]       = useState('');
  const [filtre, setFiltre]       = useState<Filtre>('tous');
  const [showModal, setShowModal] = useState(false);

  const { data: membres,    loading: lm, refetch: rm } = useAsync(fetchMembres);
  const { data: terrains,   loading: lt, refetch: rt } = useAsync(fetchSouscriptionsTerrain);
  const { data: logements,  loading: ll, refetch: rl } = useAsync(fetchSouscriptionsLogement);

  const loading = lm || lt || ll;
  const refetchAll = () => { rm(); rt(); rl(); };

  // Jeux de membre_id par type d'offre
  const sets = useMemo(() => {
    const stIds  = new Set((terrains ?? []).map(s => s.membre_id));
    const tfIds  = new Set((logements ?? []).filter(s => s.type_villa === 'terrain').map(s => s.membre_id));
    const f2Ids  = new Set((logements ?? []).filter(s => s.type_villa === 'F2').map(s => s.membre_id));
    const f3Ids  = new Set((logements ?? []).filter(s => s.type_villa === 'F3').map(s => s.membre_id));
    const slIds  = new Set([...tfIds, ...f2Ids, ...f3Ids]);
    const deuxIds = new Set([...(membres ?? [])].filter(m => stIds.has(m.id) && slIds.has(m.id)).map(m => m.id));
    return { stIds, tfIds, f2Ids, f3Ids, slIds, deuxIds };
  }, [terrains, logements, membres]);

  const stats = useMemo(() => ({
    total:         (membres ?? []).length,
    actifs:        (membres ?? []).filter(m => m.statut === 'actif').length,
    terrain_simple:(membres ?? []).filter(m => sets.stIds.has(m.id)).length,
    terrain_tf:    (membres ?? []).filter(m => sets.tfIds.has(m.id)).length,
    logement_f2:   (membres ?? []).filter(m => sets.f2Ids.has(m.id)).length,
    logement_f3:   (membres ?? []).filter(m => sets.f3Ids.has(m.id)).length,
    les_deux:      sets.deuxIds.size,
  }), [membres, sets]);

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
        filtre === 'tous'          ? true :
        filtre === 'terrain_simple'? sets.stIds.has(m.id) :
        filtre === 'terrain_tf'    ? sets.tfIds.has(m.id) :
        filtre === 'logement_f2'   ? sets.f2Ids.has(m.id) :
        filtre === 'logement_f3'   ? sets.f3Ids.has(m.id) :
        filtre === 'les_deux'      ? sets.deuxIds.has(m.id) :
        m.statut === 'inactif';

      return matchSearch && matchFiltre;
    });
  }, [membres, search, filtre, sets]);

  const filtres: { id: Filtre; label: string; count: number; color: string }[] = [
    { id: 'tous',           label: 'Tous',           count: stats.total,          color: 'bg-gray-700 text-white border-gray-700' },
    { id: 'terrain_simple', label: 'Terrains simples',count: stats.terrain_simple, color: 'bg-blue-600 text-white border-blue-600' },
    { id: 'terrain_tf',     label: 'Terrains TF',    count: stats.terrain_tf,     color: 'bg-green-600 text-white border-green-600' },
    { id: 'logement_f2',    label: 'Logements F2',   count: stats.logement_f2,    color: 'bg-indigo-600 text-white border-indigo-600' },
    { id: 'logement_f3',    label: 'Logements F3',   count: stats.logement_f3,    color: 'bg-purple-600 text-white border-purple-600' },
    { id: 'les_deux',       label: 'Multi-offres',   count: stats.les_deux,       color: 'bg-amber-500 text-white border-amber-500' },
    { id: 'inactif',        label: 'Inactifs',       count: stats.total - stats.actifs, color: 'bg-gray-400 text-white border-gray-400' },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      {/* En-tête avec bouton en haut */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Membres</h2>
          <p className="text-sm text-gray-400 mt-1">
            {stats.total} membre{stats.total > 1 ? 's' : ''} · {stats.actifs} actif{stats.actifs > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
        >
          + Nouveau membre
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Terrains simples', value: stats.terrain_simple, color: 'text-blue-600' },
          { label: 'Terrains TF',      value: stats.terrain_tf,     color: 'text-green-600' },
          { label: 'Logements F2',     value: stats.logement_f2,    color: 'text-indigo-600' },
          { label: 'Logements F3',     value: stats.logement_f3,    color: 'text-purple-600' },
          { label: 'Multi-offres',     value: stats.les_deux,       color: 'text-amber-600' },
          { label: 'Actifs',           value: stats.actifs,         color: 'text-gray-900' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, ID ou téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300 bg-white"
        />
        <div className="flex gap-1.5 flex-wrap">
          {filtres.map(f => (
            <button
              key={f.id}
              onClick={() => setFiltre(f.id)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filtre === f.id
                  ? f.color
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
              <span className={`ml-1 ${filtre === f.id ? 'opacity-80' : 'opacity-50'}`}>({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grille de cartes */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">Aucun membre correspondant</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-green-600 hover:underline">
            Ajouter le premier membre
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <MembreCard
              key={m.id}
              membre={m}
              souscTerrains={terrains ?? []}
              souscLogements={logements ?? []}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-right">
        {filtered.length} membre{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        {search && ` · recherche "${search}"`}
      </div>

      {showModal && (
        <NouveauMembreModal
          onClose={() => setShowModal(false)}
          onCreated={refetchAll}
        />
      )}
    </div>
  );
}
