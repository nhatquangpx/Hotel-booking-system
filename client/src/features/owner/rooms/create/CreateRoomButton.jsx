import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import { RoomFormDialog } from '../components';
import api from '@/apis';
import './CreateRoomButton.scss';

const CreateRoomButton = ({ onSuccess }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [hotelId, setHotelId] = useState(null);
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

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  const handleSuccess = () => {
    onSuccess?.();
    handleCloseDialog();
  };

  return (
    <>
      <button 
        className="create-room-button"
        onClick={handleOpenDialog}
        title="Tạo phòng mới"
        disabled={loading || !hotelId}
      >
        <FaPlus />
        <span>Tạo phòng mới</span>
      </button>

      <RoomFormDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        hotelId={hotelId}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default CreateRoomButton;

