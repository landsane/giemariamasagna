import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
