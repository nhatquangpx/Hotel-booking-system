import React from 'react';
import { BaseLayout } from '@/features/guest/components/layout';
import './ProfileLayout.scss';

/**
 * ProfileLayout Component
 * Layout for user profile pages
 * Uses BaseLayout to avoid code duplication
 */
const ProfileLayout = ({ children }) => {
  return (
    <BaseLayout className="profile-layout" showNavbarSpacer={false}>
      <div className="profile-content">
        {children}
      </div>
    </BaseLayout>
  );
};

export default ProfileLayout;

