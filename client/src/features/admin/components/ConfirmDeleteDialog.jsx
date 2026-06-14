import React from 'react';
import Dialog from '@/components/ui/Dialog';
import './ConfirmDeleteDialog.scss';

/**
 * Dialog xác nhận trước khi xóa (admin).
 */
const ConfirmDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa',
  message,
  warning = 'Hành động này không thể hoàn tác.',
  confirmLabel = 'Xác nhận xóa',
  cancelLabel = 'Hủy',
  confirming = false,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={confirming ? () => {} : onClose}
      title={title}
      maxWidth="480px"
      className="admin-confirm-delete-dialog"
    >
      <div className="admin-confirm-delete-dialog__body">
        {message && <p className="admin-confirm-delete-dialog__message">{message}</p>}
        {warning && <p className="admin-confirm-delete-dialog__warning">{warning}</p>}
        <div className="admin-confirm-delete-dialog__actions">
          <button
            type="button"
            className="admin-confirm-delete-dialog__btn admin-confirm-delete-dialog__btn--cancel"
            onClick={onClose}
            disabled={confirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="admin-confirm-delete-dialog__btn admin-confirm-delete-dialog__btn--confirm"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Đang xóa...' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
