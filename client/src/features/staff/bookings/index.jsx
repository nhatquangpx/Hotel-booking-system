import StaffLayout from '@/features/staff/components/StaffLayout';
import OwnerBookingDetailModal from '@/features/owner/bookings/OwnerBookingDetailModal';
import OwnerBookingActionModal from '@/features/owner/bookings/OwnerBookingActionModal';
import StaffBookingCard from './StaffBookingCard';
import StaffBookingGuide from './components/StaffBookingGuide';
import StaffBookingFilters from './components/StaffBookingFilters';
import StaffBookingProofPreview from './components/StaffBookingProofPreview';
import { useStaffBookings } from './hooks/useStaffBookings';
import '@/features/owner/bookings/BookingList.scss';
import './StaffBookingList.scss';

const StaffBookingsPage = () => {
  const {
    loading,
    error,
    filteredBookings,
    emptyMessage,
    previewProofUrl,
    setPreviewProofUrl,
    showCheckInModal,
    showCheckOutModal,
    showDetailModal,
    selectedBooking,
    processing,
    detailLoading,
    detailBooking,
    filters,
    actions,
  } = useStaffBookings();

  return (
    <StaffLayout>
      <div className="owner-booking-list staff-booking-list">
        <StaffBookingGuide />

        {error && <div className="error-message">{error}</div>}

        {!loading && (
          <StaffBookingFilters
            searchQuery={filters.searchQuery}
            onSearchChange={filters.setSearchQuery}
            showTodayOnly={filters.showTodayOnly}
            onToggleToday={() => filters.setShowTodayOnly((prev) => !prev)}
            todayBookingsCount={filters.todayBookingsCount}
            showPastBookings={filters.showPastBookings}
            onTogglePast={() => filters.setShowPastBookings((prev) => !prev)}
            statusFilter={filters.statusFilter}
            onStatusFilterChange={filters.setStatusFilter}
            methodFilter={filters.methodFilter}
            onMethodFilterChange={filters.setMethodFilter}
            proofFilter={filters.proofFilter}
            onProofFilterChange={filters.setProofFilter}
          />
        )}

        {loading ? (
          <div className="loading-message">Đang tải danh sách đặt phòng...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-message">{emptyMessage}</div>
        ) : (
          <div className="booking-cards">
            {filteredBookings.map((booking) => (
              <StaffBookingCard
                key={booking._id}
                booking={booking}
                onOpenDetail={actions.openDetailModal}
                onOpenCheckIn={actions.openCheckInModal}
                onOpenCheckOut={actions.openCheckOutModal}
                onPreviewProof={setPreviewProofUrl}
              />
            ))}
          </div>
        )}

        <OwnerBookingActionModal
          show={showCheckInModal}
          title="Xác nhận check-in"
          prompt="Bạn có chắc chắn muốn thực hiện check-in cho khách hàng"
          booking={selectedBooking}
          processing={processing}
          confirmText="Xác nhận check-in"
          onConfirm={actions.handleCheckIn}
          onClose={actions.closeModals}
          onPreviewProof={setPreviewProofUrl}
        />

        <OwnerBookingActionModal
          show={showCheckOutModal}
          title="Xác nhận check-out"
          prompt="Bạn có chắc chắn muốn thực hiện check-out cho khách hàng"
          booking={selectedBooking}
          processing={processing}
          confirmText="Xác nhận check-out"
          onConfirm={actions.handleCheckOut}
          onClose={actions.closeModals}
          onPreviewProof={setPreviewProofUrl}
          showCheckedInAt
        />

        <OwnerBookingDetailModal
          show={showDetailModal}
          loading={detailLoading}
          booking={detailBooking}
          onClose={actions.closeDetailModal}
          onPreviewProof={setPreviewProofUrl}
        />

        <StaffBookingProofPreview url={previewProofUrl} onClose={() => setPreviewProofUrl(null)} />
      </div>
    </StaffLayout>
  );
};

export default StaffBookingsPage;
