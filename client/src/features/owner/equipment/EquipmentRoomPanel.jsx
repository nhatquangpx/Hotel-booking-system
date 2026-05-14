import React from 'react';
import { EQUIPMENT_STATUS_OPTIONS } from './constants';
import EquipmentDeviceRow from './EquipmentDeviceRow';

function isEquipmentRowBusy(updatingKeys, roomStrId, eqId) {
  return (
    updatingKeys.has(`${roomStrId}_${eqId}_st`) ||
    updatingKeys.has(`${roomStrId}_${eqId}_nm`) ||
    updatingKeys.has(`${roomStrId}_${eqId}_del`)
  );
}

/**
 * Nội dung mở rộng của một phòng: thêm thiết bị + danh sách.
 */
const EquipmentRoomPanel = ({
  room,
  roomStrId,
  draft,
  addBusy,
  nameEditKey,
  nameEditEscapeRef,
  updatingKeys,
  onDraftChange,
  onAddEquipment,
  onNameBlur,
  onStatusChange,
  onNameEditKeyChange,
  onRequestDelete,
}) => {
  const equipment = room.roomEquipment || [];
  const addNameInputId = `owner-equipment-add-name-${roomStrId}`;

  return (
    <div className="owner-equipment-room-panel">
      <div className="owner-equipment-add-row">
        <label htmlFor={addNameInputId} className="owner-equipment-add-row__label">
          Tên thiết bị
        </label>
        <input
          id={addNameInputId}
          type="text"
          className="owner-equipment-add-row__input"
          placeholder="Ví dụ: Điều hòa, TV, minibar…"
          value={draft.name}
          disabled={addBusy}
          onChange={(e) => onDraftChange(room._id, { name: e.target.value })}
          autoComplete="off"
        />
        <select
          className={`owner-equipment-add-row__select owner-equipment-add-row__select--status-${draft.status}`}
          value={draft.status}
          disabled={addBusy}
          onChange={(e) => onDraftChange(room._id, { status: e.target.value })}
          aria-label="Trạng thái khi thêm"
        >
          {EQUIPMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="owner-equipment-add-row__btn"
          disabled={addBusy}
          onClick={() => onAddEquipment(room._id)}
        >
          Thêm
        </button>
      </div>

      {equipment.length === 0 ? (
        <p className="owner-equipment-room-panel__empty">
          Chưa có thiết bị nào. Chỉ thiết bị vật lý trong phòng cần theo dõi (điều hòa, TV, két…); không dùng danh
          sách này cho dịch vụ như spa hay dọn phòng.
        </p>
      ) : (
        <ul className="owner-equipment-device-list">
          {equipment.map((item) => {
            const eqId = item._id ? String(item._id) : '';
            const rowBusy = isEquipmentRowBusy(updatingKeys, roomStrId, eqId);
            const editKey = `${roomStrId}__${eqId}`;

            return (
              <EquipmentDeviceRow
                key={eqId || item.name}
                roomId={room._id}
                roomNumber={room.roomNumber}
                item={item}
                rowBusy={rowBusy}
                editKey={editKey}
                isEditingName={nameEditKey === editKey}
                nameEditEscapeRef={nameEditEscapeRef}
                onNameBlur={onNameBlur}
                onNameEditKeyChange={onNameEditKeyChange}
                onStatusChange={onStatusChange}
                onRequestDelete={(rid, eid, name) => onRequestDelete(rid, eid, name, room.roomNumber)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default EquipmentRoomPanel;
