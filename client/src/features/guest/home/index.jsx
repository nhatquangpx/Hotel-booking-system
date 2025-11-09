import { GuestLayout } from '@/features/guest/components/layout';
import {
  HeroBanner,
  CategoriesSection,
  FeaturedHotelsSection,
  BenefitsSection,
  TestimonialsSection,
  StatsSection,
  NewsletterSection,
} from './components';
import './HomePage.scss';

/**
 * Home page feature
 * Main landing page with all sections
 */
export const GuestHomePage = () => {
  return (
    <GuestLayout>
      <div className="homepage-content">
        <HeroBanner />
        <CategoriesSection />
        <FeaturedHotelsSection />
        <BenefitsSection />
        <TestimonialsSection />
        <StatsSection />
        <NewsletterSection />
      </div>
    </GuestLayout>
  );
};

export default GuestHomePage;

