import { useState, useEffect, useRef } from 'react';
import type { Membre } from '@/types';
import { insertMembre, updateMembre, uploadMembrePhoto, fetchNextMembreId } from '@/lib/queries';
import { Camera } from 'lucide-react';

interface Props {
  initial?: Membre;
  onClose: () => void;
  onSaved: () => void;
}

export default function MembreFormModal({ initial, onClose, onSaved }: Props) {
  const editing = !!initial;

  const [nextId,    setNextId]    = useState('');
  const [nom,       setNom]       = useState(initial?.nom ?? '');
  const [prenom,    setPrenom]    = useState(initial?.prenom ?? '');
  const [telephone, setTel]       = useState(initial?.telephone ?? '');
  const [email,     setEmail]     = useState(initial?.email ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPreview] = useState<string>(initial?.photo_url ?? '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) fetchNextMembreId().then(setNextId);
  }, [editing]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  const idAffiche = editing ? initial!.id_membre : (nextId || '…');
  const initiales = prenom && nom ? `${prenom[0]}${nom[0]}`.toUpperCase() : idAffiche.slice(0, 2);

  async function handleSubmit() {
    if (!nom.trim() || !prenom.trim()) return setError('Le nom et le prénom sont obligatoires.');
    setSaving(true);
    setError('');

    try {
      let photo_url = initial?.photo_url;

      if (photoFile) {
        const tempId = editing ? initial!.id : idAffiche;
        photo_url = await uploadMembrePhoto(tempId, photoFile);
      }

      if (editing) {
        await updateMembre(initial!.id, {
          nom:       nom.trim().toUpperCase(),
          prenom:    prenom.trim(),
          telephone: telephone.trim() || undefined,
          email:     email.trim() || undefined,
          photo_url,
        });
      } else {
        await insertMembre({
          id_membre: idAffiche,
          nom:       nom.trim().toUpperCase(),
          prenom:    prenom.trim(),
          telephone: telephone.trim() || undefined,
          email:     email.trim() || undefined,
          statut:    'actif',
          photo_url,
        });
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[95dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">{editing ? 'Modifier le membre' : 'Nouveau membre'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">GIE Maria Masagna</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Photo + ID */}
          <div className="flex items-center gap-4">
            {/* Zone photo cliquable */}
            <div
              className="relative w-20 h-20 rounded-full cursor-pointer group flex-shrink-0"
              onClick={() => fileRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Photo" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-black">
                  {initiales}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            <div className="flex-1">
              {!editing && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 flex items-center justify-between mb-3">
                  <p className="text-xs text-green-700">Identifiant</p>
                  <p className="text-base font-black text-green-700">{idAffiche}</p>
                </div>
              )}
              {editing && (
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400">Identifiant</p>
                  <p className="text-base font-black text-gray-600">{initial!.id_membre}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">Cliquer sur la photo pour changer</p>
            </div>
          </div>

          {/* Prénom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prénom *</label>
            <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
              placeholder="Ibrahima"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              placeholder="DIALLO"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Téléphone</label>
            <input type="tel" value={telephone} onChange={e => setTel(e.target.value)}
              placeholder="77 123 4567"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.com"
              className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving || !nom.trim() || !prenom.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le membre'}
          </button>
        </div>
      </div>
    </div>
  );
}
