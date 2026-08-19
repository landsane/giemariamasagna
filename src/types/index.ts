// ─── Membres ────────────────────────────────────────────────────────────────
export interface Membre {
  id: string;
  id_membre: string; // code à 4 caractères (ex : A3F9), généré côté base, affiché sur la fiche du membre
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  ville?: string;
  pays?: string;
  photo_url?: string;
  statut: 'actif' | 'inactif';
  modules: ('terrains' | 'logements')[]; // modules souscrits
  created_at: string;
}

// ─── Module 1 – Terrains Simples ─────────────────────────────────────────────
export type ModePayment = 'wave' | 'orange_money' | 'banque' | 'autres';

export interface SouscriptionTerrain {
  id: string;
  membre_id: string;
  offre_id?: string;
  nb_terrains: number;
  montant_total: number; // nb_terrains × 460 000
  montant_verse: number;
  reste_a_verser: number;
  pourcentage: number;
  sgbs: boolean; // paiement via compte SGBS
  statut: 'en_cours' | 'solde';
  date_souscription: string;
}

export interface PaiementTerrain {
  id: string;
  souscription_id: string;
  membre_id: string;
  numero_versement: number; // 1 = juillet 2024, 2 = août 2024, …
  date_versement: string;
  montant: number;
  encaisseur_nom: string;
  encaisseur_prenom: string;
  mode_paiement: ModePayment;
  reference?: string;
}

// ─── Module 2 – Logements / Titre Foncier / Terrains TF ──────────────────────
export type TypeBien = 'F2' | 'F3' | 'terrain';
export type SiteLogement = 'ndoyenne' | 'keur_moussa';
export type TitreLogement = 'TF' | 'bail';
export type TypePaiementLogement = 'acompte' | 'mensualite';

export interface SouscriptionLogement {
  id: string;
  membre_id: string;
  offre_id?: string;
  type_villa: TypeBien;
  site: SiteLogement;
  titre: TitreLogement;
  nb_terrains: number; // nombre de parcelles groupées dans ce dossier (Terrain TF) ; 1 pour une villa F2/F3
  prix_total: number; // F2 = 16 000 000, F3 = 20 000 000
  acompte_requis: number; // 8 % du prix
  acompte_verse: number;
  mensualite: number; // prix_total / 120
  nb_mensualites_payees: number;
  statut: 'en_cours' | 'valide' | 'attribue' | 'livre';
  date_souscription: string;
}

export interface PaiementLogement {
  id: string;
  souscription_id: string;
  membre_id: string;
  type_paiement: TypePaiementLogement;
  date_versement: string;
  montant: number;
  mode_paiement: ModePayment;
  reference?: string;
}

// ─── Parcelles ────────────────────────────────────────────────────────────────
// Une ligne par terrain physique d'un dossier (terrain simple ou terrain TF),
// pour préparer la future attribution nominative aux membres.
export interface Parcelle {
  id: string;
  souscription_terrain_id?: string;
  souscription_logement_id?: string;
  numero: number; // position dans le dossier : 1, 2, 3…
  numero_parcelle?: string; // numéro réel de la parcelle, vide tant qu'elle n'est pas attribuée
  created_at: string;
}

// ─── Offres ───────────────────────────────────────────────────────────────────
export type TypeOffre = 'terrain_simple' | 'terrain_tf' | 'logement';

export interface Offre {
  id: string;
  type: TypeOffre;
  sous_type?: 'F2' | 'F3' | null;
  nom: string;
  description?: string;
  localisation: string;
  surface_m2?: number;
  prix_unitaire: number;
  frais_dossier: number;
  taux_acompte: number;   // 0.08 = 8%
  nb_mensualites: number;
  statut: 'active' | 'inactive' | 'complet';
  created_at: string;
}

export const LABELS_TYPE_OFFRE: Record<TypeOffre, string> = {
  terrain_simple: 'Terrain Simple',
  terrain_tf:     'Terrain TF',
  logement:       'Logement Social',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const PRIX_TERRAIN = 460_000;
export const PRIX_F2 = 16_000_000;
export const PRIX_F3 = 20_000_000;
export const TAUX_ACOMPTE = 0.08;
export const NB_MENSUALITES = 120;

export const LABELS_TYPE_BIEN: Record<TypeBien, string> = {
  F2:      'Villa F2',
  F3:      'Villa F3',
  terrain: 'Terrain TF',
};

export const LABELS_VERSEMENT: Record<number, string> = {
  1: 'Juillet 2024',
  2: 'Août 2024',
  3: 'Septembre 2024',
  4: 'Octobre 2024',
  5: 'Novembre 2024',
  6: 'Décembre 2024',
  7: 'Janvier 2025',
};

export const LABELS_MODE: Record<ModePayment, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  banque: 'SGBS Banque',
  autres: 'Autres',
};

export const LABELS_SITE: Record<SiteLogement, string> = {
  ndoyenne: 'Ndoyenne 01 – Sébikhotane',
  keur_moussa: 'Keur Moussa – Diender',
};
