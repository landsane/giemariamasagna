import { useState } from 'react';
import type { SouscriptionTerrain, Membre, ModePayment } from '@/types';
import { LABELS_MODE } from '@/types';
import { insertPaiementTerrain } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  souscription: SouscriptionTerrain;
  membre: Membre | undefined;
  nextNumero: number;
  onClose: () => void;
  onSaved: () => void;
}

const MODES: ModePayment[] = ['wave', 'orange_money', 'banque', 'autres'];

export default function VersementTerrainModal({ souscription, membre, nextNumero, onClose, onSaved }: Props) {
  const [montant, setMontant]               = useState('');
  const [date, setDate]                     = useState(new Date().toISOString().slice(0, 10));
  const [encaisseurPrenom, setPrenom]       = useState('');
  const [encaisseurNom, setNom]             = useState('');
  const [mode, setMode]                     = useState<ModePayment>('wave');
  const [reference, setReference]           = useState('');
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');

  async function handleSubmit() {
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (!m || m <= 0) return setError('Montant invalide.');
    if (!encaisseurNom.trim() || !encaisseurPrenom.trim()) return setError("Nom et prénom de l'encaisseur requis.");

    setSaving(true);
    setError('');
    try {
      await insertPaiementTerrain({
        souscription_id:   souscription.id,
        membre_id:         souscription.membre_id,
        numero_versement:  nextNumero,
        date_versement:    date,
        montant:           m,
        encaisseur_nom:    encaisseurNom.trim(),
        encaisseur_prenom: encaisseurPrenom.trim(),
        mode_paiement:     mode,
        reference:         reference.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[95dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Nouveau versement</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {membre?.prenom} {membre?.nom} · Versement n°{nextNumero}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs flex justify-between">
            <span className="text-gray-500">Reste à verser</span>
            <span className="font-bold text-amber-700">{formatCurrency(souscription.reste_a_verser)}</span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Montant (FCFA)</p>
            <input
              type="text"
              placeholder="ex : 460 000"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date du versement</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Encaisseur</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Prénom"
                value={encaisseurPrenom}
                onChange={e => setPrenom(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
              <input
                type="text"
                placeholder="Nom"
                value={encaisseurNom}
                onChange={e => setNom(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`border-2 rounded-xl p-2.5 text-left transition-all ${
                    mode === m ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-900">{LABELS_MODE[m]}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Référence (optionnel)</p>
            <input
              type="text"
              placeholder="N° transaction, chèque…"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
