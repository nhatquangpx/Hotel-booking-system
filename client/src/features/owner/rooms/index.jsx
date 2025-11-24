import React from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { RoomMap } from './components';

/**
 * Owner Room Map Page
 * Displays the room map for hotel owners
 */
const OwnerRoomMapPage = () => {
  return (
    <OwnerLayout>
      <RoomMap />
    </OwnerLayout>
  );
};

export default OwnerRoomMapPage;

