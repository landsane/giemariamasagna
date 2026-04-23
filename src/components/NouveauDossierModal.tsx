import { useState } from 'react';
import type { Membre, TypeBien, SiteLogement, TitreLogement } from '@/types';
import { PRIX_F2, PRIX_F3, TAUX_ACOMPTE, NB_MENSUALITES, LABELS_SITE } from '@/types';
import { insertSouscriptionLogement } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  membres: Membre[];
  onClose: () => void;
  onCreated: () => void;
}

const TYPES: { id: TypeBien; label: string; description: string; color: string }[] = [
  { id: 'F2',      label: 'Villa F2',    description: '2 pièces · 16 000 000 F',  color: 'border-blue-400 bg-blue-50' },
  { id: 'F3',      label: 'Villa F3',    description: '3 pièces · 20 000 000 F',  color: 'border-purple-400 bg-purple-50' },
  { id: 'terrain', label: 'Terrain TF',  description: 'Prix libre · Titre Foncier', color: 'border-green-400 bg-green-50' },
];

function prixDefaut(type: TypeBien) {
  if (type === 'F2') return PRIX_F2;
  if (type === 'F3') return PRIX_F3;
  return 0;
}

export default function NouveauDossierModal({ membres, onClose, onCreated }: Props) {
  const [step, setStep]           = useState<1 | 2>(1);
  const [type, setType]           = useState<TypeBien>('F2');
  const [membreId, setMembreId]   = useState('');
  const [site, setSite]           = useState<SiteLogement>('ndoyenne');
  const [titre, setTitre]         = useState<TitreLogement>('TF');
  const [prixInput, setPrixInput] = useState('');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const isTerrainTF = type === 'terrain';
  const prixTotal   = isTerrainTF
    ? parseInt(prixInput.replace(/\s/g, ''), 10) || 0
    : prixDefaut(type);
  const acompte     = Math.round(prixTotal * TAUX_ACOMPTE);
  const mensualite  = prixTotal > 0 ? Math.round(prixTotal / NB_MENSUALITES) : 0;

  const membresActifs = membres.filter(m => m.statut === 'actif');

  async function handleSubmit() {
    if (!membreId)    return setError('Sélectionne un membre.');
    if (prixTotal <= 0) return setError('Le prix doit être supérieur à 0.');

    setSaving(true);
    setError('');
    try {
      await insertSouscriptionLogement({
        membre_id:        membreId,
        type_villa:       type,
        site,
        titre:            isTerrainTF ? 'TF' : titre,
        prix_total:       prixTotal,
        acompte_requis:   acompte,
        mensualite,
        date_souscription: date,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Nouveau dossier</h3>
            <p className="text-xs text-gray-400 mt-0.5">Programme PICLOM · Le Millénium 7SD</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Étape 1 — Type de bien */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de bien</p>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id); setPrixInput(''); }}
                  className={`border-2 rounded-xl p-3 text-left transition-all ${
                    type === t.id ? t.color + ' border-opacity-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Prix terrain TF (libre) */}
          {isTerrainTF && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prix du terrain (FCFA)</p>
              <input
                type="text"
                placeholder="ex : 8 000 000"
                value={prixInput}
                onChange={e => setPrixInput(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* Récap prix */}
          {prixTotal > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-gray-400">Prix total</p><p className="font-bold text-gray-900">{formatCurrency(prixTotal)}</p></div>
              <div><p className="text-gray-400">Acompte 8%</p><p className="font-bold text-amber-700">{formatCurrency(acompte)}</p></div>
              <div><p className="text-gray-400">Mensualité</p><p className="font-bold text-green-700">{formatCurrency(mensualite)}/mois</p></div>
            </div>
          )}

          {/* Membre */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Membre</p>
            <select
              value={membreId}
              onChange={e => setMembreId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 bg-white"
            >
              <option value="">— Sélectionner un membre —</option>
              {membresActifs.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id_membre} · {m.prenom} {m.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Site */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Site</p>
            <div className="grid grid-cols-2 gap-2">
              {(['ndoyenne', 'keur_moussa'] as SiteLogement[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSite(s)}
                  className={`border-2 rounded-xl p-3 text-left transition-all ${
                    site === s ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900">
                    {s === 'ndoyenne' ? 'Ndoyenne 01' : 'Keur Moussa'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s === 'ndoyenne' ? 'Sébikhotane' : 'Diender'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Titre — uniquement pour logements F2/F3 */}
          {!isTerrainTF && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Titre de propriété</p>
              <div className="grid grid-cols-2 gap-2">
                {(['TF', 'bail'] as TitreLogement[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTitre(t)}
                    className={`border-2 rounded-xl p-3 text-center transition-all ${
                      titre === t ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{t}</p>
                    <p className="text-xs text-gray-400">{t === 'TF' ? 'Titre Foncier' : 'Bail emphytéotique'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isTerrainTF && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
              Les terrains TF sont toujours sous <strong>Titre Foncier</strong>.
            </div>
          )}

          {/* Date */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date de souscription</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400"
            />
          </div>

          {/* Erreur */}
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || prixTotal <= 0 || !membreId}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Créer le dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}
