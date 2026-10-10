import { useEffect, useState, type RefObject } from "react";

/**
 * True while at least `ratio` of the element is visible. Tied to moodi's `sound`
 * attribute: switching it false → true plays the current mood, so a buddy speaks up every
 * time it scrolls (back) into view, but not while it only peeks in at the edge.
 */
export function useInView(ref: RefObject<Element | null>, ratio = 0.6) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.intersectionRatio >= ratio), {
      threshold: [0, ratio],
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, ratio]);
  return inView;
}
