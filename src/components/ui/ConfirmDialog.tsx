import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'confirm',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-5 select-none">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            type === 'error' 
              ? 'bg-red-50 text-red-600' 
              : type === 'confirm' 
                ? 'bg-amber-50 text-amber-600' 
                : 'bg-primary-50 text-primary-600'
          }`}>
            {type === 'error' ? (
              <AlertTriangle size={18} />
            ) : type === 'confirm' ? (
              <HelpCircle size={18} />
            ) : (
              <Info size={18} />
            )}
          </div>
          <p className="text-sm text-slate-650 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {type === 'confirm' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer ${
              type === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : type === 'confirm'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {type === 'confirm' ? confirmText : 'OK'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
