import { useState } from 'react';
import type { Membre, Offre } from '@/types';
import { insertSouscriptionTerrain } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  membres: Membre[];
  offres: Offre[];
  onClose: () => void;
  onCreated: () => void;
}

export default function NouveauSouscriptionTerrainModal({ membres, offres, onClose, onCreated }: Props) {
  const [membreId, setMembreId] = useState('');
  const [offreId, setOffreId]   = useState(offres[0]?.id ?? '');
  const [nbTerrains, setNb]     = useState(1);
  const [sgbs, setSgbs]         = useState(false);
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const offre        = offres.find(o => o.id === offreId);
  const montantTotal = offre ? nbTerrains * offre.prix_unitaire : 0;
  const mensualite   = offre && offre.nb_mensualites > 0
    ? Math.round((nbTerrains * offre.prix_unitaire) / offre.nb_mensualites)
    : 0;

  const membresActifs = membres.filter(m => m.statut === 'actif');

  async function handleSubmit() {
    if (!membreId)     return setError('Sélectionne un membre.');
    if (!offreId)      return setError('Sélectionne une offre.');
    if (nbTerrains < 1) return setError('Au moins 1 parcelle.');

    setSaving(true);
    setError('');
    try {
      await insertSouscriptionTerrain({
        membre_id:         membreId,
        nb_terrains:       nbTerrains,
        montant_total:     montantTotal,
        sgbs,
        date_souscription: date,
        offre_id:          offreId,
      });
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
            <h3 className="font-black text-gray-900">Nouvelle souscription terrain</h3>
            <p className="text-xs text-gray-400 mt-0.5">Terrain Simple · Bail</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {offres.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Offre</p>
              <div className="space-y-2">
                {offres.map(o => (
                  <button key={o.id} onClick={() => setOffreId(o.id)}
                    className={`w-full border-2 rounded-xl p-3 text-left transition-all ${
                      offreId === o.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{o.nom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.localisation} · {formatCurrency(o.prix_unitaire)}/parcelle · {o.nb_mensualites} mois
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre de parcelles</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setNb(Math.max(1, nbTerrains - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 text-lg font-bold hover:bg-gray-50 transition-colors">−</button>
              <span className="text-2xl font-black text-gray-900 w-10 text-center">{nbTerrains}</span>
              <button onClick={() => setNb(nbTerrains + 1)}
                className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 text-lg font-bold hover:bg-gray-50 transition-colors">+</button>
              {offre && (
                <span className="text-xs text-gray-400 ml-2">× {formatCurrency(offre.prix_unitaire)}</span>
              )}
            </div>
          </div>

          {montantTotal > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Montant total</p>
                <p className="font-bold text-gray-900">{formatCurrency(montantTotal)}</p>
              </div>
              <div>
                <p className="text-gray-400">Mensualité estimée</p>
                <p className="font-bold text-green-700">{formatCurrency(mensualite)}/mois</p>
              </div>
            </div>
          )}

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

          <div className="flex items-center gap-3">
            <input type="checkbox" id="sgbs" checked={sgbs} onChange={e => setSgbs(e.target.checked)}
              className="w-4 h-4 accent-green-600" />
            <label htmlFor="sgbs" className="text-sm text-gray-700">Paiement via compte SGBS</label>
          </div>

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
          <button onClick={handleSubmit} disabled={saving || !membreId || montantTotal <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : 'Créer la souscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
