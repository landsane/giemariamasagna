import { supabase } from '@/integrations/supabase/client';
import type {
  Membre,
  Offre,
  SouscriptionTerrain,
  PaiementTerrain,
  SouscriptionLogement,
  PaiementLogement,
  Parcelle,
} from '@/types';

// ─── Offres ──────────────────────────────────────────────────────────────────
export async function fetchOffres(): Promise<Offre[]> {
  const { data, error } = await supabase
    .from('offres')
    .select('*')
    .order('type')
    .order('nom');
  if (error) throw error;
  return data ?? [];
}

export async function insertOffre(
  data: Omit<Offre, 'id' | 'created_at'>
) {
  const { data: row, error } = await supabase
    .from('offres')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row as Offre;
}

export async function updateOffreStatut(id: string, statut: Offre['statut']) {
  const { error } = await supabase
    .from('offres')
    .update({ statut })
    .eq('id', id);
  if (error) throw error;
}

export async function updateOffre(id: string, data: Partial<Omit<Offre, 'id' | 'created_at'>>) {
  const { data: row, error } = await supabase
    .from('offres')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return row as Offre;
}

// ─── Membres ─────────────────────────────────────────────────────────────────
export async function fetchMembres(): Promise<Membre[]> {
  const [{ data: membresDB }, { data: stDB }, { data: slDB }] = await Promise.all([
    // id_membre est désormais un code aléatoire (plus un compteur séquentiel) :
    // on trie par date d'inscription pour garder un ordre de liste sensé.
    supabase.from('membres').select('*').order('created_at'),
    supabase.from('souscriptions_terrains').select('membre_id'),
    supabase.from('souscriptions_logements').select('membre_id'),
  ]);

  const setTerrains  = new Set((stDB ?? []).map((r: { membre_id: string }) => r.membre_id));
  const setLogements = new Set((slDB ?? []).map((r: { membre_id: string }) => r.membre_id));

  return (membresDB ?? []).map((m: Omit<Membre, 'modules'>) => ({
    ...m,
    modules: [
      ...(setTerrains.has(m.id)  ? ['terrains'  as const] : []),
      ...(setLogements.has(m.id) ? ['logements' as const] : []),
    ],
  }));
}

export async function insertMembre(
  data: Pick<Membre, 'nom' | 'prenom' | 'telephone' | 'email' | 'ville' | 'pays' | 'statut' | 'photo_url'>
) {
  // id_membre n'est jamais transmis : il est généré en base par un trigger
  // (séquence membres_id_membre_seq), ce qui évite les collisions entre
  // écritures concurrentes et n'a plus de raison d'être calculé côté client.
  const { data: row, error } = await supabase
    .from('membres')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row as Membre;
}

