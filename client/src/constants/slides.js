/**
 * Slide Constants
 * Configuration for carousel/slide components
 */
import { IMAGE_PATHS } from './images';

export const DEFAULT_SLIDE_IMAGES = [
  IMAGE_PATHS.SLIDE_1,
  IMAGE_PATHS.SLIDE_2,
  IMAGE_PATHS.SLIDE_3,
];

export const DEFAULT_SLIDE_CONFIG = {
  images: DEFAULT_SLIDE_IMAGES,
  showTitle: true,
  autoPlayInterval: 5000,
  slideHeight: '100%',
  borderRadius: '0',
};

export const SLIDE_CONTENT = {
  title: 'Chào mừng đến với Hotel Booking',
  description: 'Khám phá và đặt phòng tại những khách sạn tốt nhất Việt Nam. Với hơn 1000+ khách sạn chất lượng, chúng tôi cam kết mang đến cho bạn trải nghiệm nghỉ dưỡng tuyệt vời nhất.',
};

