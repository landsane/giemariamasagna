import { useState } from 'react';
import { insertOffre, updateOffre, updateOffreStatut } from '@/lib/queries';
import type { Offre, TypeOffre } from '@/types';
import { LABELS_TYPE_OFFRE } from '@/types';
import Badge from './Badge';
import Spinner from './Spinner';
import { formatCurrency, calculerAcompte, calculerMensualite, formatSurface, titreAvecSurface } from '@/lib/utils';

// Catalogue d'offres réutilisable, scopé à un sous-ensemble de types (Terrains :
// terrain_simple + terrain_tf ; Logements : logement) — remplace l'ancienne page
// Offres autonome, qui faisait doublon avec l'aperçu affiché sur Terrains et
// Logements. `types` détermine ce qui est géré ici, et les libellés/couleurs
// des sections viennent de SECTIONS ci-dessous.

const SECTIONS: { type: TypeOffre; label: string; color: string; desc: string }[] = [
  { type: 'terrain_simple', label: 'Terrains Simples',    color: 'text-blue-600',   desc: 'Parcelles GIE · paiement mensuel' },
  { type: 'terrain_tf',     label: 'Terrains Viabilisés', color: 'text-green-600',  desc: 'Terrain viabilisé · Le Millénium 7SD' },
  { type: 'logement',       label: 'Logements Sociaux',   color: 'text-purple-600', desc: 'Villa F2 & F3 · Programme PICLOM' },
];

const DEFAULTS: Record<TypeOffre, { taux_acompte: number; nb_mensualites: number }> = {
  terrain_simple: { taux_acompte: 0,    nb_mensualites: 12  },
  terrain_tf:     { taux_acompte: 0.08, nb_mensualites: 120 },
  logement:       { taux_acompte: 0.08, nb_mensualites: 120 },
};

const ALL_TYPES: { id: TypeOffre; label: string; desc: string; color: string }[] = [
  { id: 'terrain_simple', label: 'Terrain Simple',     desc: 'Parcelle GIE · mensualités fixes',        color: 'border-blue-400 bg-blue-50' },
  { id: 'terrain_tf',     label: 'Terrain Viabilisé',  desc: 'Terrain viabilisé · acompte + mensualités', color: 'border-green-400 bg-green-50' },
  { id: 'logement',       label: 'Logement Social',    desc: 'Villa F2 / F3 · acompte + 120 mens.',      color: 'border-purple-400 bg-purple-50' },
];

// Vocabulaire du catalogue : "lotissement" sur Terrains (un lotissement =
// un ensemble de terrains), "offre" sur Logements (moins pertinent pour des
// villas F2/F3). N'affecte que le texte, pas les données.
const COPY: Record<'offre' | 'lotissement', {
  nouveau: string; creerPremier: string; aucunActif: string; aucunInactif: string;
  titreNouveau: string; titreEdit: string; boutonCreer: string; typeLabel: string;
}> = {
  offre: {
    nouveau: '+ Nouvelle offre',
    creerPremier: 'Créer la première offre',
    aucunActif: 'Aucune offre active',
    aucunInactif: 'Aucune offre inactive',
    titreNouveau: 'Nouvelle offre',
    titreEdit: "Modifier l'offre",
    boutonCreer: "Créer l'offre",
    typeLabel: "Type d'offre",
  },
  lotissement: {
    nouveau: '+ Nouveau lotissement',
    creerPremier: 'Créer le premier lotissement',
    aucunActif: 'Aucun lotissement actif',
    aucunInactif: 'Aucun lotissement inactif',
    titreNouveau: 'Nouveau lotissement',
    titreEdit: 'Modifier le lotissement',
    boutonCreer: 'Créer le lotissement',
    typeLabel: 'Type de lotissement',
  },
};

// ─── Formulaire offre ─────────────────────────────────────────────────────────
interface FormulaireProps {
  initial?: Offre;
  allowedTypes: TypeOffre[];
  noun: 'offre' | 'lotissement';
  onClose: () => void;
  onSaved: () => void;
}

