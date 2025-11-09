/**
 * BaseLayout Component
 * Base layout wrapper that includes Navbar and Footer
 * Used by GuestLayout and ProfileLayout to avoid code duplication
 */
import { Navbar } from '../Navbar';
import Footer from '../Footer';
import './BaseLayout.scss';

const BaseLayout = ({ children, showNavbarSpacer = true, className = '' }) => {
  const layoutClasses = ['base-layout', className].filter(Boolean).join(' ');
  
  return (
    <div className={layoutClasses}>
      <Navbar />
      {showNavbarSpacer && <div className="navbar-spacer"></div>}
      <main className="base-layout-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default BaseLayout;

