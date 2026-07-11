import React from 'react';
import Dialog from '@/components/ui/Dialog';

/**
 * @param {{ roomId: string, equipmentId: string, equipmentName: string, roomNumber: string } | null} deleteTarget
 */
const EquipmentDeleteDialog = ({
  deleteTarget,
  deleteError,
  deleteDialogBusy,
  onClose,
  onConfirm,
}) => (
  <Dialog
    isOpen={Boolean(deleteTarget)}
    onClose={onClose}
    title="Xóa thiết bị"
    maxWidth="440px"
    className="owner-equipment-delete-dialog"
  >
    {deleteTarget && (
      <div className="owner-equipment-delete-dialog__content">
        {deleteError && <div className="owner-equipment-delete-dialog__error">{deleteError}</div>}
        <p className="owner-equipment-delete-dialog__lead">
          Bạn có chắc muốn xóa thiết bị <strong>{deleteTarget.equipmentName}</strong> khỏi{' '}
          <strong>phòng {deleteTarget.roomNumber}</strong>?
        </p>
        <p className="owner-equipment-delete-dialog__note">Thao tác này không thể hoàn tác.</p>
        <div className="owner-equipment-delete-dialog__actions">
          <button
            type="button"
            className="owner-equipment-delete-dialog__btn-cancel"
            onClick={onClose}
            disabled={deleteDialogBusy}
          >
            Hủy
          </button>
          <button
            type="button"
            className="owner-equipment-delete-dialog__btn-delete"
            onClick={onConfirm}
            disabled={deleteDialogBusy}
          >
            {deleteDialogBusy ? 'Đang xóa…' : 'Xóa thiết bị'}
          </button>
        </div>
      </div>
    )}
  </Dialog>
);

export default EquipmentDeleteDialog;
