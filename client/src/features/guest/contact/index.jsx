import { GuestLayout } from '@/features/guest/components/layout';
import { ContactContent } from './components/ContactContent';
import './Contact.scss';

/**
 * Guest Contact page feature
 * Contact page for guest users
 */
export const GuestContactPage = () => {
  return (
    <GuestLayout>
      <ContactContent />
    </GuestLayout>
  );
};

export default GuestContactPage;

