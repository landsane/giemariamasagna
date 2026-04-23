import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { fetchOffres, insertOffre, updateOffreStatut, updateOffre } from '@/lib/queries';
import type { Offre, TypeOffre } from '@/types';
import { LABELS_TYPE_OFFRE } from '@/types';
import Badge from '@/components/Badge';
import Spinner from '@/components/Spinner';
import { formatCurrency } from '@/lib/utils';

// ─── Formulaire offre ─────────────────────────────────────────────────────────
interface FormulaireProps {
  initial?: Offre;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULTS: Record<TypeOffre, { taux_acompte: number; nb_mensualites: number }> = {
  terrain_simple: { taux_acompte: 0,    nb_mensualites: 12  },
  terrain_tf:     { taux_acompte: 0.08, nb_mensualites: 120 },
  logement:       { taux_acompte: 0.08, nb_mensualites: 120 },
};

function FormulaireOffre({ initial, onClose, onSaved }: FormulaireProps) {
  const editing = !!initial;
  const [type,          setType]         = useState<TypeOffre>(initial?.type ?? 'terrain_simple');
  const [sousType,      setSousType]     = useState<'F2' | 'F3' | ''>(initial?.sous_type ?? '');
  const [nom,           setNom]          = useState(initial?.nom ?? '');
  const [description,   setDescription]  = useState(initial?.description ?? '');
  const [localisation,  setLocalisation] = useState(initial?.localisation ?? '');
  const [prixInput,     setPrixInput]    = useState(initial ? String(initial.prix_unitaire) : '');
  const [fraisInput,    setFraisInput]   = useState(initial ? String(initial.frais_dossier) : '0');
  const [tauxInput,     setTauxInput]    = useState(
    initial ? String(Math.round(initial.taux_acompte * 100)) : String(Math.round(DEFAULTS[type].taux_acompte * 100))
  );
  const [nbMensInput,   setNbMensInput]  = useState(
    initial ? String(initial.nb_mensualites) : String(DEFAULTS[type].nb_mensualites)
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function handleTypeChange(t: TypeOffre) {
    setType(t);
    setSousType('');
    setTauxInput(String(Math.round(DEFAULTS[t].taux_acompte * 100)));
    setNbMensInput(String(DEFAULTS[t].nb_mensualites));
  }

  const prixUnitaire  = parseInt(prixInput.replace(/\s/g, ''), 10) || 0;
  const fraisDossier  = parseInt(fraisInput.replace(/\s/g, ''), 10) || 0;
  const tauxAcompte   = (parseFloat(tauxInput) || 0) / 100;
  const nbMensualites = parseInt(nbMensInput, 10) || 1;
  const acompte       = Math.round(prixUnitaire * tauxAcompte);
  const mensualite    = prixUnitaire > 0 ? Math.round(prixUnitaire / nbMensualites) : 0;

  async function handleSubmit() {
    if (!nom.trim())         return setError('Le nom est obligatoire.');
    if (!localisation.trim())return setError('La localisation est obligatoire.');
    if (prixUnitaire <= 0)   return setError('Le prix doit être supérieur à 0.');
    if (type === 'logement' && !sousType) return setError('Sélectionne F2 ou F3 pour un logement.');

    setSaving(true);
    setError('');
    const payload: Omit<Offre, 'id' | 'created_at'> = {
      type,
      sous_type:      type === 'logement' ? (sousType as 'F2' | 'F3') : null,
      nom:            nom.trim(),
      description:    description.trim() || undefined,
      localisation:   localisation.trim(),
      prix_unitaire:  prixUnitaire,
      frais_dossier:  fraisDossier,
      taux_acompte:   tauxAcompte,
      nb_mensualites: nbMensualites,
      statut:         initial?.statut ?? 'active',
    };

    try {
      if (editing && initial) {
        await updateOffre(initial.id, payload);
      } else {
        await insertOffre(payload);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  const TYPES: { id: TypeOffre; label: string; desc: string; color: string }[] = [
    { id: 'terrain_simple', label: 'Terrain Simple',  desc: 'Parcelle GIE · mensualités fixes',   color: 'border-blue-400 bg-blue-50' },
    { id: 'logement',       label: 'Logement Social', desc: 'Villa F2 / F3 · acompte + 120 mens.', color: 'border-purple-400 bg-purple-50' },
    { id: 'terrain_tf',     label: 'Terrain TF',      desc: 'Titre Foncier · acompte + mensualités',color: 'border-green-400 bg-green-50' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:my-4 max-h-[95dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">{editing ? 'Modifier l\'offre' : 'Nouvelle offre'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Programme PICLOM · GIE Maria Masagna</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type d'offre</p>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => handleTypeChange(t.id)}
                  className={`border-2 rounded-xl p-3 text-left transition-all ${type === t.id ? t.color : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <p className="text-xs font-bold text-gray-900">{t.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sous-type logement */}
          {type === 'logement' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de villa</p>
              <div className="grid grid-cols-2 gap-2">
                {(['F2', 'F3'] as const).map(st => (
                  <button key={st} onClick={() => setSousType(st)}
                    className={`border-2 rounded-xl py-2.5 text-center font-bold text-sm transition-all ${sousType === st ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                  >
                    Villa {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom de l'offre *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              placeholder={type === 'terrain_simple' ? 'Terrain Simple – Dakar' : type === 'logement' ? 'Villa F2 – Ndoyenne 01' : 'Terrain TF – Sébikhotane'}
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Localisation */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Localisation *</label>
            <input type="text" value={localisation} onChange={e => setLocalisation(e.target.value)}
              placeholder="ex : Ndoyenne 01 – Sébikhotane"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description <span className="normal-case font-normal text-gray-400">(optionnel)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Détails supplémentaires sur l'offre…"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300 resize-none"
            />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {type === 'terrain_simple' ? 'Prix / parcelle (FCFA) *' : 'Prix total (FCFA) *'}
              </label>
              <input type="text" value={prixInput} onChange={e => setPrixInput(e.target.value)}
                placeholder={type === 'terrain_simple' ? '460 000' : type === 'logement' && sousType === 'F3' ? '20 000 000' : '16 000 000'}
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frais de dossier (FCFA)</label>
              <input type="text" value={fraisInput} onChange={e => setFraisInput(e.target.value)}
                placeholder="0"
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Acompte + mensualités */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acompte (%)</label>
              <div className="mt-1 relative">
                <input type="number" min="0" max="100" value={tauxInput} onChange={e => setTauxInput(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-7 outline-none focus:border-green-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nbre de mensualités</label>
              <input type="number" min="1" value={nbMensInput} onChange={e => setNbMensInput(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400"
              />
            </div>
          </div>

          {/* Récap calculé */}
          {prixUnitaire > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
              {tauxAcompte > 0 && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">Acompte</p>
                  <p className="text-sm font-black text-amber-700 mt-0.5">{formatCurrency(acompte)}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-gray-400">Mensualité</p>
                <p className="text-sm font-black text-green-700 mt-0.5">{formatCurrency(mensualite)}</p>
              </div>
              {fraisDossier > 0 && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">Frais dossier</p>
                  <p className="text-sm font-black text-gray-700 mt-0.5">{formatCurrency(fraisDossier)}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-gray-400">Durée</p>
                <p className="text-sm font-black text-gray-700 mt-0.5">{nbMensualites} mois</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving || prixUnitaire <= 0 || !nom.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer l\'offre'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte offre ──────────────────────────────────────────────────────────────
function OffreCard({ offre, onToggle, onEdit }: { offre: Offre; onToggle: () => void; onEdit: () => void }) {
  const mensualite = Math.round(offre.prix_unitaire / offre.nb_mensualites);
  const acompte    = Math.round(offre.prix_unitaire * offre.taux_acompte);

  const typeColor =
    offre.type === 'terrain_simple' ? 'text-blue-700 bg-blue-50 border-blue-100' :
    offre.type === 'logement'       ? 'text-purple-700 bg-purple-50 border-purple-100' :
                                      'text-green-700 bg-green-50 border-green-100';

  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-4 transition-opacity ${offre.statut !== 'active' ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeColor}`}>
              {LABELS_TYPE_OFFRE[offre.type]}{offre.sous_type ? ` · ${offre.sous_type}` : ''}
            </span>
            <Badge variant={offre.statut === 'active' ? 'green' : offre.statut === 'complet' ? 'blue' : 'gray'}>
              {offre.statut === 'active' ? 'Active' : offre.statut === 'complet' ? 'Complète' : 'Inactive'}
            </Badge>
          </div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{offre.nom}</p>
          <p className="text-xs text-gray-400 mt-0.5">📍 {offre.localisation}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onEdit}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
            Modifier
          </button>
          <button onClick={onToggle}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              offre.statut === 'active'
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}>
            {offre.statut === 'active' ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>

      {/* Description */}
      {offre.description && (
        <p className="text-xs text-gray-500">{offre.description}</p>
      )}

      {/* Grille financière */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            {offre.type === 'terrain_simple' ? 'Prix / parcelle' : 'Prix total'}
          </p>
          <p className="text-sm font-black text-gray-900 mt-0.5">{formatCurrency(offre.prix_unitaire)}</p>
        </div>
        {offre.frais_dossier > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Frais dossier</p>
            <p className="text-sm font-black text-gray-700 mt-0.5">{formatCurrency(offre.frais_dossier)}</p>
          </div>
        )}
        {acompte > 0 && (
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Acompte ({Math.round(offre.taux_acompte * 100)}%)</p>
            <p className="text-sm font-black text-amber-700 mt-0.5">{formatCurrency(acompte)}</p>
          </div>
        )}
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Mensualité</p>
          <p className="text-sm font-black text-green-700 mt-0.5">{formatCurrency(mensualite)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Durée</p>
          <p className="text-sm font-black text-blue-700 mt-0.5">{offre.nb_mensualites} mois</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function OffresPage() {
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Offre | null>(null);
  const [tab, setTab]               = useState<'active' | 'inactive'>('active');
  const [filtreType, setFiltreType] = useState<TypeOffre | 'tous'>('tous');

  const { data: offres, loading, error, refetch } = useAsync(fetchOffres);

  async function handleToggle(offre: Offre) {
    const next = offre.statut === 'active' ? 'inactive' : 'active';
    await updateOffreStatut(offre.id, next);
    refetch();
  }

  function switchTab(t: 'active' | 'inactive') {
    setTab(t);
    setFiltreType('tous');
  }

  const toutesActives   = (offres ?? []).filter(o => o.statut === 'active');
  const toutesInactives = (offres ?? []).filter(o => o.statut !== 'active');
  const base            = tab === 'active' ? toutesActives : toutesInactives;

  const parType: Record<TypeOffre, Offre[]> = {
    terrain_simple: base.filter(o => o.type === 'terrain_simple'),
    logement:       base.filter(o => o.type === 'logement'),
    terrain_tf:     base.filter(o => o.type === 'terrain_tf'),
  };

  const affichees = filtreType === 'tous' ? base : parType[filtreType];

  const SECTIONS: { type: TypeOffre; label: string; color: string; desc: string }[] = [
    { type: 'terrain_simple', label: 'Terrains Simples',  color: 'text-blue-600',   desc: 'Parcelles GIE · paiement mensuel' },
    { type: 'logement',       label: 'Logements Sociaux', color: 'text-purple-600', desc: 'Villa F2 & F3 · Programme PICLOM' },
    { type: 'terrain_tf',     label: 'Terrains TF',       color: 'text-green-600',  desc: 'Titre Foncier · Le Millénium 7SD' },
  ];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Offres</h2>
          <p className="text-sm text-gray-400 mt-1">
            Catalogue des offres disponibles · {toutesActives.length} active{toutesActives.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
        >
          + Nouvelle offre
        </button>
      </div>

      {/* Onglets */}
      <div className="flex w-full bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => switchTab('active')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Actives ({toutesActives.length})
        </button>
        <button
          onClick={() => switchTab('inactive')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            tab === 'inactive' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Inactives ({toutesInactives.length})
        </button>
      </div>

      {/* Résumé par type */}
      <div className="grid grid-cols-3 gap-3">
        {SECTIONS.map(s => (
          <button key={s.type}
            onClick={() => setFiltreType(filtreType === s.type ? 'tous' : s.type)}
            className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-sm ${filtreType === s.type ? 'ring-2 ring-green-400 border-green-200' : 'border-gray-100'}`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{parType[s.type].length}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? <Spinner /> : error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={refetch} className="mt-2 text-xs text-green-600 hover:underline">Réessayer</button>
        </div>
      ) : affichees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">
            {tab === 'active' ? 'Aucune offre active' : 'Aucune offre inactive'}
            {filtreType !== 'tous' ? ` · ${LABELS_TYPE_OFFRE[filtreType]}` : ''}
          </p>
          {tab === 'active' && (
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="mt-3 text-sm text-green-600 hover:underline">
              Créer la première offre
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filtreType === 'tous'
            ? SECTIONS.map(s => parType[s.type].length > 0 && (
                <div key={s.type}>
                  <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${s.color}`}>{s.label}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {parType[s.type].map(o => (
                      <OffreCard key={o.id} offre={o}
                        onToggle={() => handleToggle(o)}
                        onEdit={() => { setEditing(o); setShowForm(true); }}
                      />
                    ))}
                  </div>
                </div>
              ))
            : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {affichees.map(o => (
                    <OffreCard key={o.id} offre={o}
                      onToggle={() => handleToggle(o)}
                      onEdit={() => { setEditing(o); setShowForm(true); }}
                    />
                  ))}
                </div>
              )
          }
        </div>
      )}

      {showForm && (
        <FormulaireOffre
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
