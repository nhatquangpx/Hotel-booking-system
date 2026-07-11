export const ADDON_CATEGORY_OPTIONS = [
  { value: 'breakfast', label: 'Ăn sáng' },
  { value: 'lunch', label: 'Ăn trưa' },
  { value: 'dinner', label: 'Ăn tối' },
  { value: 'spa', label: 'Spa / Xông hơi' },
  { value: 'room_service', label: 'Dịch vụ phòng' },
  { value: 'other', label: 'Khác' },
];

export const ADDON_PRICING_UNIT_OPTIONS = [
  { value: 'per_stay', label: 'Cả kỳ lưu trú' },
  { value: 'per_person_per_stay', label: 'Theo người / cả kỳ lưu trú' },
  { value: 'per_night', label: 'Theo đêm' },
  { value: 'per_person_per_night', label: 'Theo người / đêm' },
];

export const formatAddonCategory = (value) =>
  ADDON_CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value || 'Khác';

export const formatAddonPricingUnit = (value) =>
  ADDON_PRICING_UNIT_OPTIONS.find((item) => item.value === value)?.label || value || '';
