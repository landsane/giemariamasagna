import { useState, useMemo, useRef } from 'react';
import { Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import type { Membre, Offre } from '@/types';
import { PRIX_TERRAIN, PRIX_F2, PRIX_F3, TAUX_ACOMPTE, NB_MENSUALITES } from '@/types';
import { insertMembre, fetchNextMembreId, insertSouscriptionTerrain, insertSouscriptionLogement } from '@/lib/queries';
import { parseImport, TEMPLATES, COL_HEADERS } from '@/lib/importUtils';
import type { ImportType } from '@/lib/importUtils';

interface Props {
  type: ImportType;
  membres?: Membre[];
  offres?: Offre[];
  onClose: () => void;
  onImported: () => void;
}

const LABELS: Record<ImportType, string> = {
  membres:   'membres',
  terrains:  'souscriptions terrains',
  logements: 'dossiers logements',
};

function findMembre(membres: Membre[], prenom: string, nom: string): Membre | undefined {
  const p = prenom.toLowerCase();
  const n = nom.toLowerCase();
  return membres.find(m => m.prenom.toLowerCase() === p && m.nom.toLowerCase() === n);
}

export default function ImportModal({ type, membres = [], offres = [], onClose, onImported }: Props) {
  const [text,      setText]      = useState('');
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => text.trim() ? parseImport(text, type) : [], [text, type]);

  const rows = useMemo(() => {
    if (type === 'membres') return parsed;
    return parsed.map(row => {
      if (row.errors.length > 0) return row;
      const found = findMembre(membres, row.prenom, row.nom);
      if (!found) return { ...row, errors: ['Membre introuvable dans la base'] };
      return row;
    });
  }, [parsed, type, membres]);

  const validRows = rows.filter(r => r.errors.length === 0);
  const template  = `${TEMPLATES[type].header}\n${TEMPLATES[type].example}`;
  const headers   = COL_HEADERS[type];

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setText((ev.target?.result as string) ?? '');
    reader.readAsText(file, 'UTF-8');
  }

  function downloadTemplate() {
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `modele_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    const errors: string[] = [];
    let success = 0;

    try {
      if (type === 'membres') {
        const firstId = await fetchNextMembreId();
        let num = parseInt(firstId.replace('SN', ''), 10);
        for (const row of validRows) {
          try {
            await insertMembre({
              id_membre:  `SN${String(num).padStart(3, '0')}`,
              nom:        row.nom,
              prenom:     row.prenom,
              telephone:  row.extra[0] || undefined,
              email:      row.extra[1] || undefined,
              statut:     'actif',
              photo_url:  undefined,
            });
            num++;
            success++;
          } catch (e) {
            errors.push(`${row.prenom} ${row.nom} : ${e instanceof Error ? e.message : 'Erreur'}`);
          }
        }

      } else if (type === 'terrains') {
        const offre    = offres.find(o => o.type === 'terrain_simple' && o.statut === 'active');
        const prixUnit = offre?.prix_unitaire ?? PRIX_TERRAIN;
        for (const row of validRows) {
          const membre = findMembre(membres, row.prenom, row.nom)!;
          const nb     = parseInt(row.extra[0], 10);
          try {
            await insertSouscriptionTerrain({
              membre_id:         membre.id,
              nb_terrains:       nb,
              montant_total:     nb * prixUnit,
              sgbs:              false,
              date_souscription: row.extra[1],
              offre_id:          offre?.id,
            });
            success++;
          } catch (e) {
            errors.push(`${row.prenom} ${row.nom} : ${e instanceof Error ? e.message : 'Erreur'}`);
          }
        }

      } else {
        for (const row of validRows) {
          const membre    = findMembre(membres, row.prenom, row.nom)!;
          const rawType   = row.extra[0].toUpperCase();
          const type_villa: 'F2' | 'F3' | 'terrain' =
            rawType === 'F3' ? 'F3' : (rawType === 'TF' || rawType === 'TERRAIN') ? 'terrain' : 'F2';
          const offre = type_villa === 'terrain'
            ? offres.find(o => o.type === 'terrain_tf'  && o.statut === 'active')
            : offres.find(o => o.type === 'logement' && o.sous_type === type_villa && o.statut === 'active');
          const prix  = offre?.prix_unitaire ?? (type_villa === 'F3' ? PRIX_F3 : PRIX_F2);
          const taux  = offre?.taux_acompte  ?? TAUX_ACOMPTE;
          const mens  = offre?.nb_mensualites ?? NB_MENSUALITES;
          try {
            await insertSouscriptionLogement({
              membre_id:         membre.id,
              type_villa,
              site:              'ndoyenne',
              titre:             'TF',
              prix_total:        prix,
              acompte_requis:    Math.round(prix * taux),
              mensualite:        Math.round(prix / mens),
              date_souscription: row.extra[1],
              offre_id:          offre?.id,
            });
            success++;
          } catch (e) {
            errors.push(`${row.prenom} ${row.nom} : ${e instanceof Error ? e.message : 'Erreur'}`);
          }
        }
      }
    } finally {
      setImporting(false);
    }

    setResult({ success, errors });
    if (success > 0) onImported();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[95dvh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-black text-gray-900 capitalize">Import {LABELS[type]}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Format CSV, TXT ou texte séparé par virgules / points-virgules</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Résultat */}
          {result && (
            <div className={`rounded-xl p-4 border ${result.errors.length === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
              <p className="font-semibold text-sm text-gray-900">
                {result.success} enregistrement{result.success > 1 ? 's' : ''} importé{result.success > 1 ? 's' : ''} avec succès
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.errors.map((e, i) => <li key={i} className="text-xs text-red-600">• {e}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Format */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Format attendu</p>
              <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                <Download className="w-3 h-3" /> Télécharger le modèle
              </button>
            </div>
            <pre className="bg-emerald-50/60 rounded-xl p-3 text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed border border-emerald-100">
              {template}
            </pre>
            {type === 'terrains' && (
              <p className="text-xs text-gray-400 mt-1.5">Le prix est calculé automatiquement depuis l'offre active.</p>
            )}
            {type === 'logements' && (
              <p className="text-xs text-gray-400 mt-1.5">type_villa : F2, F3 ou TF. Le prix est calculé depuis l'offre active.</p>
            )}
          </div>

          {/* Saisie */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Données à importer</p>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                <Upload className="w-3 h-3" /> Charger un fichier .csv / .txt
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            </div>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setResult(null); }}
              placeholder={`Collez ici vos données ou chargez un fichier…\n\nExemple :\n${template}`}
              className="w-full h-36 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-400 placeholder:text-gray-300 font-mono resize-none"
            />
          </div>

          {/* Aperçu */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Aperçu — {rows.length} ligne{rows.length > 1 ? 's' : ''} · {' '}
                <span className="text-emerald-600">{validRows.length} valide{validRows.length > 1 ? 's' : ''}</span>
                {rows.length - validRows.length > 0 && (
                  <span className="text-red-500"> · {rows.length - validRows.length} en erreur</span>
                )}
              </p>
              <div className="border border-emerald-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-emerald-50">
                      <tr>
                        {headers.map(h => (
                          <th key={h} className="text-left font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">{h}</th>
                        ))}
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50/60">
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className={row.errors.length > 0 ? 'bg-red-50/40' : ''}>
                          <td className="px-3 py-2 text-gray-900">{row.prenom || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-gray-900">{row.nom || <span className="text-red-400">—</span>}</td>
                          <td className="px-3 py-2 text-gray-500">{row.extra[0] || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{row.extra[1] || '—'}</td>
                          <td className="px-3 py-2">
                            {row.errors.length === 0
                              ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                              : (
                                <span title={row.errors.join(' · ')}>
                                  <XCircle className="w-4 h-4 text-red-400 cursor-help" />
                                </span>
                              )
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2 border-t border-emerald-50">
                    … et {rows.length - 10} ligne{rows.length - 10 > 1 ? 's' : ''} de plus
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-emerald-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            {result ? 'Fermer' : 'Annuler'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {importing
                ? 'Import en cours…'
                : `Importer ${validRows.length} ligne${validRows.length > 1 ? 's' : ''}`
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
