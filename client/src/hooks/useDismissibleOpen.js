import { useEffect } from 'react';

/**
 * Close an open menu on outside click / Escape and scroll the selected option into view.
 */
export function useDismissibleOpen(rootRef, open, onClose, {
  selectedSelector = '[aria-selected="true"]',
  listSelector,
} = {}) {
  useEffect(() => {
    if (!open) return undefined;

    function away(event) {
      if (!rootRef.current?.contains(event.target)) onClose();
    }
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', onKey);

    const root = rootRef.current;
    if (root) {
      const selected = root.querySelector(selectedSelector);
      const list = listSelector
        ? root.querySelector(listSelector)
        : selected?.parentElement;
      if (selected && list) {
        list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.clientHeight / 2;
      }
    }

    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, rootRef, selectedSelector, listSelector]);
}
