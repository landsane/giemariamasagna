// ─── Membres ────────────────────────────────────────────────────────────────
export interface Membre {
  id: string;
  id_membre: string; // SN001, SN002, …
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  statut: 'actif' | 'inactif';
  modules: ('terrains' | 'logements')[]; // modules souscrits
  created_at: string;
}

// ─── Module 1 – Terrains Simples ─────────────────────────────────────────────
export type ModePayment = 'wave' | 'orange_money' | 'banque' | 'autres';

export interface SouscriptionTerrain {
  id: string;
  membre_id: string;
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
  type_villa: TypeBien;
  site: SiteLogement;
  titre: TitreLogement;
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
