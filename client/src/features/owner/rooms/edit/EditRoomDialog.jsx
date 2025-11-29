import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { RoomFormDialog } from '../components';
import UpdateRoomStatusDialog from './UpdateRoomStatusDialog';
import DeleteRoomDialog from './DeleteRoomDialog';
import api from '@/apis';
import './EditRoomDialog.scss';

const EditRoomDialog = forwardRef(({ onSuccess }, ref) => {
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [hotelId, setHotelId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    fetchHotelId();
  }, []);

  const fetchHotelId = async () => {
    try {
      setLoading(true);
      const hotels = await api.ownerHotel.getOwnerHotels();
      
      if (hotels && hotels.length > 0) {
        const firstHotelId = hotels[0]._id || hotels[0].id;
        setHotelId(firstHotelId);
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    const roomId = room._id || room.id;
    setEditingRoomId(roomId);
    setCurrentRoom(room);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = (room) => {
    setCurrentRoom(room);
    setIsStatusDialogOpen(true);
  };

  const handleDeleteRoom = (room) => {
    setCurrentRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoomId(null);
    setCurrentRoom(null);
  };

  const handleCloseStatusDialog = () => {
    setIsStatusDialogOpen(false);
    setCurrentRoom(null);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setCurrentRoom(null);
  };

  const handleEditSuccess = () => {
    onSuccess?.();
    handleCloseDialog();
  };

  const handleStatusUpdateSuccess = () => {
    onSuccess?.();
    handleCloseStatusDialog();
  };

  const handleDeleteSuccess = () => {
    onSuccess?.();
    handleCloseDeleteDialog();
  };

  useImperativeHandle(ref, () => ({
    handleEditRoom,
    handleUpdateStatus,
    handleDeleteRoom
  }));

  return (
    <>
      {isDialogOpen && editingRoomId && (
        <RoomFormDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          roomId={editingRoomId}
          hotelId={hotelId}
          onSuccess={handleEditSuccess}
        />
      )}

      <UpdateRoomStatusDialog
        room={currentRoom}
        isOpen={isStatusDialogOpen}
        onClose={handleCloseStatusDialog}
        onSuccess={handleStatusUpdateSuccess}
      />

      <DeleteRoomDialog
        room={currentRoom}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
});

export default EditRoomDialog;


