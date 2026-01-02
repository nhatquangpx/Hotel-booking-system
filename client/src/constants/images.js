// Image path constants
const ASSETS_BASE = '/assets';

export const IMAGE_PATHS = {
  // Logos
  LOGO_VERTICAL: `${ASSETS_BASE}/logo_vertical.png`,
  LOGO_HORIZONTAL: `${ASSETS_BASE}/logo_horizontal.png`,
  LOGO_VERTICAL_WHITE: `${ASSETS_BASE}/logo_vertical.png`,
  LOGO_HORIZONTAL_WHITE: `${ASSETS_BASE}/logo_horizontal.png`,
  // Default images
  DEFAULT_PROFILE: `${ASSETS_BASE}/default-profile.jpg`,
  QR_CODE: `${ASSETS_BASE}/qr-code.png`,
  
  // Slides
  SLIDE_1: `${ASSETS_BASE}/slide1.jpg`,
  SLIDE_2: `${ASSETS_BASE}/slide2.jpg`,
  SLIDE_3: `${ASSETS_BASE}/slide3.jpg`,
  
  // Testimonials
  TESTIMONIAL_1: `${ASSETS_BASE}/fb1.jpg`,
  TESTIMONIAL_2: `${ASSETS_BASE}/fb2.jpg`,
  TESTIMONIAL_3: `${ASSETS_BASE}/fb3.jpg`,
  
  // About
  ABOUT: `${ASSETS_BASE}/about.jpg`,
  ABOUT_MISSION: `${ASSETS_BASE}/about-mission.jpg`,
  VALUE: `${ASSETS_BASE}/value.jpg`,
  CONTACT_BG: `${ASSETS_BASE}/contact-bg.jpg`,
  
  // Team
  TEAM_MEMBER_1: `${ASSETS_BASE}/team-member1.jpg`,
  TEAM_MEMBER_2: `${ASSETS_BASE}/team-member2.jpg`,
  TEAM_MEMBER_3: `${ASSETS_BASE}/team-member3.jpg`,
  
  // Cities
  HANOI: `${ASSETS_BASE}/hanoi.jpg`,
  HOCHIMINH: `${ASSETS_BASE}/hochiminh.jpg`,
  DANANG: `${ASSETS_BASE}/danang.jpg`,
  HAIPHONG: `${ASSETS_BASE}/haiphong.jpg`,
  NHATRANG: `${ASSETS_BASE}/nhatrang.jpg`,
  PHUQUOC: `${ASSETS_BASE}/phuquoc.jpg`,
  
  // Room types
  SINGLE_ROOM: `${ASSETS_BASE}/single_room.jpg`,
  DOUBLE_ROOM: `${ASSETS_BASE}/double_room.jpg`,
  FAMILY_ROOM: `${ASSETS_BASE}/family_room.jpg`,
  LUXURY_ROOM: `${ASSETS_BASE}/luxury_room.jpg`,
};

// Helper function to get full image URL from API
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${import.meta.env.VITE_API_URL}${imagePath}`;
};

