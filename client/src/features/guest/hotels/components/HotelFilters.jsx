import { useState, useEffect } from 'react';
import { ROOM_TYPE_OPTIONS } from '@/constants/roomTypes';
import './HotelFilters.scss';

/**
 * Hotel Filters component
 * Provides advanced filtering options for hotels
 */
export const HotelFilters = ({ filters, cities, onFilterChange, onAmenityToggle, onClearFilters }) => {
  // Kiểm tra xem có filter nâng cao nào đang được sử dụng không
  const hasAdvancedFilters = 
    filters.minPrice || 
    filters.maxPrice || 
    filters.maxPeople || 
    filters.roomType || 
    (filters.amenities && filters.amenities.length > 0);

  // Tự động mở filter nâng cao nếu có filter đang được sử dụng
  const [isExpanded, setIsExpanded] = useState(hasAdvancedFilters);

  // Cập nhật trạng thái mở rộng khi có filter nâng cao được áp dụng
  useEffect(() => {
    if (hasAdvancedFilters) {
      setIsExpanded(true);
    }
  }, [hasAdvancedFilters]);
  const roomTypes = ROOM_TYPE_OPTIONS;

  // Danh sách tiện ích phòng (facilities) - dựa trên Room model
  const facilitiesOptions = [
    { value: 'TV', label: 'TV' },
    { value: 'Wifi', label: 'WiFi miễn phí' },
    { value: 'Minibar', label: 'Minibar' },
    { value: 'Điều hòa', label: 'Điều hòa' },
    { value: 'Bồn tắm', label: 'Bồn tắm' },
    { value: 'Ban công', label: 'Ban công' },
    { value: 'Két sắt', label: 'Két sắt' },
    { value: 'Bàn làm việc', label: 'Bàn làm việc' },
    { value: 'Tủ lạnh', label: 'Tủ lạnh' },
    { value: 'Máy pha cà phê', label: 'Máy pha cà phê' },
    { value: 'Máy sấy tóc', label: 'Máy sấy tóc' },
    { value: 'Bếp mini', label: 'Bếp mini' },
    { value: 'Hồ bơi', label: 'Hồ bơi' },
    { value: 'Spa', label: 'Spa' },
    { value: 'Phòng gym', label: 'Phòng gym' }
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  }; 
    filters.minPrice || 
    filters.maxPrice || 
    filters.maxPeople || 
    filters.roomType || 
    (filters.amenities && filters.amenities.length > 0);

  return (
    <div className="filter-section">
      <div className="filter-header">
        <h2>Tìm kiếm khách sạn</h2>
        <button className="clear-filters-btn" onClick={onClearFilters}>
          Xóa bộ lọc
        </button>
      </div>
      
      <div className="filter-form">
        {/* Basic Filters - Luôn hiển thị */}
        <div className="filter-group basic-filters">
          <h3>Thông tin cơ bản</h3>
          <div className="filter-grid">
            <div className="filter-item">
              <label htmlFor="name">Tên khách sạn</label>
              <input
                type="text"
                id="name"
                name="name"
                value={filters.name || ''}
                onChange={onFilterChange}
                placeholder="Nhập tên khách sạn..."
              />
            </div>
            <div className="filter-item">
              <label htmlFor="city">Thành phố</label>
              <select
                id="city"
                name="city"
                value={filters.city || ''}
                onChange={onFilterChange}
              >
                <option value="">Tất cả thành phố</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label htmlFor="starRating">Hạng sao</label>
              <select
                id="starRating"
                name="starRating"
                value={filters.starRating || ''}
                onChange={onFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="1">1 Sao</option>
                <option value="2">2 Sao</option>
                <option value="3">3 Sao</option>
                <option value="4">4 Sao</option>
                <option value="5">5 Sao</option>
              </select>
            </div>
          </div>
          
          {/* Toggle Button - Nằm trong phần filter cơ bản */}
          <div className="filter-toggle-container">
            <button 
              className={`filter-toggle-btn ${isExpanded ? 'expanded' : ''}`}
              onClick={toggleExpanded}
              type="button"
            >
              <span className="toggle-text">
                {isExpanded ? 'Thu gọn' : 'Mở rộng bộ lọc'}
              </span>
              <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* Advanced Filters - Có thể mở rộng/thu gọn */}
        <div className={`advanced-filters-container ${isExpanded ? 'expanded' : ''}`}>
          {/* Price Filters */}
          <div className="filter-group">
            <h3>Giá phòng</h3>
            <div className="filter-grid">
              <div className="filter-item">
                <label htmlFor="minPrice">Giá tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice || ''}
                  onChange={onFilterChange}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="filter-item">
                <label htmlFor="maxPrice">Giá tối đa (VNĐ)</label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice || ''}
                  onChange={onFilterChange}
                  placeholder="Không giới hạn"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Room Filters */}
          <div className="filter-group">
            <h3>Thông tin phòng</h3>
            <div className="filter-grid">
              <div className="filter-item">
                <label htmlFor="roomType">Loại phòng</label>
                <select
                  id="roomType"
                  name="roomType"
                  value={filters.roomType || ''}
                  onChange={onFilterChange}
                >
                  <option value="">Tất cả loại phòng</option>
                  {roomTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label htmlFor="maxPeople">Số người tối đa</label>
                <input
                  type="number"
                  id="maxPeople"
                  name="maxPeople"
                  value={filters.maxPeople || ''}
                  onChange={onFilterChange}
                  placeholder="Số người"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Facilities Filters (Tiện ích phòng) */}
          <div className="filter-group">
            <h3>Tiện ích phòng</h3>
            <p className="filter-description">Lọc khách sạn có phòng với các tiện ích sau:</p>
            <div className="amenities-grid">
              {facilitiesOptions.map((facility) => (
                <div key={facility.value} className="amenity-item">
                  <input
                    type="checkbox"
                    id={`facility-${facility.value}`}
                    name="amenities"
                    value={facility.value}
                    checked={filters.amenities?.includes(facility.value) || false}
                    onChange={(e) => onAmenityToggle(facility.value)}
                  />
                  <label htmlFor={`facility-${facility.value}`}>
                    {facility.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

