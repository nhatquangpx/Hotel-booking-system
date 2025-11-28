import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { RoomFormDialog } from '../components';
import api from '@/apis';
import './EditRoomDialog.scss';

const EditRoomDialog = forwardRef(({ onSuccess }, ref) => {
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [hotelId, setHotelId] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRoomId(null);
  };

  const handleEditSuccess = () => {
    onSuccess?.();
    handleCloseDialog();
  };

  useImperativeHandle(ref, () => ({
    handleEditRoom
  }));

  if (!isDialogOpen || !editingRoomId) return null;

  return (
    <RoomFormDialog
      isOpen={isDialogOpen}
      onClose={handleCloseDialog}
      roomId={editingRoomId}
      hotelId={hotelId}
      onSuccess={handleEditSuccess}
    />
  );
});

export default EditRoomDialog;


