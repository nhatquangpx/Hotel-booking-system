import React from 'react';
import { FaTrash, FaPen } from 'react-icons/fa';
import { EQUIPMENT_STATUS_OPTIONS } from './constants';

const EquipmentDeviceRow = ({
  roomId,
  roomNumber,
  item,
  rowBusy,
  editKey,
  isEditingName,
  nameEditEscapeRef,
  onNameBlur,
  onNameEditKeyChange,
  onStatusChange,
  onRequestDelete,
}) => {
  const eqId = item._id ? String(item._id) : '';
  const roomCtx =
    roomNumber !== undefined && roomNumber !== null && String(roomNumber).trim() !== ''
      ? `phòng ${String(roomNumber).trim()}`
      : '';
  const renameInputLabel = roomCtx
    ? `Đổi tên thiết bị «${item.name}», ${roomCtx}`
    : `Đổi tên thiết bị «${item.name}»`;

  return (
    <li
      className={`owner-equipment-device-list__row owner-equipment-device-list__row--status-${item.status}`}
    >
      <div className="owner-equipment-device-list__name-wrap">
        {isEditingName ? (
          <input
            type="text"
            className="owner-equipment-device-list__name-input"
            defaultValue={item.name}
            autoFocus
            disabled={rowBusy}
            aria-label={renameInputLabel}
            onBlur={(e) => {
              if (nameEditEscapeRef.current) {
                nameEditEscapeRef.current = false;
                return;
              }
              onNameBlur(roomId, eqId, item.name, e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') {
                e.preventDefault();
                nameEditEscapeRef.current = true;
                onNameEditKeyChange(null);
              }
            }}
          />
        ) : (
          <>
            <span className="owner-equipment-device-list__name">{item.name}</span>
            <button
              type="button"
              className="owner-equipment-device-list__icon-btn"
              title="Đổi tên"
              disabled={rowBusy || !eqId}
              onClick={() => onNameEditKeyChange(editKey)}
              aria-label={`Đổi tên ${item.name}`}
            >
              <FaPen />
            </button>
          </>
        )}
      </div>
      <select
        className={`owner-equipment-device-list__select owner-equipment-device-list__select--status-${item.status}`}
        value={item.status}
        disabled={rowBusy || !eqId}
        onChange={(e) => onStatusChange(roomId, eqId, e.target.value)}
        aria-label={`Trạng thái ${item.name}`}
      >
        {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="owner-equipment-device-list__icon-btn owner-equipment-device-list__icon-btn--danger"
        title="Xóa"
        disabled={rowBusy || !eqId}
        onClick={() => onRequestDelete(roomId, eqId, item.name)}
        aria-label={`Xóa ${item.name}`}
      >
        <FaTrash />
      </button>
    </li>
  );
};

export default EquipmentDeviceRow;