function FormulaireOffre({ initial, allowedTypes, noun, onClose, onSaved }: FormulaireProps) {
  const copy = COPY[noun];
  const editing = !!initial;
  const [type,          setType]         = useState<TypeOffre>(initial?.type ?? allowedTypes[0]);
  const [sousType,      setSousType]     = useState<'F2' | 'F3' | ''>(initial?.sous_type ?? '');
  const [nom,           setNom]          = useState(initial?.nom ?? '');
  const [description,   setDescription]  = useState(initial?.description ?? '');
  const [localisation,  setLocalisation] = useState(initial?.localisation ?? '');
  const [surfaceInput,  setSurfaceInput] = useState(initial?.surface_m2 ? String(initial.surface_m2) : '');
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

  const surfaceM2     = parseInt(surfaceInput.replace(/\s/g, ''), 10) || 0;
  const prixUnitaire  = parseInt(prixInput.replace(/\s/g, ''), 10) || 0;
  const fraisDossier  = parseInt(fraisInput.replace(/\s/g, ''), 10) || 0;
  const tauxAcompte   = (parseFloat(tauxInput) || 0) / 100;
  const nbMensualites = parseInt(nbMensInput, 10) || 1;
  const acompte       = calculerAcompte(prixUnitaire, tauxAcompte);
  const mensualite    = prixUnitaire > 0 ? calculerMensualite(prixUnitaire, tauxAcompte, nbMensualites) : 0;

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
      surface_m2:     surfaceM2 > 0 ? surfaceM2 : undefined,
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

  const TYPES = ALL_TYPES.filter(t => allowedTypes.includes(t.id));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg sm:my-4 max-h-[95dvh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">{editing ? copy.titreEdit : copy.titreNouveau}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Programme PICLOM · GIE Mariama SAGNA</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type (masqué si un seul type possible dans ce catalogue) */}
          {TYPES.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{copy.typeLabel}</p>
              <div className={`grid gap-2 ${TYPES.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {TYPES.map(t => (
                  <button key={t.id} onClick={() => handleTypeChange(t.id)}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${type === t.id ? t.color : 'border-emerald-100 hover:border-gray-200'}`}
                  >
                    <p className="text-xs font-bold text-gray-900">{t.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sous-type logement */}
          {type === 'logement' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de villa</p>
              <div className="grid grid-cols-2 gap-2">
                {(['F2', 'F3'] as const).map(st => (
                  <button key={st} onClick={() => setSousType(st)}
                    className={`border-2 rounded-xl py-2.5 text-center font-bold text-sm transition-all ${sousType === st ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-emerald-100 text-gray-600 hover:border-gray-200'}`}
                  >
                    Villa {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom {noun === 'lotissement' ? 'du lotissement' : "de l'offre"} *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              placeholder={type === 'terrain_simple' ? 'Terrain Simple – Dakar' : type === 'logement' ? 'Villa F2 – Ndoyenne 01' : 'Terrain Viabilisé – Sébikhotane'}
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
            />
          </div>

          {/* Localisation + Surface */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Localisation *</label>
              <input type="text" value={localisation} onChange={e => setLocalisation(e.target.value)}
                placeholder="ex : Ndoyenne 01 – Sébikhotane"
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Surface (m²)</label>
              <input type="text" inputMode="numeric" value={surfaceInput} onChange={e => setSurfaceInput(e.target.value)}
                placeholder="ex : 300"
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description <span className="normal-case font-normal text-gray-400">(optionnel)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Détails supplémentaires sur l'offre…"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300 resize-none"
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
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frais de dossier (FCFA)</label>
              <input type="text" value={fraisInput} onChange={e => setFraisInput(e.target.value)}
                placeholder="0"
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Acompte + mensualités */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acompte (%)</label>
              <div className="mt-1 relative">
                <input type="number" min="0" max="100" value={tauxInput} onChange={e => setTauxInput(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 pr-7 outline-none focus:border-emerald-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nbre de mensualités</label>
              <input type="number" min="1" value={nbMensInput} onChange={e => setNbMensInput(e.target.value)}
                className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Récap calculé */}
          {prixUnitaire > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3">
              {surfaceM2 > 0 && (
                <div className="text-center">
                  <p className="text-xs text-gray-400">Surface</p>
                  <p className="text-sm font-black text-blue-700 mt-0.5">{formatSurface(surfaceM2)}</p>
                </div>
              )}
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

        <div className="px-6 py-4 border-t border-emerald-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving || prixUnitaire <= 0 || !nom.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : copy.boutonCreer}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte offre ──────────────────────────────────────────────────────────────
function OffreCard({ offre, onToggle, onEdit }: { offre: Offre; onToggle: () => void; onEdit: () => void }) {
  const acompte    = calculerAcompte(offre.prix_unitaire, offre.taux_acompte);
  const mensualite = calculerMensualite(offre.prix_unitaire, offre.taux_acompte, offre.nb_mensualites);

  const typeColor =
    offre.type === 'terrain_simple' ? 'text-blue-700 bg-blue-50 border-blue-100' :
    offre.type === 'logement'       ? 'text-purple-700 bg-purple-50 border-purple-100' :
                                      'text-green-700 bg-green-50 border-green-100';

  return (
    <div className={`bg-white rounded-2xl border p-5 space-y-4 transition-all duration-200 hover:shadow-md ${offre.statut !== 'active' ? 'opacity-60' : ''}`}>
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
          <p className="font-bold text-gray-900 text-sm leading-tight">{titreAvecSurface(offre.nom, offre.surface_m2)}</p>
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
      <div className="grid grid-cols-3 gap-2">
        {offre.surface_m2 && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Surface</p>
            <p className="text-sm font-black text-blue-700 mt-0.5">{formatSurface(offre.surface_m2)}</p>
          </div>
        )}
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

// ─── Catalogue ────────────────────────────────────────────────────────────────
interface CatalogueProps {
  types: TypeOffre[];
  offres: Offre[];
  loading: boolean;
  onChanged: () => void;
  /** Vocabulaire affiché : "lotissement" sur Terrains, "offre" sur Logements. */
  noun?: 'offre' | 'lotissement';
}

export default function CatalogueOffres({ types, offres, loading, onChanged, noun = 'offre' }: CatalogueProps) {
  const copy = COPY[noun];
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Offre | null>(null);
  const [tab, setTab]               = useState<'active' | 'inactive'>('active');
  const [filtreType, setFiltreType] = useState<TypeOffre | 'tous'>('tous');

  const sections = SECTIONS.filter(s => types.includes(s.type));
  const scoped   = offres.filter(o => types.includes(o.type));

  async function handleToggle(offre: Offre) {
    const next = offre.statut === 'active' ? 'inactive' : 'active';
    await updateOffreStatut(offre.id, next);
    onChanged();
  }

  function switchTab(t: 'active' | 'inactive') {
    setTab(t);
    setFiltreType('tous');
  }

  const toutesActives   = scoped.filter(o => o.statut === 'active');
  const toutesInactives = scoped.filter(o => o.statut !== 'active');
  const base            = tab === 'active' ? toutesActives : toutesInactives;

  const parType: Record<TypeOffre, Offre[]> = {
    terrain_simple: base.filter(o => o.type === 'terrain_simple'),
    logement:       base.filter(o => o.type === 'logement'),
    terrain_tf:     base.filter(o => o.type === 'terrain_tf'),
  };

  const affichees = filtreType === 'tous' ? base : parType[filtreType];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full sm:w-auto bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => switchTab('active')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Actives ({toutesActives.length})
          </button>
          <button
            onClick={() => switchTab('inactive')}
            className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'inactive' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inactives ({toutesInactives.length})
          </button>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shadow-sm"
        >
          {copy.nouveau}
        </button>
      </div>

      {/* Résumé par type (seulement si le catalogue en couvre plusieurs) */}
      {sections.length > 1 && (
        <div className={`grid gap-3 ${sections.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {sections.map(s => (
            <button key={s.type}
              onClick={() => setFiltreType(filtreType === s.type ? 'tous' : s.type)}
              className={`bg-white rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${filtreType === s.type ? 'ring-2 ring-green-400 border-green-200' : 'border-emerald-100'}`}
            >
              <p className={`text-2xl font-black ${s.color}`}>{parType[s.type].length}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? <Spinner /> : affichees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">
            {tab === 'active' ? copy.aucunActif : copy.aucunInactif}
            {filtreType !== 'tous' ? ` · ${LABELS_TYPE_OFFRE[filtreType]}` : ''}
          </p>
          {tab === 'active' && (
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="mt-3 text-sm text-green-600 hover:underline">
              {copy.creerPremier}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filtreType === 'tous'
            ? sections.map(s => parType[s.type].length > 0 && (
                <div key={s.type}>
                  {sections.length > 1 && (
                    <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${s.color}`}>{s.label}</p>
                  )}
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
          allowedTypes={types}
          noun={noun}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
