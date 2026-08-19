import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { fetchParcellesTerrain, fetchParcellesLogement, updateNumeroParcelle } from '@/lib/queries';
import type { Parcelle } from '@/types';
import Spinner from './Spinner';

interface Props {
  souscriptionTerrainId?: string;
  souscriptionLogementId?: string;
}

// Une ligne éditable par parcelle physique du dossier — prépare la future
// étape d'attribution (chaque parcelle recevra un numéro lié à son
// propriétaire), sans l'implémenter elle-même : pour l'instant, saisie
// manuelle libre, vide par défaut.
function LigneParcelle({ parcelle, onSaved }: { parcelle: Parcelle; onSaved: () => void }) {
  const [value, setValue]   = useState(parcelle.numero_parcelle ?? '');
  const [saving, setSaving] = useState(false);

  async function handleBlur() {
    const trimmed = value.trim();
    if (trimmed === (parcelle.numero_parcelle ?? '')) return;
    setSaving(true);
    try {
      await updateNumeroParcelle(parcelle.id, trimmed);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
      <span className="text-xs text-gray-400 w-20 flex-shrink-0">Parcelle {parcelle.numero}</span>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={saving}
        placeholder="Non attribuée"
        className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400 placeholder:text-gray-300 bg-white disabled:opacity-50"
      />
    </div>
  );
}

export default function ParcellesEditor({ souscriptionTerrainId, souscriptionLogementId }: Props) {
  const { data: parcelles, loading, refetch } = useAsync(
    () => souscriptionTerrainId
      ? fetchParcellesTerrain(souscriptionTerrainId)
      : fetchParcellesLogement(souscriptionLogementId!),
    [souscriptionTerrainId, souscriptionLogementId]
  );

  if (loading) return <Spinner className="py-4" />;
  if (!parcelles?.length) return null;

  const nbAttribuees = parcelles.filter(p => p.numero_parcelle).length;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Numéros de parcelle ({nbAttribuees}/{parcelles.length} attribué{nbAttribuees > 1 ? 's' : ''})
      </p>
      <div className="space-y-1.5">
        {parcelles.map(p => (
          <LigneParcelle key={p.id} parcelle={p} onSaved={refetch} />
        ))}
      </div>
    </div>
  );
}
