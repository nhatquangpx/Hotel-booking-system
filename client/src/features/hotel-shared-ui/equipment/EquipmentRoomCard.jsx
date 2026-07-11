import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { formatRoomType } from '@/constants/roomTypes';
import EquipmentRoomPanel from './EquipmentRoomPanel';

/**
 * Một phòng trong danh sách (header accordion + panel).
 */
const EquipmentRoomCard = ({
  room,
  isOpen,
  draft,
  addBusy,
  nameEditKey,
  nameEditEscapeRef,
  updatingKeys,
  onToggleRoom,
  onDraftChange,
  onAddEquipment,
  onNameBlur,
  onStatusChange,
  onNameEditKeyChange,
  onRequestDelete,
}) => {
  const id = String(room._id);
  const typeLabel = formatRoomType(room.type);
  const equipment = room.roomEquipment || [];

  return (
    <li className="owner-equipment-room-list__item">
      <button
        type="button"
        className={`owner-equipment-room-header ${isOpen ? 'is-open' : ''}`}
        onClick={() => onToggleRoom(room._id)}
        aria-expanded={isOpen}
      >
        <span className="owner-equipment-room-header__chevron" aria-hidden>
          <FaChevronDown />
        </span>
        <span className="owner-equipment-room-header__main">
          <span className="owner-equipment-room-header__number">Phòng {room.roomNumber}</span>
          <span className="owner-equipment-room-header__meta">{typeLabel}</span>
        </span>
        <span className="owner-equipment-room-header__count">{equipment.length} thiết bị</span>
      </button>

      {isOpen && (
        <EquipmentRoomPanel
          room={room}
          roomStrId={id}
          draft={draft}
          addBusy={addBusy}
          nameEditKey={nameEditKey}
          nameEditEscapeRef={nameEditEscapeRef}
          updatingKeys={updatingKeys}
          onDraftChange={onDraftChange}
          onAddEquipment={onAddEquipment}
          onNameBlur={onNameBlur}
          onStatusChange={onStatusChange}
          onNameEditKeyChange={onNameEditKeyChange}
          onRequestDelete={onRequestDelete}
        />
      )}
    </li>
  );
};

export default EquipmentRoomCard;
