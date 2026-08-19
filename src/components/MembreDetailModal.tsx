import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, MapPin, Map, Building2 } from 'lucide-react';
import type {
  Membre, Offre, SouscriptionTerrain, SouscriptionLogement,
  PaiementTerrain, PaiementLogement, TypePaiementLogement,
} from '@/types';
import { LABELS_MODE, LABELS_SITE } from '@/types';
import {
  fetchPaiementsTerrainBySouscription, fetchPaiementsLogementBySouscription,
  deletePaiementTerrain, deletePaiementLogement,
} from '@/lib/queries';
import { formatCurrency, formatDate, titreAvecSurface, infosMembre } from '@/lib/utils';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import Spinner from './Spinner';
import VersementTerrainModal from './VersementTerrainModal';
import VersementLogementModal from './VersementLogementModal';

interface Props {
  membre: Membre;
  souscTerrains: SouscriptionTerrain[];
  souscLogements: SouscriptionLogement[];
  offres: Offre[];
  onClose: () => void;
  onChanged: () => void;
}

type VersementCtx =
  | { kind: 'terrain'; souscription: SouscriptionTerrain; edit?: PaiementTerrain }
  | { kind: 'logement'; souscription: SouscriptionLogement; edit?: PaiementLogement };

// ─── Ligne versement (édition / suppression) ───────────────────────────────────
function LigneVersement({
  label, date, montant, sousLabel, onEdit, onDelete,
}: {
  label: string;
  date: string;
  montant: number;
  sousLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-800">{label} · {formatCurrency(montant)}</p>
        <p className="text-[11px] text-gray-400">{formatDate(date)} · {sousLabel}</p>
      </div>
      {confirming ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => { onDelete(); setConfirming(false); }}
            className="text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors">
            Confirmer
          </button>
          <button onClick={() => setConfirming(false)}
            className="text-[11px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors">
            Annuler
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} title="Modifier"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setConfirming(true)} title="Supprimer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section terrain simple ─────────────────────────────────────────────────────
function SectionTerrain({
  souscription, offre, paiements, loading, onVerser, onEdit, onDelete,
}: {
  souscription: SouscriptionTerrain;
  offre?: Offre;
  paiements: PaiementTerrain[];
  loading: boolean;
  onVerser: () => void;
  onEdit: (p: PaiementTerrain) => void;
  onDelete: (p: PaiementTerrain) => void;
}) {
  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-900">
              {offre ? titreAvecSurface(offre.nom, offre.surface_m2) : `Terrain simple · ${souscription.nb_terrains} parcelle${souscription.nb_terrains > 1 ? 's' : ''}`}
            </p>
            {offre && (
              <p className="text-[11px] text-blue-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{offre.localisation}
              </p>
            )}
          </div>
        </div>
        <Badge variant={souscription.statut === 'solde' ? 'green' : 'amber'}>
          {souscription.statut === 'solde' ? 'SOLDÉ' : 'En cours'}
        </Badge>
      </div>

      <ProgressBar value={souscription.pourcentage} />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Versé</p>
          <p className="font-bold text-emerald-700">{formatCurrency(souscription.montant_verse)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Reste</p>
          <p className="font-bold text-orange-600">{formatCurrency(souscription.reste_a_verser)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Total</p>
          <p className="font-bold text-gray-700">{formatCurrency(souscription.montant_total)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-blue-100">
        <div className="flex items-center justify-between px-3 py-2 border-b border-blue-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Versements</p>
          <button onClick={onVerser}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            <Plus className="w-3.5 h-3.5" /> Nouveau
          </button>
        </div>
        {loading ? <Spinner className="py-6" /> : paiements.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">Aucun versement enregistré</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {paiements.map(p => (
              <LigneVersement key={p.id}
                label={`Versement n°${p.numero_versement}`}
                date={p.date_versement}
                montant={p.montant}
                sousLabel={`${LABELS_MODE[p.mode_paiement]} · ${p.encaisseur_prenom} ${p.encaisseur_nom}`}
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section logement / terrain TF ───────────────────────────────────────────────
function SectionLogement({
  souscription, offre, paiements, loading, onVerser, onEdit, onDelete,
}: {
  souscription: SouscriptionLogement;
  offre?: Offre;
  paiements: PaiementLogement[];
  loading: boolean;
  onVerser: () => void;
  onEdit: (p: PaiementLogement) => void;
  onDelete: (p: PaiementLogement) => void;
}) {
  const isTerrainTF = souscription.type_villa === 'terrain';
  const totalVerse  = souscription.acompte_verse + souscription.nb_mensualites_payees * souscription.mensualite;
  const totalPct    = souscription.prix_total > 0 ? Math.round((totalVerse / souscription.prix_total) * 100) : 0;
  const prixUnitaire = offre?.prix_unitaire ?? Math.round(souscription.prix_total / (souscription.nb_terrains || 1));

  const colors = isTerrainTF
    ? { bg: 'bg-green-50/60 border-green-100', text: 'text-green-900', icon: 'text-green-600', sub: 'text-green-600' }
    : souscription.type_villa === 'F3'
      ? { bg: 'bg-purple-50/60 border-purple-100', text: 'text-purple-900', icon: 'text-purple-600', sub: 'text-purple-600' }
      : { bg: 'bg-indigo-50/60 border-indigo-100', text: 'text-indigo-900', icon: 'text-indigo-600', sub: 'text-indigo-600' };

  const titre = offre ? titreAvecSurface(offre.nom, offre.surface_m2) : (
    isTerrainTF
      ? `Terrain TF · ${LABELS_SITE[souscription.site].split('–')[0].trim()}`
      : `Villa ${souscription.type_villa} · ${LABELS_SITE[souscription.site].split('–')[0].trim()} · ${souscription.titre}`
  );

  const sv = souscription.statut === 'livre' ? 'green' : souscription.statut === 'attribue' ? 'blue' : souscription.statut === 'valide' ? 'purple' : 'amber';
  const sl = souscription.statut === 'livre' ? 'Livré' : souscription.statut === 'attribue' ? 'Attribué' : souscription.statut === 'valide' ? 'Validé' : 'En cours';

  return (
    <div className={`border rounded-2xl p-4 space-y-3 ${colors.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className={`w-4 h-4 flex-shrink-0 ${colors.icon}`} />
          <div>
            <p className={`text-sm font-bold ${colors.text}`}>{titre}</p>
            {offre && (
              <p className={`text-[11px] flex items-center gap-1 ${colors.sub}`}>
                <MapPin className="w-3 h-3" />{offre.localisation}
              </p>
            )}
            {isTerrainTF && (
              <p className={`text-[11px] ${colors.sub}`}>
                {souscription.nb_terrains} parcelle{souscription.nb_terrains > 1 ? 's' : ''} × {formatCurrency(prixUnitaire)}
              </p>
            )}
          </div>
        </div>
        <Badge variant={sv}>{sl}</Badge>
      </div>

      <ProgressBar value={totalPct} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Acompte</p>
          <p className="font-bold text-amber-700">{formatCurrency(souscription.acompte_verse)} / {formatCurrency(souscription.acompte_requis)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Mensualités</p>
          <p className="font-bold text-gray-700">{souscription.nb_mensualites_payees} payées</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Total versé</p>
          <p className="font-bold text-emerald-700">{formatCurrency(totalVerse)}</p>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <p className="text-gray-400">Prix total</p>
          <p className="font-bold text-gray-700">{formatCurrency(souscription.prix_total)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Versements</p>
          <button onClick={onVerser}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            <Plus className="w-3.5 h-3.5" /> Nouveau
          </button>
        </div>
        {loading ? <Spinner className="py-6" /> : paiements.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">Aucun versement enregistré</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {paiements.map(p => (
              <LigneVersement key={p.id}
                label={p.type_paiement === 'acompte' ? 'Acompte' : 'Mensualité'}
                date={p.date_versement}
                montant={p.montant}
                sousLabel={`${LABELS_MODE[p.mode_paiement]}${p.reference ? ` · ${p.reference}` : ''}`}
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal principal ────────────────────────────────────────────────────────────
export default function MembreDetailModal({ membre, souscTerrains, souscLogements, offres, onClose, onChanged }: Props) {
  const terrains  = souscTerrains.filter(s => s.membre_id === membre.id);
  const logements = souscLogements.filter(s => s.membre_id === membre.id);

  const [paiementsTerrains, setPaiementsTerrains]   = useState<Record<string, PaiementTerrain[]>>({});
  const [paiementsLogements, setPaiementsLogements] = useState<Record<string, PaiementLogement[]>>({});
  const [loading, setLoading] = useState(true);
  const [versementCtx, setVersementCtx] = useState<VersementCtx | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const t = souscTerrains.filter(s => s.membre_id === membre.id);
    const l = souscLogements.filter(s => s.membre_id === membre.id);
    const [pt, pl] = await Promise.all([
      Promise.all(t.map(s => fetchPaiementsTerrainBySouscription(s.id))),
      Promise.all(l.map(s => fetchPaiementsLogementBySouscription(s.id))),
    ]);
    setPaiementsTerrains(Object.fromEntries(t.map((s, i) => [s.id, pt[i]])));
    setPaiementsLogements(Object.fromEntries(l.map((s, i) => [s.id, pl[i]])));
    setLoading(false);
  }, [membre.id, souscTerrains, souscLogements]);

  useEffect(() => {
    // Report la 1ère mise à jour d'état après la passe synchrone de l'effect
    // (évite l'anti-pattern "setState synchrone dans un effect").
    Promise.resolve().then(load);
  }, [load]);

  async function handleDeleteTerrain(p: PaiementTerrain) {
    await deletePaiementTerrain(p.id, p.souscription_id);
    onChanged();
  }
  async function handleDeleteLogement(p: PaiementLogement) {
    await deletePaiementLogement(p.id, p.souscription_id);
    onChanged();
  }

  function handleVersementSaved() {
    setVersementCtx(null);
    onChanged();
  }

  const nbOffres = terrains.length + logements.length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl sm:my-4 max-h-[95dvh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>

        <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <p className="font-black text-gray-900 truncate">{membre.prenom} {membre.nom}</p>
            <span className="inline-block mt-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
              {membre.id_membre}
            </span>
            <p className="text-xs font-medium text-gray-500 mt-1">
              {infosMembre(membre) || 'Aucune information de contact'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none flex-shrink-0 ml-3">&times;</button>
        </div>

        <div className="p-6 space-y-4">
          {nbOffres === 0 ? (
            <p className="text-sm text-gray-300 text-center py-8 border border-dashed border-emerald-100 rounded-xl">
              Aucune offre souscrite pour ce membre
            </p>
          ) : (
            <>
              {terrains.map(s => (
                <SectionTerrain key={s.id}
                  souscription={s}
                  offre={offres.find(o => o.id === s.offre_id)}
                  paiements={paiementsTerrains[s.id] ?? []}
                  loading={loading}
                  onVerser={() => setVersementCtx({ kind: 'terrain', souscription: s })}
                  onEdit={p => setVersementCtx({ kind: 'terrain', souscription: s, edit: p })}
                  onDelete={handleDeleteTerrain}
                />
              ))}
              {logements.map(s => (
                <SectionLogement key={s.id}
                  souscription={s}
                  offre={offres.find(o => o.id === s.offre_id)}
                  paiements={paiementsLogements[s.id] ?? []}
                  loading={loading}
                  onVerser={() => setVersementCtx({ kind: 'logement', souscription: s })}
                  onEdit={p => setVersementCtx({ kind: 'logement', souscription: s, edit: p })}
                  onDelete={handleDeleteLogement}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {versementCtx?.kind === 'terrain' && (
        <VersementTerrainModal
          souscription={versementCtx.souscription}
          membre={membre}
          nextNumero={(paiementsTerrains[versementCtx.souscription.id]?.length ?? 0) + 1}
          initial={versementCtx.edit}
          onClose={() => setVersementCtx(null)}
          onSaved={handleVersementSaved}
        />
      )}
      {versementCtx?.kind === 'logement' && (
        <VersementLogementModal
          souscription={versementCtx.souscription}
          membre={membre}
          initialType={versementCtx.edit?.type_paiement ?? (
            versementCtx.souscription.acompte_verse < versementCtx.souscription.acompte_requis
              ? 'acompte' as TypePaiementLogement
              : 'mensualite' as TypePaiementLogement
          )}
          initial={versementCtx.edit}
          onClose={() => setVersementCtx(null)}
          onSaved={handleVersementSaved}
        />
      )}
    </div>
  );
}
