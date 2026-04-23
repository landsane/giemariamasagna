import { useState, useEffect } from 'react';
import { insertMembre, fetchNextMembreId } from '@/lib/queries';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function NouveauMembreModal({ onClose, onCreated }: Props) {
  const [nextId, setNextId]     = useState('');
  const [nom, setNom]           = useState('');
  const [prenom, setPrenom]     = useState('');
  const [telephone, setTel]     = useState('');
  const [email, setEmail]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetchNextMembreId().then(setNextId);
  }, []);

  async function handleSubmit() {
    if (!nom.trim() || !prenom.trim()) return setError('Le nom et le prénom sont obligatoires.');
    setSaving(true);
    setError('');
    try {
      await insertMembre({
        id_membre: nextId,
        nom:       nom.trim().toUpperCase(),
        prenom:    prenom.trim(),
        telephone: telephone.trim() || undefined,
        email:     email.trim() || undefined,
        statut:    'actif',
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Nouveau membre</h3>
            <p className="text-xs text-gray-400 mt-0.5">GIE Maria Masagna</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* ID auto */}
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-green-700">Identifiant attribué automatiquement</p>
            <p className="text-lg font-black text-green-700">{nextId || '…'}</p>
          </div>

          {/* Prénom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prénom *</label>
            <input
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              placeholder="Ibrahima"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom *</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="DIALLO"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={e => setTel(e.target.value)}
              placeholder="77 123 4567"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !nom.trim() || !prenom.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Créer le membre'}
          </button>
        </div>
      </div>
    </div>
  );
}
