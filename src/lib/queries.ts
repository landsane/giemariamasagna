import { supabase } from '@/integrations/supabase/client';
import type {
  Membre,
  SouscriptionTerrain,
  PaiementTerrain,
  SouscriptionLogement,
  PaiementLogement,
} from '@/types';

// ─── Membres ─────────────────────────────────────────────────────────────────
export async function fetchMembres(): Promise<Membre[]> {
  const [{ data: membresDB }, { data: stDB }, { data: slDB }] = await Promise.all([
    supabase.from('membres').select('*').order('id_membre'),
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

export async function fetchNextMembreId(): Promise<string> {
  const { data } = await supabase
    .from('membres')
    .select('id_membre')
    .order('id_membre', { ascending: false })
    .limit(1)
    .single();
  if (!data) return 'SN001';
  const num = parseInt(data.id_membre.replace('SN', ''), 10);
  return `SN${String(num + 1).padStart(3, '0')}`;
}

export async function insertMembre(
  data: Pick<Membre, 'id_membre' | 'nom' | 'prenom' | 'telephone' | 'email' | 'statut'>
) {
  const { data: row, error } = await supabase
    .from('membres')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
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

export async function insertPaiementTerrain(
  data: Pick<
    PaiementTerrain,
    'souscription_id' | 'membre_id' | 'numero_versement' | 'date_versement' |
    'montant' | 'encaisseur_nom' | 'encaisseur_prenom' | 'mode_paiement' | 'reference'
  >
) {
  // 1. Insérer le paiement
  const { data: paiement, error: errPaiement } = await supabase
    .from('paiements_terrains')
    .insert(data)
    .select()
    .single();
  if (errPaiement) throw errPaiement;

  // 2. Mettre à jour montant_verse sur la souscription
  const { data: souscription } = await supabase
    .from('souscriptions_terrains')
    .select('montant_verse, montant_total')
    .eq('id', data.souscription_id)
    .single();

  if (souscription) {
    const nouveauVerse = souscription.montant_verse + data.montant;
    const solde = nouveauVerse >= souscription.montant_total;
    await supabase
      .from('souscriptions_terrains')
      .update({
        montant_verse: nouveauVerse,
        statut: solde ? 'solde' : 'en_cours',
      })
      .eq('id', data.souscription_id);
  }

  return paiement;
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
  >
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

export async function insertPaiementLogement(
  data: Pick<
    PaiementLogement,
    'souscription_id' | 'membre_id' | 'type_paiement' |
    'date_versement' | 'montant' | 'mode_paiement' | 'reference'
  >
) {
  const { data: paiement, error: errPaiement } = await supabase
    .from('paiements_logements')
    .insert(data)
    .select()
    .single();
  if (errPaiement) throw errPaiement;

  // Mettre à jour acompte_verse ou nb_mensualites_payees
  const { data: souscription } = await supabase
    .from('souscriptions_logements')
    .select('acompte_verse, acompte_requis, nb_mensualites_payees')
    .eq('id', data.souscription_id)
    .single();

  if (souscription) {
    if (data.type_paiement === 'acompte') {
      const nouvelAcompte = souscription.acompte_verse + data.montant;
      const valide = nouvelAcompte >= souscription.acompte_requis;
      await supabase
        .from('souscriptions_logements')
        .update({
          acompte_verse: nouvelAcompte,
          statut: valide ? 'valide' : 'en_cours',
        })
        .eq('id', data.souscription_id);
    } else {
      await supabase
        .from('souscriptions_logements')
        .update({ nb_mensualites_payees: souscription.nb_mensualites_payees + 1 })
        .eq('id', data.souscription_id);
    }
  }

  return paiement;
}
