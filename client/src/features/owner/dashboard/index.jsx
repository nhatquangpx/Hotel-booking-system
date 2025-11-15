import React from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { OwnerDashboard } from './components/OwnerDashboard';

/**
 * Owner Dashboard Page
 * Main dashboard page for hotel owners
 */
const OwnerDashboardPage = () => {
  return (
    <OwnerLayout>
      <OwnerDashboard />
    </OwnerLayout>
  );
};

export default OwnerDashboardPage;

