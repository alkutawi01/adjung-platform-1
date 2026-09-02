import { useEffect, useRef, useState } from 'react';

/**
 * Reports whether a horizontally-scrollable element currently has content
 * off-screen, so a "swipe to see more" affordance can be shown exactly when
 * it is true.
 *
 * A CSS breakpoint can't answer this: a table's real width comes from its
 * content, not from its min-width, so the same table overflows at different
 * viewport widths depending on how long the titles and author names happen
 * to be. Measuring the element is the only way to get it right.
 */
export function useHorizontalOverflow<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 1px of tolerance — sub-pixel layout rounding can otherwise report a
    // permanent phantom overflow on a table that visually fits exactly.
    const check = () => setIsOverflowing(el.scrollWidth - el.clientWidth > 1);

    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    // The row count and cell contents change as filters are applied, which
    // resizes children without necessarily resizing the container itself.
    Array.from(el.children).forEach(child => observer.observe(child as Element));

    return () => observer.disconnect();
  });

  return { ref, isOverflowing };
}
