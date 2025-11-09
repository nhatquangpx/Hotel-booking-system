import './HotelFilters.scss';

/**
 * Hotel Filters component
 * Provides filtering options for hotels
 */
export const HotelFilters = ({ filters, cities, onFilterChange }) => {
  return (
    <div className="filter-section">
      <h2>Tìm kiếm khách sạn</h2>
      <div className="filter-form">
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
    </div>
  );
};

