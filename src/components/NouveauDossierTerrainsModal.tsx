import { useState } from 'react';
import type { Membre, Offre, SiteLogement } from '@/types';
import { TAUX_ACOMPTE, NB_MENSUALITES } from '@/types';
import { insertSouscriptionTerrain, insertSouscriptionLogement } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

interface Props {
  membres: Membre[];
  offresSimples: Offre[];
  onClose: () => void;
  onCreated: () => void;
}

type Bien = 'simple' | 'tf';

export default function NouveauDossierTerrainsModal({ membres, offresSimples, onClose, onCreated }: Props) {
  const [membreId, setMembreId] = useState('');
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const [biens, setBiens] = useState<Set<Bien>>(new Set(['simple']));

  // Terrain simple
  const [offreId, setOffreId]   = useState(offresSimples[0]?.id ?? '');
  const [nbTerrains, setNb]     = useState(1);
  const [sgbs, setSgbs]         = useState(false);

  // Terrain TF
  const [prixInput, setPrix]    = useState('');
  const [site, setSite]         = useState<SiteLogement>('ndoyenne');

  const offre          = offresSimples.find(o => o.id === offreId);
  const montantSimple  = offre ? nbTerrains * offre.prix_unitaire : 0;
  const mensSimple     = offre && offre.nb_mensualites > 0 ? Math.round(montantSimple / offre.nb_mensualites) : 0;

  const prixTF       = parseInt(prixInput.replace(/\s/g, ''), 10) || 0;
  const acompteTF    = Math.round(prixTF * TAUX_ACOMPTE);
  const mensTF       = prixTF > 0 ? Math.round(prixTF / NB_MENSUALITES) : 0;

  const hasSimple = biens.has('simple');
  const hasTF     = biens.has('tf');

  function toggle(b: Bien) {
    setBiens(prev => {
      const next = new Set(prev);
      if (next.has(b) && next.size > 1) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  const membresActifs = membres.filter(m => m.statut === 'actif');

  async function handleSubmit() {
    if (!membreId)                            return setError('Sélectionne un membre.');
    if (hasSimple && montantSimple <= 0)      return setError('Sélectionne une offre valide pour le terrain simple.');
    if (hasTF && prixTF <= 0)                 return setError('Saisis le prix du terrain TF.');

    setSaving(true);
    setError('');
    try {
      const jobs: Promise<unknown>[] = [];

      if (hasSimple) {
        jobs.push(insertSouscriptionTerrain({
          membre_id:         membreId,
          nb_terrains:       nbTerrains,
          montant_total:     montantSimple,
          sgbs,
          date_souscription: date,
          offre_id:          offreId || undefined,
        }));
      }

      if (hasTF) {
        jobs.push(insertSouscriptionLogement({
          membre_id:         membreId,
          type_villa:        'terrain',
          site,
          titre:             'TF',
          prix_total:        prixTF,
          acompte_requis:    acompteTF,
          mensualite:        mensTF,
          date_souscription: date,
        }));
      }

      await Promise.all(jobs);
      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = [hasSimple && 'Simple', hasTF && 'TF'].filter(Boolean).join(' + ');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[95dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900">Nouveau dossier terrain</h3>
            <p className="text-xs text-gray-400 mt-0.5">GIE Maria Masagna</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* ── Sélection des biens ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type de bien</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => toggle('simple')}
                className={`border-2 rounded-xl p-3 text-left transition-all ${
                  hasSimple ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-sm font-bold text-gray-900">Terrain Simple</p>
                <p className="text-xs text-gray-400 mt-0.5">Bail · prix/parcelle</p>
              </button>
              <button onClick={() => toggle('tf')}
                className={`border-2 rounded-xl p-3 text-left transition-all ${
                  hasTF ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <p className="text-sm font-bold text-gray-900">Terrain TF</p>
                <p className="text-xs text-gray-400 mt-0.5">Titre Foncier · prix libre</p>
              </button>
            </div>
            {hasSimple && hasTF && (
              <p className="text-xs text-gray-400 mt-1.5">
                Les deux dossiers seront créés pour le même membre.
              </p>
            )}
          </div>

          {/* ── Terrain Simple ── */}
          {hasSimple && (
            <div className="border border-blue-100 rounded-xl p-4 space-y-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Terrain Simple</p>

              {offresSimples.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Offre</p>
                  <div className="space-y-1.5">
                    {offresSimples.map(o => (
                      <button key={o.id} onClick={() => setOffreId(o.id)}
                        className={`w-full border rounded-xl p-2.5 text-left transition-all ${
                          offreId === o.id ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <p className="text-xs font-bold text-gray-900">{o.nom}</p>
                        <p className="text-xs text-gray-400">{o.localisation} · {formatCurrency(o.prix_unitaire)}/parcelle · {o.nb_mensualites} mois</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nombre de parcelles</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => setNb(Math.max(1, nbTerrains - 1))}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">−</button>
                  <span className="text-xl font-black text-gray-900 w-8 text-center">{nbTerrains}</span>
                  <button onClick={() => setNb(nbTerrains + 1)}
                    className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">+</button>
                  {offre && <span className="text-xs text-gray-400 ml-1">× {formatCurrency(offre.prix_unitaire)}</span>}
                </div>
              </div>

              {montantSimple > 0 && (
                <div className="bg-blue-50 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-gray-400">Montant total</p><p className="font-bold text-gray-900">{formatCurrency(montantSimple)}</p></div>
                  <div><p className="text-gray-400">Mensualité</p><p className="font-bold text-green-700">{formatCurrency(mensSimple)}/mois</p></div>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={sgbs} onChange={e => setSgbs(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Paiement via compte SGBS</span>
              </label>
            </div>
          )}

          {/* ── Terrain TF ── */}
          {hasTF && (
            <div className="border border-green-100 rounded-xl p-4 space-y-4">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Terrain TF</p>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prix du terrain (FCFA)</p>
                <input
                  type="text"
                  placeholder="ex : 8 000 000"
                  value={prixInput}
                  onChange={e => setPrix(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 placeholder:text-gray-300"
                />
              </div>

              {prixTF > 0 && (
                <div className="bg-green-50 rounded-lg p-2.5 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-gray-400">Acompte 8%</p><p className="font-bold text-amber-700">{formatCurrency(acompteTF)}</p></div>
                  <div><p className="text-gray-400">Mensualité</p><p className="font-bold text-green-700">{formatCurrency(mensTF)}/mois</p></div>
                  <div><p className="text-gray-400">Durée</p><p className="font-bold text-gray-700">120 mois</p></div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Site</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['ndoyenne', 'keur_moussa'] as SiteLogement[]).map(s => (
                    <button key={s} onClick={() => setSite(s)}
                      className={`border-2 rounded-xl p-2.5 text-left transition-all ${
                        site === s ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-900">{s === 'ndoyenne' ? 'Ndoyenne 01' : 'Keur Moussa'}</p>
                      <p className="text-xs text-gray-400">{s === 'ndoyenne' ? 'Sébikhotane' : 'Diender'}</p>
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                Toujours sous <strong>Titre Foncier (TF)</strong>
              </p>
            </div>
          )}

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
          <button onClick={handleSubmit} disabled={saving || !membreId}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : `Créer · ${submitLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}
