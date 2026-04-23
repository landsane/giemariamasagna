import { useState } from 'react';
import { MapPin, Tag } from 'lucide-react';
import type { Membre, Offre, SiteLogement } from '@/types';
import { TAUX_ACOMPTE, NB_MENSUALITES } from '@/types';
import { insertSouscriptionTerrain, insertSouscriptionLogement } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  membres: Membre[];
  offresSimples: Offre[];
  offresTF: Offre[];
  onClose: () => void;
  onCreated: () => void;
}

type Bien = 'simple' | 'tf';

export default function NouveauDossierTerrainsModal({ membres, offresSimples, offresTF, onClose, onCreated }: Props) {
  const [bien, setBien]         = useState<Bien>('simple');
  const [offreId, setOffreId]   = useState(offresSimples[0]?.id ?? '');
  const [nbTerrains, setNb]     = useState(1);
  const [membreId, setMembreId] = useState('');
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const offres   = bien === 'simple' ? offresSimples : offresTF;
  const offre    = offres.find(o => o.id === offreId);
  const prixTotal = offre ? nbTerrains * offre.prix_unitaire : 0;

  const acompte    = Math.round(prixTotal * TAUX_ACOMPTE);
  const mensualite = prixTotal > 0
    ? bien === 'simple' && offre && offre.nb_mensualites > 0
      ? Math.round(prixTotal / offre.nb_mensualites)
      : Math.round(prixTotal / NB_MENSUALITES)
    : 0;

  function siteFromOffre(o: Offre): SiteLogement {
    const loc = o.localisation.toLowerCase();
    return loc.includes('keur') || loc.includes('moussa') || loc.includes('diender')
      ? 'keur_moussa'
      : 'ndoyenne';
  }

  function switchBien(b: Bien) {
    setBien(b);
    setOffreId((b === 'simple' ? offresSimples : offresTF)[0]?.id ?? '');
    setNb(1);
  }

  const membresActifs = membres.filter(m => m.statut === 'actif');

  async function handleSubmit() {
    if (!membreId)      return setError('Sélectionne un membre.');
    if (!offreId)       return setError('Sélectionne une offre.');
    if (prixTotal <= 0) return setError('Le prix total doit être supérieur à 0.');

    setSaving(true);
    setError('');
    try {
      if (bien === 'simple') {
        await insertSouscriptionTerrain({
          membre_id:         membreId,
          nb_terrains:       nbTerrains,
          montant_total:     prixTotal,
          sgbs:              false,
          date_souscription: date,
          offre_id:          offreId,
        });
      } else {
        await insertSouscriptionLogement({
          membre_id:         membreId,
          type_villa:        'terrain',
          site:              offre ? siteFromOffre(offre) : 'ndoyenne',
          titre:             'TF',
          prix_total:        prixTotal,
          acompte_requis:    acompte,
          mensualite,
          date_souscription: date,
          offre_id:          offreId,
        });
      }
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
            <h3 className="font-black text-gray-900">Nouveau dossier terrain</h3>
            <p className="text-xs text-gray-400 mt-0.5">GIE Mariama SAGNA</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Type de bien ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de bien</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => switchBien('simple')}
                className={`border-2 rounded-xl p-3 text-left transition-all ${
                  bien === 'simple' ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-sm font-bold text-gray-900">Terrain Simple</p>
                <p className="text-xs text-gray-400 mt-0.5">Bail · {offresSimples.length} offre{offresSimples.length > 1 ? 's' : ''}</p>
              </button>
              <button onClick={() => switchBien('tf')}
                className={`border-2 rounded-xl p-3 text-left transition-all ${
                  bien === 'tf' ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-sm font-bold text-gray-900">Terrain TF</p>
                <p className="text-xs text-gray-400 mt-0.5">Titre Foncier · {offresTF.length} offre{offresTF.length > 1 ? 's' : ''}</p>
              </button>
            </div>
          </div>

          {/* ── Offre ── */}
          {offres.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
              Aucune offre active pour ce type. Crée d'abord une offre dans la section Offres.
            </p>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Offre{offres.length > 1 ? 's' : ''} disponible{offres.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {offres.map(o => {
                  const mens = Math.round(o.prix_unitaire / o.nb_mensualites);
                  const acc  = Math.round(o.prix_unitaire * o.taux_acompte);
                  const isSelected = (offreId || offres[0]?.id) === o.id;
                  return (
                    <button key={o.id} onClick={() => setOffreId(o.id)}
                      className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                        isSelected
                          ? bien === 'simple' ? 'border-blue-400 bg-blue-50' : 'border-green-400 bg-green-50'
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
                      <div className={`grid gap-2 text-xs mt-2 ${bien === 'tf' && acc > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <div className="bg-white rounded-lg p-2 text-center">
                          <p className="text-gray-400">Prix/parcelle</p>
                          <p className="font-bold text-gray-900">{formatCurrency(o.prix_unitaire)}</p>
                        </div>
                        {bien === 'tf' && acc > 0 && (
                          <div className="bg-white rounded-lg p-2 text-center">
                            <p className="text-gray-400">Acompte {Math.round(o.taux_acompte * 100)}%</p>
                            <p className="font-bold text-amber-700">{formatCurrency(acc)}</p>
                          </div>
                        )}
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

          {/* ── Nombre de terrains ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre de parcelles</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setNb(Math.max(1, nbTerrains - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors">−</button>
              <span className="text-2xl font-black text-gray-900 w-10 text-center">{nbTerrains}</span>
              <button onClick={() => setNb(nbTerrains + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-700 text-lg font-bold hover:bg-gray-50 transition-colors">+</button>
              {offre && (
                <span className="text-xs text-gray-400 ml-1">× {formatCurrency(offre.prix_unitaire)}</span>
              )}
            </div>
          </div>

          {/* ── Membre ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Membre</p>
            <select value={membreId} onChange={e => setMembreId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-white"
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
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving || !membreId || !offreId || prixTotal <= 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}
