import React from 'react';
import Dialog from '@/components/ui/Dialog';

/**
 * @param {boolean} isOpen
 * @param {string} maintenanceEmailDraft
 * @param {(e: { target: { value: string } }) => void} onMaintenanceEmailChange
 * @param {() => void} onSaveMaintenanceEmail
 * @param {boolean} maintenanceSaving
 * @param {boolean} pageLoading
 * @param {{ key: string, roomId: string, equipmentId: string, roomNumber: string, name: string }[]} brokenList
 * @param {Record<string, boolean>} selectedMap
 * @param {(key: string) => void} onToggle
 * @param {() => void} onSelectAllBroken
 * @param {() => void} onClearSelection
 * @param {() => void} onSend
 * @param {boolean} sending
 * @param {string | null} sendError
 * @param {() => void} onClose
 */
const EquipmentRepairRequestDialog = ({
  isOpen,
  maintenanceEmailDraft,
  onMaintenanceEmailChange,
  onSaveMaintenanceEmail,
  maintenanceSaving,
  pageLoading,
  brokenList,
  selectedMap,
  onToggle,
  onSelectAllBroken,
  onClearSelection,
  onSend,
  sending,
  sendError,
  onClose,
}) => {
  const selectedCount = brokenList.filter((row) => selectedMap[row.key]).length;
  const busy = sending || maintenanceSaving;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      title="Báo bên sửa chữa"
      maxWidth="520px"
      className="owner-equipment-repair-dialog"
    >
      <div className="owner-equipment-repair-dialog__content">
        {sendError && <div className="owner-equipment-repair-dialog__error">{sendError}</div>}

        <div className="owner-equipment-repair-dialog__email-box">
          <h3 id="owner-equipment-repair-email-heading" className="owner-equipment-repair-dialog__section-title">
            Email bên sửa chữa
          </h3>
          <p id="owner-equipment-repair-email-hint" className="owner-equipment-repair-dialog__email-hint">
            Địa chỉ nhận email báo thiết bị hỏng. Lưu lại trước khi gửi nếu bạn vừa chỉnh sửa.
          </p>
          <div className="owner-equipment-repair-dialog__email-row">
            <input
              id="owner-equipment-maintenance-email"
              type="email"
              className="owner-equipment-repair-dialog__email-input"
              placeholder="vendor@example.com"
              value={maintenanceEmailDraft}
              onChange={onMaintenanceEmailChange}
              autoComplete="email"
              disabled={pageLoading}
              aria-labelledby="owner-equipment-repair-email-heading"
              aria-describedby="owner-equipment-repair-email-hint"
            />
            <button
              type="button"
              className="owner-equipment-repair-dialog__email-save"
              onClick={onSaveMaintenanceEmail}
              disabled={maintenanceSaving || pageLoading}
              aria-label={maintenanceSaving ? 'Đang lưu địa chỉ email bên sửa chữa' : 'Lưu địa chỉ email bên sửa chữa'}
            >
              {maintenanceSaving ? 'Đang lưu…' : 'Lưu email'}
            </button>
          </div>
        </div>

        <h3 className="owner-equipment-repair-dialog__section-title owner-equipment-repair-dialog__section-title--spaced">
          Thiết bị gửi kèm
        </h3>

        {brokenList.length === 0 ? (
          <p className="owner-equipment-repair-dialog__empty">
            Không có thiết bị nào đang ở trạng thái Hỏng. Bạn vẫn có thể cập nhật email đối tác ở khối phía trên.
          </p>
        ) : (
          <>
            <p id="owner-equipment-repair-devices-hint" className="owner-equipment-repair-dialog__lead">
              Chọn thiết bị cần gửi trong email (mặc định đã chọn tất cả thiết bị hỏng).
            </p>
            <div className="owner-equipment-repair-dialog__toolbar">
              <button
                type="button"
                className="owner-equipment-repair-dialog__toolbar-btn owner-equipment-repair-dialog__toolbar-btn--primary"
                onClick={onSelectAllBroken}
                disabled={sending}
              >
                Chọn tất cả thiết bị hỏng
              </button>
              <button
                type="button"
                className="owner-equipment-repair-dialog__toolbar-btn owner-equipment-repair-dialog__toolbar-btn--secondary"
                onClick={onClearSelection}
                disabled={sending}
              >
                Bỏ chọn tất cả
              </button>
              <span className="owner-equipment-repair-dialog__count">Đã chọn: {selectedCount}</span>
            </div>
            <ul className="owner-equipment-repair-dialog__list">
              {brokenList.map((row) => (
                <li key={row.key} className="owner-equipment-repair-dialog__row">
                  <label className="owner-equipment-repair-dialog__label">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedMap[row.key])}
                      onChange={() => onToggle(row.key)}
                      disabled={sending}
                    />
                    <span className="owner-equipment-repair-dialog__label-text">
                      <span className="owner-equipment-repair-dialog__room">Phòng {row.roomNumber}</span>
                      <span className="owner-equipment-repair-dialog__name">{row.name}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="owner-equipment-repair-dialog__actions">
          <button
            type="button"
            className="owner-equipment-repair-dialog__btn-send"
            onClick={onSend}
            disabled={sending || brokenList.length === 0 || selectedCount === 0}
            aria-label={
              sending
                ? 'Đang gửi email báo thiết bị hỏng cho bên sửa chữa'
                : 'Gửi email báo thiết bị hỏng cho bên sửa chữa'
            }
            aria-describedby={
              brokenList.length > 0 ? 'owner-equipment-repair-devices-hint' : undefined
            }
          >
            {sending ? 'Đang gửi…' : 'Gửi email'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default EquipmentRepairRequestDialog;
