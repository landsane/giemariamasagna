import { useEffect, useRef, useState } from 'react';

/**
 * Anime un nombre de sa valeur précédente jusqu'à `target` sur `duration` ms.
 * Désactivé si l'utilisateur préfère un mouvement réduit — dans ce cas la
 * valeur cible s'affiche directement, sans jamais passer par une animation.
 */
export function useCountUp(target: number, duration = 600): number {
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const start = from.current;
    const delta = target - start;
    if (delta === 0) return;

    let raf = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + delta * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, prefersReducedMotion]);

  return prefersReducedMotion ? target : value;
}
