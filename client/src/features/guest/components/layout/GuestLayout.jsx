import BaseLayout from './BaseLayout';
import './GuestLayout.scss';

/**
 * Layout component for guest pages
 * Provides consistent layout with Navbar and Footer
 * Uses BaseLayout to avoid code duplication
 */
export const GuestLayout = ({ children }) => {
  return (
    <BaseLayout className="guest-layout" showNavbarSpacer={true}>
      {children}
    </BaseLayout>
  );
};

export default GuestLayout;

