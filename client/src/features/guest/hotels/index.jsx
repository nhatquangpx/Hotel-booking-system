import { GuestLayout } from '@/features/guest/components/layout';
import { HotelFilters, HotelCard, HotelListHeader } from './components';
import { useHotelFilters } from './hooks/useHotelFilters';
import './HotelList.scss';

/**
 * Hotel List feature
 * Displays list of hotels with filtering capabilities
 */
export const GuestHotelListPage = () => {
  const { hotels, cities, filters, loading, error, handleFilterChange } = useHotelFilters();

  return (
    <GuestLayout>
      <div className="hotel-list-container">
        <HotelFilters
          filters={filters}
          cities={cities}
          onFilterChange={handleFilterChange}
        />

        <div className="hotel-list">
          <HotelListHeader filters={filters} />

          {loading && <div className="loading">Đang tải...</div>}

          {error && <div className="error-message">{error}</div>}

          {!loading && !error && Array.isArray(hotels) && hotels.length === 0 && (
            <div className="no-hotels">
              {filters.search || filters.name || filters.city
                ? 'Không tìm thấy khách sạn phù hợp với tiêu chí tìm kiếm'
                : 'Không có khách sạn nào'}
            </div>
          )}

          <div className="hotel-grid">
            {hotels && hotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default GuestHotelListPage;

