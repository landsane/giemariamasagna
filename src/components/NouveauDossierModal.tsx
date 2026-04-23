import { useState } from 'react';
import { MapPin, Tag } from 'lucide-react';
import type { Membre, TypeBien, SiteLogement, Offre } from '@/types';
import { PRIX_F2, PRIX_F3, TAUX_ACOMPTE, NB_MENSUALITES } from '@/types';
import { insertSouscriptionLogement } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  membres: Membre[];
  offres?: Offre[];
  initialType?: TypeBien;
  onClose: () => void;
  onCreated: () => void;
}

const TYPES: { id: Exclude<TypeBien, 'terrain'>; label: string; description: string; color: string; activeColor: string }[] = [
  { id: 'F2', label: 'Villa F2', description: '2 pièces',  color: 'border-blue-400 bg-blue-50',   activeColor: 'border-blue-400 bg-blue-50'   },
  { id: 'F3', label: 'Villa F3', description: '3 pièces',  color: 'border-purple-400 bg-purple-50', activeColor: 'border-purple-400 bg-purple-50' },
];

function siteFromOffre(o: Offre): SiteLogement {
  const loc = o.localisation.toLowerCase();
  return loc.includes('keur') || loc.includes('moussa') || loc.includes('diender')
    ? 'keur_moussa'
    : 'ndoyenne';
}

