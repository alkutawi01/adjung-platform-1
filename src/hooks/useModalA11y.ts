import { useCallback, useEffect, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Escape-to-close + focus trap for modal dialogs, shared across ConfirmDialog,
 * AccountModal, LoginModal, SwitchScriptorModal per Design System v2.0 §08
 * (none of these had keyboard support before — mouse-only close).
 */
export function useModalA11y(isOpen: boolean, onClose: () => void) {
  // A callback ref backed by state, not useRef: IdentityStudio renders a
  // "Loading Identity..." placeholder on its first pass, so the dialog element
  // (and this ref) does not exist yet when the effect below first runs. With a
  // plain ref the effect never re-ran once the real markup mounted, leaving
  // that modal with no focus move and no Tab trap. Storing the node in state
  // re-runs the effect the moment it attaches.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => setContainer(node), []);

  // onClose is re-created every render (it's an inline arrow function at every
  // call site) — reading it through a ref, instead of putting it in the effect's
  // dependency array, keeps the effect below from tearing down and rebuilding on
  // every keystroke in a controlled form field, which was yanking focus out to
  // whatever triggered the modal and back on every character typed.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      container
        ? (Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) as HTMLElement[]).filter(
            (el) => el.offsetParent !== null
          )
        : [];

    // Close buttons (marked data-modal-close) are deliberately skipped when
    // picking the auto-focus target — they're often the first focusable element
    // in DOM order (top-right, but rendered first), which would otherwise steal
    // initial focus away from the form field a visitor actually wants to type into.
    const focusable = getFocusable();
    const initialTarget = focusable.find((el) => !el.hasAttribute('data-modal-close')) || focusable[0];
    (initialTarget || container)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const focusableNow = getFocusable();
        if (focusableNow.length === 0) return;
        const firstEl = focusableNow[0];
        const lastEl = focusableNow[focusableNow.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, container]);

  return containerRef;
}
