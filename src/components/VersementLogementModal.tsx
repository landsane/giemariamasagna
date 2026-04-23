import { useState } from 'react';
import type { SouscriptionLogement, Membre, ModePayment, TypePaiementLogement } from '@/types';
import { LABELS_MODE } from '@/types';
import { insertPaiementLogement } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  souscription: SouscriptionLogement;
  membre: Membre | undefined;
  initialType: TypePaiementLogement;
  onClose: () => void;
  onSaved: () => void;
}

const MODES: ModePayment[] = ['wave', 'orange_money', 'banque', 'autres'];

export default function VersementLogementModal({ souscription, membre, initialType, onClose, onSaved }: Props) {
  const resteAcompte = Math.max(0, souscription.acompte_requis - souscription.acompte_verse);

  const [typePaiement, setTypePaiement] = useState<TypePaiementLogement>(initialType);
  const [montant, setMontant]           = useState(() =>
    String(initialType === 'acompte' ? resteAcompte : souscription.mensualite)
  );
  const [date, setDate]                 = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode]                 = useState<ModePayment>('wave');
  const [reference, setReference]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');

  function handleTypeChange(t: TypePaiementLogement) {
    setTypePaiement(t);
    setMontant(String(t === 'acompte' ? resteAcompte : souscription.mensualite));
  }

  async function handleSubmit() {
    const m = parseInt(montant.replace(/\s/g, ''), 10);
    if (!m || m <= 0) return setError('Montant invalide.');

    setSaving(true);
    setError('');
    try {
      await insertPaiementLogement({
        souscription_id: souscription.id,
        membre_id:       souscription.membre_id,
        type_paiement:   typePaiement,
        date_versement:  date,
        montant:         m,
        mode_paiement:   mode,
        reference:       reference.trim() || undefined,
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
            <p className="text-xs text-gray-400 mt-0.5">{membre?.prenom} {membre?.nom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de versement</p>
            <div className="grid grid-cols-2 gap-2">
              {(['acompte', 'mensualite'] as TypePaiementLogement[]).map(t => (
                <button key={t} onClick={() => handleTypeChange(t)}
                  className={`border-2 rounded-xl p-3 text-left transition-all ${
                    typePaiement === t ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{t === 'acompte' ? 'Acompte' : 'Mensualité'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t === 'acompte'
                      ? `${formatCurrency(souscription.acompte_verse)} / ${formatCurrency(souscription.acompte_requis)}`
                      : `${souscription.nb_mensualites_payees} / 120 payées`}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Montant (FCFA)</p>
            <input
              type="text"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date du versement</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400"
            />
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
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
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
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
