import { useState, useMemo } from 'react';
import { MoreVertical, Pencil, Archive, ArchiveRestore, Upload } from 'lucide-react';
import { useAsync } from '@/hooks/useAsync';
import { fetchMembres, fetchSouscriptionsTerrain, fetchSouscriptionsLogement, updateMembre } from '@/lib/queries';
import type { Membre, SouscriptionTerrain, SouscriptionLogement } from '@/types';
import { LABELS_SITE } from '@/types';
import Badge from '@/components/Badge';
import ProgressBar from '@/components/ProgressBar';
import Spinner from '@/components/Spinner';
import MembreFormModal from '@/components/MembreFormModal';
import ImportModal from '@/components/ImportModal';
import { formatCurrency, formatDate } from '@/lib/utils';

type Filtre = 'tous' | 'terrain_simple' | 'terrain_tf' | 'logement_f2' | 'logement_f3' | 'les_deux';

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ membre, size = 'md' }: { membre: Membre; size?: 'sm' | 'md' | 'lg' }) {
  const initiales = `${membre.prenom[0]}${membre.nom[0]}`.toUpperCase();
  const s = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (membre.photo_url) {
    return <img src={membre.photo_url} alt={initiales} className={`${s} rounded-full object-cover flex-shrink-0 shadow-sm`} />;
  }
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm`}>
      {initiales}
    </div>
  );
}

// ─── Bloc terrain simple ──────────────────────────────────────────────────────
function BlocTerrain({ s }: { s: SouscriptionTerrain }) {
  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <p className="text-xs font-semibold text-blue-800">
            Terrain simple · {s.nb_terrains} parcelle{s.nb_terrains > 1 ? 's' : ''}
          </p>
        </div>
        <Badge variant={s.statut === 'solde' ? 'green' : 'amber'}>
          {s.statut === 'solde' ? 'SOLDÉ' : 'En cours'}
        </Badge>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatCurrency(s.montant_verse)}</span>
        <span className="text-gray-400">/ {formatCurrency(s.montant_total)}</span>
      </div>
      <ProgressBar value={s.pourcentage} />
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{formatDate(s.date_souscription)}</span>
        <span className="font-semibold text-gray-600">{s.pourcentage}%</span>
      </div>
    </div>
  );
}

// ─── Bloc logement / terrain TF ───────────────────────────────────────────────
function BlocLogement({ s }: { s: SouscriptionLogement }) {
  const isTerrainTF  = s.type_villa === 'terrain';
  const acomptePct   = s.acompte_requis > 0 ? Math.round((s.acompte_verse / s.acompte_requis) * 100) : 0;
  const totalVerse   = s.acompte_verse + s.nb_mensualites_payees * s.mensualite;
  const totalPct     = s.prix_total > 0 ? Math.round((totalVerse / s.prix_total) * 100) : 0;

  const bgClass  = isTerrainTF ? 'bg-green-50/60 border-green-100'   : s.type_villa === 'F3' ? 'bg-purple-50/60 border-purple-100' : 'bg-indigo-50/60 border-indigo-100';
  const dotClass = isTerrainTF ? 'bg-green-500'                       : s.type_villa === 'F3' ? 'bg-purple-500'                    : 'bg-indigo-500';
  const textCls  = isTerrainTF ? 'text-green-800'                     : s.type_villa === 'F3' ? 'text-purple-800'                  : 'text-indigo-800';
  const titre    = isTerrainTF
    ? `Terrain TF · ${LABELS_SITE[s.site].split('–')[0].trim()}`
    : `Villa ${s.type_villa} · ${LABELS_SITE[s.site].split('–')[0].trim()} · ${s.titre}`;

  const sv = s.statut === 'livre' ? 'green' : s.statut === 'attribue' ? 'blue' : s.statut === 'valide' ? 'purple' : 'amber';
  const sl = s.statut === 'livre' ? 'Livré' : s.statut === 'attribue' ? 'Attribué' : s.statut === 'valide' ? 'Validé' : 'En cours';

  return (
    <div className={`border rounded-xl p-3 space-y-2 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <p className={`text-xs font-semibold ${textCls}`}>{titre}</p>
        </div>
        <Badge variant={sv}>{sl}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
        <span>Acompte {acomptePct >= 100 ? '✓' : `${acomptePct}%`}</span>
        <span className="text-right">{s.nb_mensualites_payees}/120 mens.</span>
      </div>
      <ProgressBar value={totalPct} />
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{formatCurrency(s.prix_total)}</span>
        <span className="font-semibold text-gray-600">{totalPct}%</span>
      </div>
    </div>
  );
}

