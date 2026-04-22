import type {
  Membre,
  SouscriptionTerrain,
  PaiementTerrain,
  SouscriptionLogement,
  PaiementLogement,
} from '@/types';
import { PRIX_TERRAIN, PRIX_F2, PRIX_F3, TAUX_ACOMPTE } from '@/types';

// ─── Membres (extrait de l'Excel – versements terrains 2024) ─────────────────
export const membres: Membre[] = [
  { id: 'm1',  id_membre: 'SN001', nom: 'DIALLO',   prenom: 'Ibrahima',    telephone: '77 100 0001', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-01' },
  { id: 'm2',  id_membre: 'SN002', nom: 'NDIAYE',   prenom: 'Aminata',     telephone: '77 200 0002', statut: 'actif',   modules: ['terrains', 'logements'], created_at: '2024-06-01' },
  { id: 'm3',  id_membre: 'SN003', nom: 'FALL',     prenom: 'Moussa',      telephone: '77 300 0003', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-01' },
  { id: 'm4',  id_membre: 'SN004', nom: 'SENE',     prenom: 'Fatou',       telephone: '76 400 0004', statut: 'actif',   modules: ['terrains', 'logements'], created_at: '2024-06-01' },
  { id: 'm5',  id_membre: 'SN005', nom: 'GUEYE',    prenom: 'Ousmane',     telephone: '78 500 0005', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-05' },
  { id: 'm6',  id_membre: 'SN006', nom: 'DIOP',     prenom: 'Mariama',     telephone: '77 600 0006', statut: 'actif',   modules: ['logements'], created_at: '2024-06-05' },
  { id: 'm7',  id_membre: 'SN007', nom: 'BA',       prenom: 'Rokhaya',     telephone: '70 700 0007', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-10' },
  { id: 'm8',  id_membre: 'SN008', nom: 'SARR',     prenom: 'Cheikh',      telephone: '77 800 0008', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-10' },
  { id: 'm9',  id_membre: 'SN009', nom: 'MBAYE',    prenom: 'Ndéye',       telephone: '76 900 0009', statut: 'actif',   modules: ['terrains', 'logements'], created_at: '2024-06-12' },
  { id: 'm10', id_membre: 'SN010', nom: 'CISSE',    prenom: 'Abdoulaye',   telephone: '77 100 0010', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-12' },
  { id: 'm11', id_membre: 'SN011', nom: 'DIOUF',    prenom: 'Aissatou',    telephone: '78 100 0011', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-15' },
  { id: 'm12', id_membre: 'SN012', nom: 'FAYE',     prenom: 'Lamine',      telephone: '77 120 0012', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-15' },
  { id: 'm13', id_membre: 'SN013', nom: 'CAMARA',   prenom: 'Binta',       telephone: '76 130 0013', statut: 'actif',   modules: ['logements'], created_at: '2024-06-18' },
  { id: 'm14', id_membre: 'SN014', nom: 'SY',       prenom: 'Mamadou',     telephone: '77 140 0014', statut: 'actif',   modules: ['terrains', 'logements'], created_at: '2024-06-18' },
  { id: 'm15', id_membre: 'SN015', nom: 'LO',       prenom: 'Adja',        telephone: '78 150 0015', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-20' },
  { id: 'm16', id_membre: 'SN016', nom: 'THIAM',    prenom: 'Seydou',      telephone: '77 160 0016', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-20' },
  { id: 'm17', id_membre: 'SN017', nom: 'WADE',     prenom: 'Khadija',     telephone: '70 170 0017', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-22' },
  { id: 'm18', id_membre: 'SN018', nom: 'COLY',     prenom: 'Yama',        telephone: '76 180 0018', statut: 'actif',   modules: ['terrains'], created_at: '2024-06-22' },
  { id: 'm19', id_membre: 'SN019', nom: 'TOURE',    prenom: 'Boubacar',    telephone: '77 190 0019', statut: 'actif',   modules: ['logements'], created_at: '2024-06-25' },
  { id: 'm20', id_membre: 'SN020', nom: 'NIANG',    prenom: 'Fatou',       telephone: '78 200 0020', statut: 'actif',   modules: ['terrains', 'logements'], created_at: '2024-06-25' },
  { id: 'm21', id_membre: 'SN021', nom: 'BADIANE',  prenom: 'Coumba',      telephone: '77 210 0021', statut: 'actif',   modules: ['terrains'], created_at: '2024-07-01' },
  { id: 'm22', id_membre: 'SN022', nom: 'DIAKHATE', prenom: 'Kiné',        telephone: '76 220 0022', statut: 'actif',   modules: ['terrains'], created_at: '2024-07-01' },
  { id: 'm23', id_membre: 'SN023', nom: 'NDOUR',    prenom: 'Pape',        telephone: '77 230 0023', statut: 'actif',   modules: ['terrains'], created_at: '2024-07-03' },
  { id: 'm24', id_membre: 'SN024', nom: 'DIONE',    prenom: 'Sophie',      telephone: '78 240 0024', statut: 'actif',   modules: ['terrains'], created_at: '2024-07-03' },
  { id: 'm25', id_membre: 'SN025', nom: 'MBODJ',    prenom: 'Astou',       telephone: '77 250 0025', statut: 'inactif', modules: ['terrains'], created_at: '2024-07-05' },
];

// ─── Souscriptions Terrains ──────────────────────────────────────────────────
export const souscriptionsTerrain: SouscriptionTerrain[] = [
  { id: 'st1',  membre_id: 'm1',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 460_000, reste_a_verser: 0,        pourcentage: 100, sgbs: false, statut: 'solde',    date_souscription: '2024-06-01' },
  { id: 'st2',  membre_id: 'm2',  nb_terrains: 2, montant_total: PRIX_TERRAIN * 2, montant_verse: 700_000, reste_a_verser: 220_000,  pourcentage: 76,  sgbs: true,  statut: 'en_cours', date_souscription: '2024-06-01' },
  { id: 'st3',  membre_id: 'm3',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 350_000, reste_a_verser: 110_000,  pourcentage: 76,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-01' },
  { id: 'st4',  membre_id: 'm4',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 460_000, reste_a_verser: 0,        pourcentage: 100, sgbs: true,  statut: 'solde',    date_souscription: '2024-06-01' },
  { id: 'st5',  membre_id: 'm5',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 192_500, reste_a_verser: 267_500,  pourcentage: 42,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-05' },
  { id: 'st6',  membre_id: 'm7',  nb_terrains: 2, montant_total: PRIX_TERRAIN * 2, montant_verse: 920_000, reste_a_verser: 0,        pourcentage: 100, sgbs: false, statut: 'solde',    date_souscription: '2024-06-10' },
  { id: 'st7',  membre_id: 'm8',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 115_500, reste_a_verser: 344_500,  pourcentage: 25,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-10' },
  { id: 'st8',  membre_id: 'm9',  nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 308_000, reste_a_verser: 152_000,  pourcentage: 67,  sgbs: true,  statut: 'en_cours', date_souscription: '2024-06-12' },
  { id: 'st9',  membre_id: 'm10', nb_terrains: 3, montant_total: PRIX_TERRAIN * 3, montant_verse: 1_380_000, reste_a_verser: 0,      pourcentage: 100, sgbs: false, statut: 'solde',    date_souscription: '2024-06-12' },
  { id: 'st10', membre_id: 'm11', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 231_000, reste_a_verser: 229_000,  pourcentage: 50,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-15' },
  { id: 'st11', membre_id: 'm12', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 77_000,  reste_a_verser: 383_000,  pourcentage: 17,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-15' },
  { id: 'st12', membre_id: 'm14', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 385_000, reste_a_verser: 75_000,   pourcentage: 84,  sgbs: true,  statut: 'en_cours', date_souscription: '2024-06-18' },
  { id: 'st13', membre_id: 'm15', nb_terrains: 2, montant_total: PRIX_TERRAIN * 2, montant_verse: 616_000, reste_a_verser: 304_000,  pourcentage: 67,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-20' },
  { id: 'st14', membre_id: 'm16', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 460_000, reste_a_verser: 0,        pourcentage: 100, sgbs: false, statut: 'solde',    date_souscription: '2024-06-20' },
  { id: 'st15', membre_id: 'm17', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 154_000, reste_a_verser: 306_000,  pourcentage: 33,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-22' },
  { id: 'st16', membre_id: 'm18', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 385_000, reste_a_verser: 75_000,   pourcentage: 84,  sgbs: false, statut: 'en_cours', date_souscription: '2024-06-22' },
  { id: 'st17', membre_id: 'm20', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 460_000, reste_a_verser: 0,        pourcentage: 100, sgbs: false, statut: 'solde',    date_souscription: '2024-06-25' },
  { id: 'st18', membre_id: 'm21', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 269_500, reste_a_verser: 190_500,  pourcentage: 59,  sgbs: false, statut: 'en_cours', date_souscription: '2024-07-01' },
  { id: 'st19', membre_id: 'm22', nb_terrains: 2, montant_total: PRIX_TERRAIN * 2, montant_verse: 770_000, reste_a_verser: 150_000,  pourcentage: 84,  sgbs: false, statut: 'en_cours', date_souscription: '2024-07-01' },
  { id: 'st20', membre_id: 'm23', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 192_500, reste_a_verser: 267_500,  pourcentage: 42,  sgbs: false, statut: 'en_cours', date_souscription: '2024-07-03' },
  { id: 'st21', membre_id: 'm24', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 38_500,  reste_a_verser: 421_500,  pourcentage: 8,   sgbs: false, statut: 'en_cours', date_souscription: '2024-07-03' },
  { id: 'st22', membre_id: 'm25', nb_terrains: 1, montant_total: PRIX_TERRAIN * 1, montant_verse: 77_000,  reste_a_verser: 383_000,  pourcentage: 17,  sgbs: false, statut: 'en_cours', date_souscription: '2024-07-05' },
];

// ─── Paiements Terrains ──────────────────────────────────────────────────────
export const paiementsTerrain: PaiementTerrain[] = [
  // SN001 – SOLDÉ (5 versements × 92 000)
  { id: 'pt1',  souscription_id: 'st1',  membre_id: 'm1',  numero_versement: 1, date_versement: '2024-07-05', montant: 92_000,  encaisseur_nom: 'FALL',     encaisseur_prenom: 'Aïda',         mode_paiement: 'wave',         reference: 'W2407001' },
  { id: 'pt2',  souscription_id: 'st1',  membre_id: 'm1',  numero_versement: 2, date_versement: '2024-08-03', montant: 92_000,  encaisseur_nom: 'FALL',     encaisseur_prenom: 'Aïda',         mode_paiement: 'wave',         reference: 'W2408001' },
  { id: 'pt3',  souscription_id: 'st1',  membre_id: 'm1',  numero_versement: 3, date_versement: '2024-09-07', montant: 92_000,  encaisseur_nom: 'FALL',     encaisseur_prenom: 'Aïda',         mode_paiement: 'wave',         reference: 'W2409001' },
  { id: 'pt4',  souscription_id: 'st1',  membre_id: 'm1',  numero_versement: 4, date_versement: '2024-10-05', montant: 92_000,  encaisseur_nom: 'NDIAYE',   encaisseur_prenom: 'Khady',        mode_paiement: 'wave',         reference: 'W2410001' },
  { id: 'pt5',  souscription_id: 'st1',  membre_id: 'm1',  numero_versement: 5, date_versement: '2024-11-02', montant: 92_000,  encaisseur_nom: 'NDIAYE',   encaisseur_prenom: 'Khady',        mode_paiement: 'wave',         reference: 'W2411001' },
  // SN002 – 2 terrains, versements via banque
  { id: 'pt6',  souscription_id: 'st2',  membre_id: 'm2',  numero_versement: 1, date_versement: '2024-07-10', montant: 200_000, encaisseur_nom: 'BA',       encaisseur_prenom: 'Ameth-Tidiane',mode_paiement: 'banque',       reference: 'SG2407002' },
  { id: 'pt7',  souscription_id: 'st2',  membre_id: 'm2',  numero_versement: 2, date_versement: '2024-08-12', montant: 200_000, encaisseur_nom: 'BA',       encaisseur_prenom: 'Ameth-Tidiane',mode_paiement: 'banque',       reference: 'SG2408002' },
  { id: 'pt8',  souscription_id: 'st2',  membre_id: 'm2',  numero_versement: 3, date_versement: '2024-09-15', montant: 150_000, encaisseur_nom: 'GUEYE',    encaisseur_prenom: 'Oumy',         mode_paiement: 'orange_money', reference: 'OM2409002' },
  { id: 'pt9',  souscription_id: 'st2',  membre_id: 'm2',  numero_versement: 4, date_versement: '2024-10-08', montant: 150_000, encaisseur_nom: 'GUEYE',    encaisseur_prenom: 'Oumy',         mode_paiement: 'orange_money', reference: 'OM2410002' },
  // SN003
  { id: 'pt10', souscription_id: 'st3',  membre_id: 'm3',  numero_versement: 1, date_versement: '2024-07-08', montant: 100_000, encaisseur_nom: 'ABLAYE',   encaisseur_prenom: 'Nafy',         mode_paiement: 'wave',         reference: 'W2407003' },
  { id: 'pt11', souscription_id: 'st3',  membre_id: 'm3',  numero_versement: 2, date_versement: '2024-08-06', montant: 100_000, encaisseur_nom: 'ABLAYE',   encaisseur_prenom: 'Nafy',         mode_paiement: 'wave',         reference: 'W2408003' },
  { id: 'pt12', souscription_id: 'st3',  membre_id: 'm3',  numero_versement: 3, date_versement: '2024-09-09', montant: 80_000,  encaisseur_nom: 'ABLAYE',   encaisseur_prenom: 'Nafy',         mode_paiement: 'wave',         reference: 'W2409003' },
  { id: 'pt13', souscription_id: 'st3',  membre_id: 'm3',  numero_versement: 4, date_versement: '2024-10-10', montant: 70_000,  encaisseur_nom: 'DIAKHATE', encaisseur_prenom: 'Kiné',         mode_paiement: 'autres',       reference: undefined },
  // SN005
  { id: 'pt14', souscription_id: 'st5',  membre_id: 'm5',  numero_versement: 1, date_versement: '2024-07-20', montant: 77_000,  encaisseur_nom: 'COLY',     encaisseur_prenom: 'Yama',         mode_paiement: 'wave',         reference: 'W2407005' },
  { id: 'pt15', souscription_id: 'st5',  membre_id: 'm5',  numero_versement: 2, date_versement: '2024-08-18', montant: 77_000,  encaisseur_nom: 'COLY',     encaisseur_prenom: 'Yama',         mode_paiement: 'wave',         reference: 'W2408005' },
  { id: 'pt16', souscription_id: 'st5',  membre_id: 'm5',  numero_versement: 3, date_versement: '2024-09-22', montant: 38_500,  encaisseur_nom: 'COLY',     encaisseur_prenom: 'Yama',         mode_paiement: 'wave',         reference: 'W2409005' },
  // SN009
  { id: 'pt17', souscription_id: 'st8',  membre_id: 'm9',  numero_versement: 1, date_versement: '2024-07-15', montant: 115_500, encaisseur_nom: 'NIANG',    encaisseur_prenom: 'Fatou',        mode_paiement: 'banque',       reference: 'SG2407009' },
  { id: 'pt18', souscription_id: 'st8',  membre_id: 'm9',  numero_versement: 2, date_versement: '2024-08-14', montant: 115_500, encaisseur_nom: 'NIANG',    encaisseur_prenom: 'Fatou',        mode_paiement: 'banque',       reference: 'SG2408009' },
  { id: 'pt19', souscription_id: 'st8',  membre_id: 'm9',  numero_versement: 3, date_versement: '2024-09-18', montant: 77_000,  encaisseur_nom: 'NIANG',    encaisseur_prenom: 'Fatou',        mode_paiement: 'banque',       reference: 'SG2409009' },
];

// ─── Souscriptions Logements ─────────────────────────────────────────────────
export const souscriptionsLogement: SouscriptionLogement[] = [
  {
    id: 'sl1', membre_id: 'm2',
    type_villa: 'F3', site: 'ndoyenne', titre: 'TF',
    prix_total: PRIX_F3,
    acompte_requis: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    acompte_verse: 1_200_000,
    mensualite: Math.round(PRIX_F3 / 120),
    nb_mensualites_payees: 0,
    statut: 'en_cours',
    date_souscription: '2024-09-01',
  },
  {
    id: 'sl2', membre_id: 'm4',
    type_villa: 'F2', site: 'keur_moussa', titre: 'TF',
    prix_total: PRIX_F2,
    acompte_requis: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    acompte_verse: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    mensualite: Math.round(PRIX_F2 / 120),
    nb_mensualites_payees: 3,
    statut: 'valide',
    date_souscription: '2024-08-15',
  },
  {
    id: 'sl3', membre_id: 'm6',
    type_villa: 'F2', site: 'ndoyenne', titre: 'bail',
    prix_total: PRIX_F2,
    acompte_requis: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    acompte_verse: 600_000,
    mensualite: Math.round(PRIX_F2 / 120),
    nb_mensualites_payees: 0,
    statut: 'en_cours',
    date_souscription: '2024-09-10',
  },
  {
    id: 'sl4', membre_id: 'm9',
    type_villa: 'F3', site: 'keur_moussa', titre: 'TF',
    prix_total: PRIX_F3,
    acompte_requis: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    acompte_verse: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    mensualite: Math.round(PRIX_F3 / 120),
    nb_mensualites_payees: 5,
    statut: 'valide',
    date_souscription: '2024-07-20',
  },
  {
    id: 'sl5', membre_id: 'm13',
    type_villa: 'F2', site: 'ndoyenne', titre: 'TF',
    prix_total: PRIX_F2,
    acompte_requis: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    acompte_verse: 0,
    mensualite: Math.round(PRIX_F2 / 120),
    nb_mensualites_payees: 0,
    statut: 'en_cours',
    date_souscription: '2024-10-01',
  },
  {
    id: 'sl6', membre_id: 'm14',
    type_villa: 'F3', site: 'ndoyenne', titre: 'TF',
    prix_total: PRIX_F3,
    acompte_requis: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    acompte_verse: 800_000,
    mensualite: Math.round(PRIX_F3 / 120),
    nb_mensualites_payees: 0,
    statut: 'en_cours',
    date_souscription: '2024-10-05',
  },
  {
    id: 'sl7', membre_id: 'm19',
    type_villa: 'F2', site: 'keur_moussa', titre: 'bail',
    prix_total: PRIX_F2,
    acompte_requis: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    acompte_verse: Math.round(PRIX_F2 * TAUX_ACOMPTE),
    mensualite: Math.round(PRIX_F2 / 120),
    nb_mensualites_payees: 2,
    statut: 'valide',
    date_souscription: '2024-08-01',
  },
  {
    id: 'sl8', membre_id: 'm20',
    type_villa: 'F3', site: 'ndoyenne', titre: 'TF',
    prix_total: PRIX_F3,
    acompte_requis: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    acompte_verse: Math.round(PRIX_F3 * TAUX_ACOMPTE),
    mensualite: Math.round(PRIX_F3 / 120),
    nb_mensualites_payees: 8,
    statut: 'valide',
    date_souscription: '2024-06-25',
  },
];

// ─── Paiements Logements ─────────────────────────────────────────────────────
export const paiementsLogement: PaiementLogement[] = [
  { id: 'pl1', souscription_id: 'sl2', membre_id: 'm4',  type_paiement: 'acompte',    date_versement: '2024-08-15', montant: 1_280_000, mode_paiement: 'banque',       reference: 'SG2408AC01' },
  { id: 'pl2', souscription_id: 'sl2', membre_id: 'm4',  type_paiement: 'mensualite', date_versement: '2024-10-01', montant: 133_333,   mode_paiement: 'wave',         reference: 'W2410M01' },
  { id: 'pl3', souscription_id: 'sl2', membre_id: 'm4',  type_paiement: 'mensualite', date_versement: '2024-11-01', montant: 133_333,   mode_paiement: 'wave',         reference: 'W2411M01' },
  { id: 'pl4', souscription_id: 'sl2', membre_id: 'm4',  type_paiement: 'mensualite', date_versement: '2024-12-02', montant: 133_333,   mode_paiement: 'wave',         reference: 'W2412M01' },
  { id: 'pl5', souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'acompte',    date_versement: '2024-07-20', montant: 1_600_000, mode_paiement: 'banque',       reference: 'SG2407AC02' },
  { id: 'pl6', souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'mensualite', date_versement: '2024-09-01', montant: 166_667,   mode_paiement: 'orange_money', reference: 'OM2409M01' },
  { id: 'pl7', souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'mensualite', date_versement: '2024-10-01', montant: 166_667,   mode_paiement: 'orange_money', reference: 'OM2410M01' },
  { id: 'pl8', souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'mensualite', date_versement: '2024-11-01', montant: 166_667,   mode_paiement: 'orange_money', reference: 'OM2411M01' },
  { id: 'pl9', souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'mensualite', date_versement: '2024-12-02', montant: 166_667,   mode_paiement: 'orange_money', reference: 'OM2412M01' },
  { id: 'pl10',souscription_id: 'sl4', membre_id: 'm9',  type_paiement: 'mensualite', date_versement: '2025-01-04', montant: 166_667,   mode_paiement: 'wave',         reference: 'W2501M01' },
  { id: 'pl11',souscription_id: 'sl7', membre_id: 'm19', type_paiement: 'acompte',    date_versement: '2024-08-01', montant: 1_280_000, mode_paiement: 'banque',       reference: 'SG2408AC03' },
  { id: 'pl12',souscription_id: 'sl7', membre_id: 'm19', type_paiement: 'mensualite', date_versement: '2024-10-01', montant: 133_333,   mode_paiement: 'wave',         reference: 'W2410M03' },
  { id: 'pl13',souscription_id: 'sl7', membre_id: 'm19', type_paiement: 'mensualite', date_versement: '2024-11-01', montant: 133_333,   mode_paiement: 'wave',         reference: 'W2411M03' },
  { id: 'pl14',souscription_id: 'sl8', membre_id: 'm20', type_paiement: 'acompte',    date_versement: '2024-06-25', montant: 1_600_000, mode_paiement: 'banque',       reference: 'SG2406AC04' },
  { id: 'pl15',souscription_id: 'sl8', membre_id: 'm20', type_paiement: 'mensualite', date_versement: '2024-08-01', montant: 166_667,   mode_paiement: 'wave',         reference: 'W2408M04' },
  { id: 'pl16',souscription_id: 'sl2', membre_id: 'm2',  type_paiement: 'acompte',    date_versement: '2024-09-01', montant: 1_200_000, mode_paiement: 'banque',       reference: 'SG2409AC05' },
];

// ─── Helpers d'accès ─────────────────────────────────────────────────────────
export function getMembreById(id: string) {
  return membres.find(m => m.id === id);
}

export function getSouscriptionTerrainByMembre(membreId: string) {
  return souscriptionsTerrain.filter(s => s.membre_id === membreId);
}

export function getPaiementsTerrainBySouscription(souscriptionId: string) {
  return paiementsTerrain.filter(p => p.souscription_id === souscriptionId);
}

export function getSouscriptionLogementByMembre(membreId: string) {
  return souscriptionsLogement.filter(s => s.membre_id === membreId);
}

export function getPaiementsLogementBySouscription(souscriptionId: string) {
  return paiementsLogement.filter(p => p.souscription_id === souscriptionId);
}
