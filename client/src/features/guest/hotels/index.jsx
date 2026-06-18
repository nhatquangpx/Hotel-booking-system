import { GuestLayout } from '@/features/guest/components/layout';
import Pagination from '@/shared/components/Pagination/Pagination';
import { HotelFilters, HotelCard, HotelListHeader } from './components';
import { useHotelFilters } from './hooks/useHotelFilters';
import { useGuestWishlist } from '@/features/guest/hooks';
import './HotelList.scss';

/**
 * Hotel List feature
 * Displays list of hotels with filtering capabilities
 */
export const GuestHotelListPage = () => {
  const { applyWishlistedChange, isWishlisted } = useGuestWishlist();

  const {
    hotels,
    cities,
    filters,
    loading,
    error,
    page,
    setPage,
    pagination,
    handleFilterChange,
    handleAmenityToggle,
    clearFilters,
  } = useHotelFilters();

  return (
    <GuestLayout>
      <div className="hotel-list-container">
        <HotelFilters
          filters={filters}
          cities={cities}
          onFilterChange={handleFilterChange}
          onAmenityToggle={handleAmenityToggle}
          onClearFilters={clearFilters}
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
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                isWishlisted={isWishlisted(hotel._id)}
                onWishlistedChange={applyWishlistedChange}
              />
            ))}
          </div>

          {!loading && !error && pagination.total > 0 && (
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
              variant="guest"
              className="hotel-list-pagination"
            />
          )}
        </div>
      </div>
    </GuestLayout>
  );
};

export default GuestHotelListPage;

