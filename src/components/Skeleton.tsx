import { cn } from '@/lib/utils';

// Bloc de chargement générique (remplace les divs animate-pulse ad hoc) —
// même teinte que la marque plutôt qu'un gris neutre, pour rester cohérent
// pendant le chargement.
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-emerald-100/70', className)} />;
}
