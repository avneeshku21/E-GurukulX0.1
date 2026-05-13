import { useState } from 'react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm?.();
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title} size="sm">
      <div className="space-y-5">
        {description && <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button size="sm" variant={confirmVariant === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm} isLoading={isLoading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}