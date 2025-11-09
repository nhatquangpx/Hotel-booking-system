import { GuestLayout } from '@/features/guest/components/layout';
import { AboutContent } from './components/AboutContent';
import './About.scss';

/**
 * Guest About page feature
 * About page for guest users
 */
export const GuestAboutPage = () => {
  return (
    <GuestLayout>
      <AboutContent />
    </GuestLayout>
  );
};

export default GuestAboutPage;

