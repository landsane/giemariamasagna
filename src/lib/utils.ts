import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Offre, SiteLogement } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

/** Montant de l'acompte à verser sur un prix total, pour un taux donné (ex : 0.08 = 8 %). */
export function calculerAcompte(prixTotal: number, tauxAcompte: number): number {
  return Math.round(prixTotal * tauxAcompte);
}

/**
 * Mensualité = (prix total − acompte) réparti sur le nombre de mensualités.
 * L'acompte doit toujours être déduit avant de mensualiser le reste.
 */
export function calculerMensualite(prixTotal: number, tauxAcompte: number, nbMensualites: number): number {
  if (nbMensualites <= 0) return 0;
  const reste = prixTotal - calculerAcompte(prixTotal, tauxAcompte);
  return Math.round(reste / nbMensualites);
}

/** Pourcentage réel d'acompte d'une souscription, calculé depuis ses propres
 * montants — ne jamais afficher un taux fixe en dur (ex : "8%"), les offres
 * peuvent avoir des taux différents (8 %, 10 %…). */
export function pourcentageAcompte(acompteRequis: number, prixTotal: number): number {
  return prixTotal > 0 ? Math.round((acompteRequis / prixTotal) * 100) : 0;
}

/**
 * Localisation à afficher pour une souscription logement/terrain TF :
 * toujours préférer le texte libre de l'offre du catalogue (source de vérité,
 * fonctionne pour n'importe quel site) plutôt que le bucket `site` (legacy,
 * limité à 'ndoyenne' / 'keur_moussa') stocké sur la souscription.
 */
export function localisationSouscription(
  offre: Offre | undefined,
  site: SiteLogement,
  labelsSite: Record<SiteLogement, string>
): string {
  return offre?.localisation ?? labelsSite[site];
}

/**
 * Déduit le bucket `site` (legacy, 'ndoyenne' | 'keur_moussa') à partir de la
 * localisation d'une offre — nécessaire uniquement parce que la colonne site
 * en base est contrainte à ces deux valeurs. Pour l'affichage, préférer
 * toujours `localisationSouscription()` / `offre.localisation` directement.
 */
export function siteFromOffre(o: Offre): SiteLogement {
  const loc = o.localisation.toLowerCase();
  return loc.includes('keur') || loc.includes('moussa') || loc.includes('diender') || loc.includes('djender')
    ? 'keur_moussa'
    : 'ndoyenne';
}
