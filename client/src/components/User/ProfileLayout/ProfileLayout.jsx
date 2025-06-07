import React from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './ProfileLayout.scss';

const ProfileLayout = ({ children }) => {
  return (
    <div className="profile-layout">
      <Navbar />
      <main className="profile-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default ProfileLayout; 