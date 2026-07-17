import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Please Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  const containerRef = useModalA11y(isOpen, onCancel);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        className="bg-[#FDFDFD] border border-adjung-maroon/20 rounded shadow-2xl max-w-sm w-full overflow-hidden scholarly-border outline-none"
      >
        <div className="relative p-6 text-center space-y-3">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            data-modal-close
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-stone-400 hover:text-adjung-maroon hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center ${danger ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 id="confirm-dialog-title" className="font-serif text-lg text-stone-900">{title}</h3>
          <p className="font-sans text-xs text-stone-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex border-t border-stone-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-stone-600 hover:bg-stone-50 font-mono text-[10px] uppercase tracking-wider transition cursor-pointer border-r border-stone-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 text-[#FDFDFD] font-mono text-[10px] uppercase tracking-wider transition cursor-pointer font-semibold ${
              danger ? 'bg-adjung-maroon hover:bg-[#611522]' : 'bg-stone-800 hover:bg-stone-900'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