export default function NouveauDossierModal({ membres, offres, initialType, onClose, onCreated }: Props) {
  const isTerrainContext = initialType === 'terrain';

  const [type, setType]         = useState<Exclude<TypeBien, 'terrain'>>(
    initialType === 'terrain' ? 'F2' : ((initialType ?? 'F2') as Exclude<TypeBien, 'terrain'>)
  );
  const [offreId, setOffreId]     = useState('');
  const [nbLogements, setNbLog]   = useState(1);
  const [membreId, setMembreId]   = useState('');
  const [prixInput, setPrix]      = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const offresForType = (offres ?? []).filter(
    o => o.type === 'logement' && o.sous_type === type && o.statut === 'active'
  );

  const selectedOffre   = offresForType.find(o => o.id === offreId) ?? offresForType[0];
  const prixBase        = selectedOffre?.prix_unitaire ?? (type === 'F2' ? PRIX_F2 : PRIX_F3);
  const prixUnitaire    = isTerrainContext
    ? parseInt(prixInput.replace(/\s/g, ''), 10) || 0
    : prixBase;
  const prixTotal       = prixUnitaire * (isTerrainContext ? 1 : nbLogements);
  const tauxAcompte     = selectedOffre?.taux_acompte ?? TAUX_ACOMPTE;
  const nbMensualites   = selectedOffre?.nb_mensualites ?? NB_MENSUALITES;
  const acompte         = Math.round(prixUnitaire * tauxAcompte);
  const mensualite      = prixUnitaire > 0 ? Math.round(prixUnitaire / nbMensualites) : 0;

  function handleTypeChange(t: Exclude<TypeBien, 'terrain'>) {
    setType(t);
    setOffreId('');
    setNbLog(1);
  }

  const membresActifs = membres.filter(m => m.statut === 'actif');

  async function handleSubmit() {
    if (!membreId)      return setError('Sélectionne un membre.');
    if (prixTotal <= 0) return setError('Le prix doit être supérieur à 0.');

    setSaving(true);
    setError('');
    try {
      await Promise.all(
        Array.from({ length: isTerrainContext ? 1 : nbLogements }, () =>
          insertSouscriptionLogement({
            membre_id:         membreId,
            type_villa:        isTerrainContext ? 'terrain' : type,
            site:              selectedOffre ? siteFromOffre(selectedOffre) : 'ndoyenne',
            titre:             'TF',
            prix_total:        prixUnitaire,
            acompte_requis:    acompte,
            mensualite,
            date_souscription: date,
            offre_id:          selectedOffre?.id,
          })
        )
      );
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[95dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Nouveau dossier</h3>
            <p className="text-xs text-gray-400 mt-0.5">Programme PICLOM · Le Millénium 7SD</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Type de bien ── */}
          {!isTerrainContext && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de bien</p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map(t => (
                  <button key={t.id} onClick={() => handleTypeChange(t.id)}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${
                      type === t.id ? t.activeColor : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Offres disponibles ── */}
          {!isTerrainContext && offresForType.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Offre{offresForType.length > 1 ? 's' : ''} disponible{offresForType.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {offresForType.map(o => {
                  const mens = Math.round(o.prix_unitaire / o.nb_mensualites);
                  const acc  = Math.round(o.prix_unitaire * o.taux_acompte);
                  const isSelected = (offreId || offresForType[0]?.id) === o.id;
                  return (
                    <button key={o.id} onClick={() => setOffreId(o.id)}
                      className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? type === 'F3' ? 'border-purple-400 bg-purple-50' : 'border-blue-400 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{o.nom}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />{o.localisation}
                          </p>
                        </div>
                        <Tag className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-400">Prix</p>
                          <p className="font-bold text-gray-900">{formatCurrency(o.prix_unitaire)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-400">Acompte {Math.round(o.taux_acompte * 100)}%</p>
                          <p className="font-bold text-amber-700">{formatCurrency(acc)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-400">Mensualité</p>
                          <p className="font-bold text-green-700">{formatCurrency(mens)}/mois</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Pas d'offre active ── */}
          {!isTerrainContext && offresForType.length === 0 && offres !== undefined && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
              <p className="font-semibold">Prix {type === 'F2' ? 'Villa F2' : 'Villa F3'}</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div><p className="text-gray-400">Total</p><p className="font-bold text-gray-900">{formatCurrency(prixBase)}</p></div>
                <div><p className="text-gray-400">Acompte 8%</p><p className="font-bold text-amber-700">{formatCurrency(acompte)}</p></div>
                <div><p className="text-gray-400">Mensualité</p><p className="font-bold text-green-700">{formatCurrency(mensualite)}/mois</p></div>
              </div>
            </div>
          )}

          {/* ── Récap (sans offres passées ou contexte terrain) ── */}
          {(isTerrainContext || offres === undefined) && prixTotal > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-gray-400">Prix total</p><p className="font-bold text-gray-900">{formatCurrency(prixTotal)}</p></div>
              <div><p className="text-gray-400">Acompte 8%</p><p className="font-bold text-amber-700">{formatCurrency(acompte)}</p></div>
              <div><p className="text-gray-400">Mensualité</p><p className="font-bold text-green-700">{formatCurrency(mensualite)}/mois</p></div>
            </div>
          )}

          {/* ── Prix terrain TF (libre, contexte terrains) ── */}
          {isTerrainContext && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prix du terrain (FCFA)</p>
              <input type="text" placeholder="ex : 8 000 000" value={prixInput}
                onChange={e => setPrix(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* ── Nombre de logements ── */}
          {!isTerrainContext && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre de logements</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setNbLog(Math.max(1, nbLogements - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors">−</button>
                <span className="text-2xl font-black text-gray-900 w-10 text-center">{nbLogements}</span>
                <button onClick={() => setNbLog(nbLogements + 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors">+</button>
                {prixUnitaire > 0 && <span className="text-xs text-gray-400 ml-1">× {formatCurrency(prixUnitaire)}</span>}
              </div>
            </div>
          )}

          {/* ── Membre ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Membre</p>
            <select value={membreId} onChange={e => setMembreId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 bg-white"
            >
              <option value="">— Sélectionner un membre —</option>
              {membresActifs.map(m => (
                <option key={m.id} value={m.id}>{m.id_membre} · {m.prenom} {m.nom}</option>
              ))}
            </select>
          </div>

          {/* ── Date ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date de souscription</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving || prixTotal <= 0 || !membreId}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}