// ─── Carte membre ─────────────────────────────────────────────────────────────
function MembreCard({
  membre,
  souscTerrains,
  souscLogements,
  onEdit,
  onToggleArchive,
}: {
  membre: Membre;
  souscTerrains: SouscriptionTerrain[];
  souscLogements: SouscriptionLogement[];
  onEdit: (m: Membre) => void;
  onToggleArchive: (m: Membre) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const terrains  = souscTerrains.filter(s => s.membre_id === membre.id);
  const logements = souscLogements.filter(s => s.membre_id === membre.id);
  const nbOffres  = terrains.length + logements.length;

  return (
    <div className={`bg-white rounded-2xl border p-4 space-y-3 transition-shadow hover:shadow-md ${membre.statut === 'inactif' ? 'opacity-60 border-emerald-100' : 'border-emerald-100'}`}>
      <div className="flex items-start gap-3">
        <Avatar membre={membre} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{membre.prenom} {membre.nom}</p>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden min-w-[140px]">
                    <button
                      onClick={() => { onEdit(membre); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => { onToggleArchive(membre); setShowMenu(false); }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                        membre.statut === 'actif'
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {membre.statut === 'actif'
                        ? <><Archive className="w-3.5 h-3.5" /> Archiver</>
                        : <><ArchiveRestore className="w-3.5 h-3.5" /> Réactiver</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {membre.telephone && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{membre.telephone}</span>
            )}
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {formatDate(membre.created_at)}
            </span>
          </div>
        </div>
      </div>

      {nbOffres === 0 ? (
        <p className="text-xs text-gray-300 text-center py-2 border border-dashed border-emerald-100 rounded-xl">
          Aucune offre souscrite
        </p>
      ) : (
        <div className="space-y-2">
          {terrains.map(s => <BlocTerrain key={s.id} s={s} />)}
          {logements.map(s => <BlocLogement key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MembresPage() {
  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState<'actif' | 'inactif'>('actif');
  const [filtre, setFiltre]   = useState<Filtre>('tous');
  const [editing, setEditing] = useState<Membre | null>(null);
  const [showNew,    setShowNew]    = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { data: membres,   loading: lm, refetch: rm } = useAsync(fetchMembres);
  const { data: terrains,  loading: lt, refetch: rt } = useAsync(fetchSouscriptionsTerrain);
  const { data: logements, loading: ll, refetch: rl } = useAsync(fetchSouscriptionsLogement);

  const loading    = lm || lt || ll;
  const refetchAll = () => { rm(); rt(); rl(); };

  function switchTab(t: 'actif' | 'inactif') {
    setTab(t);
    setFiltre('tous');
  }

  const sets = useMemo(() => {
    const stIds = new Set((terrains ?? []).map(s => s.membre_id));
    const tfIds = new Set((logements ?? []).filter(s => s.type_villa === 'terrain').map(s => s.membre_id));
    const f2Ids = new Set((logements ?? []).filter(s => s.type_villa === 'F2').map(s => s.membre_id));
    const f3Ids = new Set((logements ?? []).filter(s => s.type_villa === 'F3').map(s => s.membre_id));
    const slIds = new Set([...tfIds, ...f2Ids, ...f3Ids]);
    const deux  = new Set([...(membres ?? [])].filter(m => stIds.has(m.id) && slIds.has(m.id)).map(m => m.id));
    return { stIds, tfIds, f2Ids, f3Ids, deux };
  }, [terrains, logements, membres]);

  const stats = useMemo(() => ({
    total:          (membres ?? []).length,
    actifs:         (membres ?? []).filter(m => m.statut === 'actif').length,
    inactifs:       (membres ?? []).filter(m => m.statut !== 'actif').length,
    terrain_simple: (membres ?? []).filter(m => m.statut === 'actif' && sets.stIds.has(m.id)).length,
    terrain_tf:     (membres ?? []).filter(m => m.statut === 'actif' && sets.tfIds.has(m.id)).length,
    logement_f2:    (membres ?? []).filter(m => m.statut === 'actif' && sets.f2Ids.has(m.id)).length,
    logement_f3:    (membres ?? []).filter(m => m.statut === 'actif' && sets.f3Ids.has(m.id)).length,
    les_deux:       [...sets.deux].filter(id => (membres ?? []).find(m => m.id === id)?.statut === 'actif').length,
  }), [membres, sets]);

  const filtered = useMemo(() => {
    if (!membres) return [];
    return membres.filter(m => {
      if (tab === 'actif'   && m.statut !== 'actif') return false;
      if (tab === 'inactif' && m.statut === 'actif') return false;
      const q = search.toLowerCase();
      const ok = !q || m.nom.toLowerCase().includes(q) || m.prenom.toLowerCase().includes(q) ||
                 (m.telephone ?? '').includes(q);
      const f = tab === 'inactif' ? true :
        filtre === 'tous'           ? true :
        filtre === 'terrain_simple' ? sets.stIds.has(m.id) :
        filtre === 'terrain_tf'     ? sets.tfIds.has(m.id) :
        filtre === 'logement_f2'    ? sets.f2Ids.has(m.id) :
        filtre === 'logement_f3'    ? sets.f3Ids.has(m.id) :
        sets.deux.has(m.id);
      return ok && f;
    });
  }, [membres, search, tab, filtre, sets]);

  async function handleToggleArchive(m: Membre) {
    await updateMembre(m.id, { statut: m.statut === 'actif' ? 'inactif' : 'actif' });
    refetchAll();
  }

  const filtres: { id: Filtre; label: string; count: number; color: string }[] = [
    { id: 'tous',           label: 'Tous',             count: stats.actifs,         color: 'bg-gray-700 text-white' },
    { id: 'terrain_simple', label: 'Terrains simples', count: stats.terrain_simple, color: 'bg-blue-600 text-white' },
    { id: 'terrain_tf',     label: 'Terrains TF',      count: stats.terrain_tf,     color: 'bg-green-600 text-white' },
    { id: 'logement_f2',    label: 'Logements F2',     count: stats.logement_f2,    color: 'bg-indigo-600 text-white' },
    { id: 'logement_f3',    label: 'Logements F3',     count: stats.logement_f3,    color: 'bg-purple-600 text-white' },
    { id: 'les_deux',       label: 'Multi-offres',     count: stats.les_deux,       color: 'bg-amber-500 text-white' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Membres</h2>
          <p className="text-sm text-gray-400 mt-1">{stats.total} membres · {stats.actifs} actifs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 border border-emerald-300 text-emerald-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors hover:bg-emerald-50 whitespace-nowrap">
            <Upload className="w-4 h-4" /> Importer
          </button>
          <button onClick={() => setShowNew(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
            + Nouveau membre
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex w-full bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => switchTab('actif')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'actif' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Actifs ({stats.actifs})
        </button>
        <button
          onClick={() => switchTab('inactif')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'inactif' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Archivés ({stats.inactifs})
        </button>
      </div>

      {/* Stats rapides (onglet actifs seulement) */}
      {tab === 'actif' && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: 'Terrains simples', value: stats.terrain_simple, color: 'text-blue-600' },
            { label: 'Terrains TF',      value: stats.terrain_tf,     color: 'text-green-600' },
            { label: 'Logements F2',     value: stats.logement_f2,    color: 'text-indigo-600' },
            { label: 'Logements F3',     value: stats.logement_f3,    color: 'text-purple-600' },
            { label: 'Multi-offres',     value: stats.les_deux,       color: 'text-amber-600' },
            { label: 'Actifs',           value: stats.actifs,         color: 'text-gray-900' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-emerald-100 p-3 text-center">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recherche + filtres */}
      <div className="space-y-2">
        <input type="text" placeholder="Rechercher par nom, prénom ou téléphone…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300 bg-white"
        />
        {tab === 'actif' && (
          <div className="flex gap-1.5 flex-wrap">
            {filtres.map(f => (
              <button key={f.id} onClick={() => setFiltre(f.id)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  filtre === f.id ? `${f.color} border-transparent` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                {f.label} <span className={filtre === f.id ? 'opacity-80' : 'opacity-50'}>({f.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grille */}
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center">
          <p className="text-sm text-gray-400">Aucun membre correspondant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <MembreCard key={m.id} membre={m}
              souscTerrains={terrains ?? []} souscLogements={logements ?? []}
              onEdit={setEditing}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 text-right">
        {filtered.length} membre{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
      </div>

      {showNew && (
        <MembreFormModal onClose={() => setShowNew(false)} onSaved={refetchAll} />
      )}
      {editing && (
        <MembreFormModal initial={editing} onClose={() => setEditing(null)} onSaved={refetchAll} />
      )}
      {showImport && (
        <ImportModal type="membres" onClose={() => setShowImport(false)} onImported={refetchAll} />
      )}
    </div>
  );
}