export async function updateMembre(
  id: string,
  data: Partial<Pick<Membre, 'nom' | 'prenom' | 'telephone' | 'email' | 'ville' | 'pays' | 'statut' | 'photo_url'>>
) {
  const { data: row, error } = await supabase
    .from('membres')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function uploadMembrePhoto(membreId: string, file: File): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `${membreId}.${ext}`;
  const { error } = await supabase.storage
    .from('membres-photos')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('membres-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ─── Souscriptions Terrains ───────────────────────────────────────────────────
export async function fetchSouscriptionsTerrain(): Promise<SouscriptionTerrain[]> {
  const { data, error } = await supabase
    .from('souscriptions_terrains')
    .select('*')
    .order('date_souscription');
  if (error) throw error;
  return data ?? [];
}

export async function fetchSouscriptionsTerrainByMembre(membreId: string): Promise<SouscriptionTerrain[]> {
  const { data, error } = await supabase
    .from('souscriptions_terrains')
    .select('*')
    .eq('membre_id', membreId);
  if (error) throw error;
  return data ?? [];
}

export async function insertSouscriptionTerrain(
  data: Pick<SouscriptionTerrain, 'membre_id' | 'nb_terrains' | 'montant_total' | 'sgbs' | 'date_souscription'>
    & { offre_id?: string }
) {
  const { data: row, error } = await supabase
    .from('souscriptions_terrains')
    .insert({ ...data, montant_verse: 0, statut: 'en_cours' })
    .select()
    .single();
  if (error) throw error;
  return row;
}

// ─── Paiements Terrains ───────────────────────────────────────────────────────
export async function fetchPaiementsTerrain(): Promise<PaiementTerrain[]> {
  const { data, error } = await supabase
    .from('paiements_terrains')
    .select('*')
    .order('date_versement', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPaiementsTerrainBySouscription(souscriptionId: string): Promise<PaiementTerrain[]> {
  const { data, error } = await supabase
    .from('paiements_terrains')
    .select('*')
    .eq('souscription_id', souscriptionId)
    .order('numero_versement');
  if (error) throw error;
  return data ?? [];
}

// Recalcule montant_verse / statut d'une souscription terrain à partir de la
// somme réelle de ses versements — plutôt que d'incrémenter un compteur, ce qui
// évite tout risque de désynchronisation après une correction (édition/suppression).
async function recalculerSouscriptionTerrain(souscriptionId: string) {
  const [{ data: paiements }, { data: souscription }] = await Promise.all([
    supabase.from('paiements_terrains').select('montant').eq('souscription_id', souscriptionId),
    supabase.from('souscriptions_terrains').select('montant_total').eq('id', souscriptionId).single(),
  ]);
  if (!souscription) return;

  const montantVerse = (paiements ?? []).reduce((a, p) => a + p.montant, 0);
  const solde = montantVerse >= souscription.montant_total;
  await supabase
    .from('souscriptions_terrains')
    .update({ montant_verse: montantVerse, statut: solde ? 'solde' : 'en_cours' })
    .eq('id', souscriptionId);
}

export async function insertPaiementTerrain(
  data: Pick<
    PaiementTerrain,
    'souscription_id' | 'membre_id' | 'numero_versement' | 'date_versement' |
    'montant' | 'encaisseur_nom' | 'encaisseur_prenom' | 'mode_paiement' | 'reference'
  >
) {
  const { data: paiement, error } = await supabase
    .from('paiements_terrains')
    .insert(data)
    .select()
    .single();
  if (error) throw error;

  await recalculerSouscriptionTerrain(data.souscription_id);
  return paiement;
}

export async function updatePaiementTerrain(
  id: string,
  souscriptionId: string,
  data: Partial<Pick<
    PaiementTerrain,
    'date_versement' | 'montant' | 'encaisseur_nom' | 'encaisseur_prenom' | 'mode_paiement' | 'reference'
  >>
) {
  const { error } = await supabase.from('paiements_terrains').update(data).eq('id', id);
  if (error) throw error;
  await recalculerSouscriptionTerrain(souscriptionId);
}

export async function deletePaiementTerrain(id: string, souscriptionId: string) {
  const { error } = await supabase.from('paiements_terrains').delete().eq('id', id);
  if (error) throw error;
  await recalculerSouscriptionTerrain(souscriptionId);
}

// ─── Souscriptions Logements ──────────────────────────────────────────────────
export async function fetchSouscriptionsLogement(): Promise<SouscriptionLogement[]> {
  const { data, error } = await supabase
    .from('souscriptions_logements')
    .select('*')
    .order('date_souscription');
  if (error) throw error;
  return data ?? [];
}

export async function insertSouscriptionLogement(
  data: Pick<
    SouscriptionLogement,
    'membre_id' | 'type_villa' | 'site' | 'titre' |
    'prix_total' | 'acompte_requis' | 'mensualite' | 'date_souscription'
  > & { offre_id?: string; nb_terrains?: number }
) {
  const { data: row, error } = await supabase
    .from('souscriptions_logements')
    .insert({ ...data, acompte_verse: 0, nb_mensualites_payees: 0, statut: 'en_cours' })
    .select()
    .single();
  if (error) throw error;
  return row;
}

// ─── Paiements Logements ──────────────────────────────────────────────────────
export async function fetchPaiementsLogement(): Promise<PaiementLogement[]> {
  const { data, error } = await supabase
    .from('paiements_logements')
    .select('*')
    .order('date_versement', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPaiementsLogementBySouscription(souscriptionId: string): Promise<PaiementLogement[]> {
  const { data, error } = await supabase
    .from('paiements_logements')
    .select('*')
    .eq('souscription_id', souscriptionId)
    .order('date_versement');
  if (error) throw error;
  return data ?? [];
}

// Recalcule acompte_verse / nb_mensualites_payees / statut d'une souscription
// logement à partir des versements réellement enregistrés (voir commentaire de
// recalculerSouscriptionTerrain). Un dossier déjà attribué/livré n'est jamais
// rétrogradé par une simple correction de versement.
async function recalculerSouscriptionLogement(souscriptionId: string) {
  const [{ data: paiements }, { data: souscription }] = await Promise.all([
    supabase.from('paiements_logements').select('type_paiement, montant').eq('souscription_id', souscriptionId),
    supabase.from('souscriptions_logements').select('acompte_requis, statut').eq('id', souscriptionId).single(),
  ]);
  if (!souscription) return;

  const acompteVerse         = (paiements ?? []).filter(p => p.type_paiement === 'acompte').reduce((a, p) => a + p.montant, 0);
  const nbMensualitesPayees  = (paiements ?? []).filter(p => p.type_paiement === 'mensualite').length;
  const dejaAvance           = souscription.statut === 'attribue' || souscription.statut === 'livre';
  const statut               = dejaAvance ? souscription.statut : (acompteVerse >= souscription.acompte_requis ? 'valide' : 'en_cours');

  await supabase
    .from('souscriptions_logements')
    .update({ acompte_verse: acompteVerse, nb_mensualites_payees: nbMensualitesPayees, statut })
    .eq('id', souscriptionId);
}

export async function insertPaiementLogement(
  data: Pick<
    PaiementLogement,
    'souscription_id' | 'membre_id' | 'type_paiement' |
    'date_versement' | 'montant' | 'mode_paiement' | 'reference'
  >
) {
  const { data: paiement, error } = await supabase
    .from('paiements_logements')
    .insert(data)
    .select()
    .single();
  if (error) throw error;

  await recalculerSouscriptionLogement(data.souscription_id);
  return paiement;
}

export async function updatePaiementLogement(
  id: string,
  souscriptionId: string,
  data: Partial<Pick<
    PaiementLogement,
    'type_paiement' | 'date_versement' | 'montant' | 'mode_paiement' | 'reference'
  >>
) {
  const { error } = await supabase.from('paiements_logements').update(data).eq('id', id);
  if (error) throw error;
  await recalculerSouscriptionLogement(souscriptionId);
}

export async function deletePaiementLogement(id: string, souscriptionId: string) {
  const { error } = await supabase.from('paiements_logements').delete().eq('id', id);
  if (error) throw error;
  await recalculerSouscriptionLogement(souscriptionId);
}

// ─── Parcelles ─────────────────────────────────────────────────────────────────
// Une ligne par terrain physique (générée en base à la création du dossier,
// via trigger — voir migration). numero_parcelle est vide tant que la
// parcelle n'est pas attribuée à son propriétaire.
export async function fetchParcellesTerrain(souscriptionId: string): Promise<Parcelle[]> {
  const { data, error } = await supabase
    .from('parcelles')
    .select('*')
    .eq('souscription_terrain_id', souscriptionId)
    .order('numero');
  if (error) throw error;
  return data ?? [];
}

export async function fetchParcellesLogement(souscriptionId: string): Promise<Parcelle[]> {
  const { data, error } = await supabase
    .from('parcelles')
    .select('*')
    .eq('souscription_logement_id', souscriptionId)
    .order('numero');
  if (error) throw error;
  return data ?? [];
}

export async function updateNumeroParcelle(id: string, numeroParcelle: string) {
  const { error } = await supabase
    .from('parcelles')
    .update({ numero_parcelle: numeroParcelle || null })
    .eq('id', id);
  if (error) throw error;
}
