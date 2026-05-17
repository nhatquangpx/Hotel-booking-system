import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import StaffLayout from '@/features/staff/components/StaffLayout';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import api from '@/apis';
import EquipmentGuide from '@/features/owner/equipment/EquipmentGuide';
import EquipmentDeleteDialog from '@/features/owner/equipment/EquipmentDeleteDialog';
import EquipmentRepairRequestDialog from '@/features/owner/equipment/EquipmentRepairRequestDialog';
import EquipmentRoomCard from '@/features/owner/equipment/EquipmentRoomCard';
import { apiErrorMessage, mergeRoomIntoList } from '@/features/owner/equipment/equipmentUtils';
import '@/features/owner/equipment/EquipmentPage.scss';

const StaffEquipmentPage = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const equipmentFetchSeq = useRef(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [updatingKeys, setUpdatingKeys] = useState(() => new Set());
  const [addDraftByRoom, setAddDraftByRoom] = useState({});
  const [nameEditKey, setNameEditKey] = useState(null);
  const nameEditEscapeRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [maintenanceContactEmail, setMaintenanceContactEmail] = useState('');
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [repairSelectedMap, setRepairSelectedMap] = useState({});
  const [repairSending, setRepairSending] = useState(false);
  const [repairSendError, setRepairSendError] = useState(null);

  const fetchData = useCallback(async () => {
    if (hotelLoading || !hotelId) {
      return;
    }
    const seq = ++equipmentFetchSeq.current;
    try {
      setLoading(true);
      const [data, maint] = await Promise.all([
        api.staffEquipment.getByHotel(),
        api.staffHotel.getMaintenanceContact(),
      ]);
      if (seq !== equipmentFetchSeq.current) {
        return;
      }
      setRooms(Array.isArray(data.rooms) ? data.rooms : []);
      setMaintenanceContactEmail(
        typeof maint?.maintenanceContactEmail === 'string' ? maint.maintenanceContactEmail : ''
      );
      setError(null);
    } catch (err) {
      if (seq === equipmentFetchSeq.current) {
        setError(apiErrorMessage(err));
        setRooms([]);
        setMaintenanceContactEmail('');
      }
    } finally {
      if (seq === equipmentFetchSeq.current) {
        setLoading(false);
      }
    }
  }, [hotelId, hotelLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!hotelLoading && !hotelId) {
      setLoading(false);
      setRooms([]);
    }
  }, [hotelLoading, hotelId]);

  useEffect(() => {
    setMaintenanceContactEmail('');
    setRepairDialogOpen(false);
    setRepairSelectedMap({});
    setRepairSendError(null);
  }, [hotelId]);

  const [leftCol, rightCol] = useMemo(() => {
    if (!rooms.length) return [[], []];
    const mid = Math.ceil(rooms.length / 2);
    return [rooms.slice(0, mid), rooms.slice(mid)];
  }, [rooms]);

  const brokenEquipmentList = useMemo(() => {
    const out = [];
    for (const room of rooms) {
      const rid = room?._id != null ? String(room._id) : '';
      if (!rid) continue;
      for (const eq of room.roomEquipment || []) {
        if (eq?.status !== 'broken') continue;
        const eid = eq?._id != null ? String(eq._id) : '';
        if (!eid) continue;
        out.push({
          key: `${rid}_${eid}`,
          roomId: rid,
          equipmentId: eid,
          roomNumber: room.roomNumber != null ? String(room.roomNumber) : '',
          name: eq.name || '',
        });
      }
    }
    return out;
  }, [rooms]);

  const toggleRoom = (roomId) => {
    const id = String(roomId);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setUpdating = (key, on) => {
    setUpdatingKeys((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const getAddDraft = (roomId) => {
    const id = String(roomId);
    return addDraftByRoom[id] || { name: '', status: 'operational' };
  };

  const setAddDraft = (roomId, partial) => {
    const id = String(roomId);
    setAddDraftByRoom((prev) => {
      const cur = prev[id] || { name: '', status: 'operational' };
      return { ...prev, [id]: { ...cur, ...partial } };
    });
  };

  const handleAddEquipment = async (roomId) => {
    const draft = getAddDraft(roomId);
    const name = draft.name.trim();
    if (!name) {
      toast.warn('Vui lòng nhập tên thiết bị.');
      return;
    }
    const key = `add_${roomId}`;
    setUpdating(key, true);
    try {
      const data = await api.staffEquipment.postEquipment(roomId, {
        name,
        status: draft.status || 'operational',
      });
      setRooms((prev) => mergeRoomIntoList(prev, roomId, data));
      setAddDraft(roomId, { name: '', status: 'operational' });
      toast.success('Đã thêm thiết bị.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUpdating(key, false);
    }
  };

  const handleStatusChange = async (roomId, equipmentId, status) => {
    const key = `${roomId}_${equipmentId}_st`;
    setUpdating(key, true);
    try {
      const data = await api.staffEquipment.patchEquipment(roomId, equipmentId, { status });
      setRooms((prev) => mergeRoomIntoList(prev, roomId, data));
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUpdating(key, false);
    }
  };

  const handleNameBlur = async (roomId, equipmentId, currentName, newValue) => {
    const trimmed = (newValue || '').trim();
    if (!trimmed || trimmed === currentName) {
      setNameEditKey(null);
      return;
    }
    const key = `${roomId}_${equipmentId}_nm`;
    setUpdating(key, true);
    try {
      const data = await api.staffEquipment.patchEquipment(roomId, equipmentId, { name: trimmed });
      setRooms((prev) => mergeRoomIntoList(prev, roomId, data));
      setNameEditKey(null);
      toast.success('Đã cập nhật tên thiết bị.');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUpdating(key, false);
    }
  };

  const openDeleteDialog = (roomId, equipmentId, equipmentName, roomNumber) => {
    setDeleteError(null);
    setDeleteTarget({
      roomId: String(roomId),
      equipmentId: String(equipmentId),
      equipmentName: equipmentName || '',
      roomNumber: roomNumber != null ? String(roomNumber) : '',
    });
  };

  const closeDeleteDialog = () => {
    if (!deleteTarget) return;
    const busy = updatingKeys.has(`${deleteTarget.roomId}_${deleteTarget.equipmentId}_del`);
    if (busy) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const openRepairDialog = () => {
    const next = {};
    brokenEquipmentList.forEach((row) => {
      next[row.key] = true;
    });
    setRepairSelectedMap(next);
    setRepairSendError(null);
    setRepairDialogOpen(true);
  };

  const closeRepairDialog = () => {
    if (repairSending) return;
    setRepairDialogOpen(false);
    setRepairSendError(null);
  };

  const toggleRepairSelection = (key) => {
    setRepairSelectedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllBrokenInDialog = () => {
    const next = {};
    brokenEquipmentList.forEach((row) => {
      next[row.key] = true;
    });
    setRepairSelectedMap(next);
  };

  const clearRepairSelection = () => {
    setRepairSelectedMap({});
  };

  const sendRepairRequest = async () => {
    if (!hotelId) return;
    const items = brokenEquipmentList
      .filter((row) => repairSelectedMap[row.key])
      .map(({ roomId, equipmentId }) => ({ roomId, equipmentId }));
    if (items.length === 0) {
      toast.warn('Vui lòng chọn ít nhất một thiết bị.');
      return;
    }
    setRepairSending(true);
    setRepairSendError(null);
    try {
      await api.staffEquipment.postRepairRequest({ items });
      toast.success('Đã gửi email báo sửa chữa.');
      setRepairDialogOpen(false);
    } catch (err) {
      setRepairSendError(apiErrorMessage(err));
    } finally {
      setRepairSending(false);
    }
  };

  const confirmDeleteEquipment = async () => {
    if (!deleteTarget) return;
    const { roomId, equipmentId } = deleteTarget;
    const key = `${roomId}_${equipmentId}_del`;
    setUpdating(key, true);
    setDeleteError(null);
    try {
      const data = await api.staffEquipment.deleteEquipment(roomId, equipmentId);
      setRooms((prev) => mergeRoomIntoList(prev, roomId, data));
      toast.success('Đã xóa thiết bị.');
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err));
    } finally {
      setUpdating(key, false);
    }
  };

  const deleteDialogBusy =
    deleteTarget && updatingKeys.has(`${deleteTarget.roomId}_${deleteTarget.equipmentId}_del`);

  const showNoHotel = !hotelLoading && !hotelId;

  const renderRoomCard = (room) => {
    const id = String(room._id);
    const isOpen = Boolean(expanded[id]);
    const draft = getAddDraft(room._id);
    const addBusy = updatingKeys.has(`add_${room._id}`);

    return (
      <EquipmentRoomCard
        key={id}
        room={room}
        isOpen={isOpen}
        draft={draft}
        addBusy={addBusy}
        nameEditKey={nameEditKey}
        nameEditEscapeRef={nameEditEscapeRef}
        updatingKeys={updatingKeys}
        onToggleRoom={toggleRoom}
        onDraftChange={setAddDraft}
        onAddEquipment={handleAddEquipment}
        onNameBlur={handleNameBlur}
        onStatusChange={handleStatusChange}
        onNameEditKeyChange={setNameEditKey}
        onRequestDelete={openDeleteDialog}
      />
    );
  };

  const displayError = error || (!hotelLoading && hotelError);

  return (
    <StaffLayout>
      <div className="owner-equipment-page">
        <EquipmentGuide />

        {showNoHotel && (
          <div className="owner-equipment-page__hint">
            {hotelError || 'Tài khoản chưa được gán khách sạn.'}
          </div>
        )}

        {displayError && hotelId && <div className="owner-equipment-page__error">{displayError}</div>}

        {hotelId && !hotelLoading && (
          <div className="owner-equipment-page__repair-actions">
            <button
              type="button"
              className="owner-equipment-page__repair-notify"
              onClick={openRepairDialog}
              disabled={loading}
            >
              Báo bên sửa chữa
            </button>
          </div>
        )}

        {(loading || hotelLoading) && hotelId && (
          <div className="owner-equipment-page__loading">Đang tải…</div>
        )}

        {!loading && !hotelLoading && hotelId && rooms.length === 0 && !displayError && (
          <div className="owner-equipment-page__empty">Chưa có phòng nào trong khách sạn này.</div>
        )}

        {!loading && !hotelLoading && rooms.length > 0 && (
          <div className="owner-equipment-page__columns">
            <div className="owner-equipment-page__column">
              <ul className="owner-equipment-room-list">{leftCol.map((room) => renderRoomCard(room))}</ul>
            </div>
            <div className="owner-equipment-page__column">
              <ul className="owner-equipment-room-list">{rightCol.map((room) => renderRoomCard(room))}</ul>
            </div>
          </div>
        )}
      </div>

      <EquipmentDeleteDialog
        deleteTarget={deleteTarget}
        deleteError={deleteError}
        deleteDialogBusy={deleteDialogBusy}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteEquipment}
      />

      <EquipmentRepairRequestDialog
        isOpen={repairDialogOpen}
        maintenanceEmailDraft={maintenanceContactEmail}
        canEditMaintenanceEmail={false}
        pageLoading={loading}
        brokenList={brokenEquipmentList}
        selectedMap={repairSelectedMap}
        onToggle={toggleRepairSelection}
        onSelectAllBroken={selectAllBrokenInDialog}
        onClearSelection={clearRepairSelection}
        onSend={sendRepairRequest}
        sending={repairSending}
        sendError={repairSendError}
        onClose={closeRepairDialog}
      />
    </StaffLayout>
  );
};

export default StaffEquipmentPage;
