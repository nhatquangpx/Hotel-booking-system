import StaffLayout from '@/features/staff/components/StaffLayout';
import { FaClipboardCheck, FaList } from 'react-icons/fa';
import OwnerBookingDetailModal from '@/features/owner/bookings/OwnerBookingDetailModal';
import OwnerBookingActionModal from '@/features/owner/bookings/OwnerBookingActionModal';
import StaffBookingCard from './StaffBookingCard';
import StaffBookingGuide from './components/StaffBookingGuide';
import StaffBookingFilters from './components/StaffBookingFilters';
import StaffBookingActionFilters from './components/StaffBookingActionFilters';
import StaffBookingProofPreview from './components/StaffBookingProofPreview';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import { useStaffBookings } from './hooks/useStaffBookings';
import '@/features/owner/bookings/BookingList.scss';
import './StaffBookingList.scss';

const StaffBookingsPage = () => {
  const {
    loading,
    error,
    viewMode,
    actionCounts,
    actionBookings,
    actionPagination,
    filteredBookings,
    allPagination,
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
    handleViewModeChange,
    actionFilters,
    filters,
    actions,
  } = useStaffBookings();

  const renderCard = (booking, { highlightAction = false, showActionBadge = false } = {}) => (
    <StaffBookingCard
      key={booking._id}
      booking={booking}
      highlightAction={highlightAction}
      showActionBadge={showActionBadge}
      onOpenDetail={actions.openDetailModal}
      onOpenCheckIn={actions.openCheckInModal}
      onOpenCheckOut={actions.openCheckOutModal}
      onPreviewProof={setPreviewProofUrl}
    />
  );

  return (
    <StaffLayout>
      <div className="owner-booking-list staff-booking-list">
        <StaffBookingGuide />

        {error && <div className="error-message">{error}</div>}

        {!loading && (
          <div className="booking-view-tabs" role="tablist" aria-label="Chế độ xem đơn đặt phòng">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'action'}
              className={`booking-view-tab ${viewMode === 'action' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('action')}
            >
              <FaClipboardCheck aria-hidden />
              <span>Cần xử lý</span>
              {actionCounts.total > 0 && (
                <span className="booking-view-tab__count">{actionCounts.total}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'all'}
              className={`booking-view-tab ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('all')}
            >
              <FaList aria-hidden />
              <span>Tất cả đơn</span>
            </button>
          </div>
        )}

        {!loading && viewMode === 'action' && (
          <StaffBookingActionFilters
            search={actionFilters.search}
            onSearchChange={actionFilters.setSearch}
            type={actionFilters.type}
            onTypeChange={actionFilters.setType}
          />
        )}

        {!loading && viewMode === 'all' && (
          <StaffBookingFilters
            searchQuery={filters.searchQuery}
            onSearchChange={filters.setSearchQuery}
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
        ) : viewMode === 'action' ? (
          actionPagination.total === 0 ? (
            <div className="empty-message">{emptyMessage}</div>
          ) : (
            <>
              <div className="booking-cards staff-booking-action-cards">
                {actionBookings.map((booking) => renderCard(booking, { highlightAction: true }))}
              </div>
              <Pagination
                page={actionPagination.page}
                totalPages={actionPagination.totalPages}
                total={actionPagination.total}
                pageSize={PAGE_SIZE.STAFF_BOOKINGS}
                onPageChange={actionPagination.setPage}
                variant="center"
                className="booking-list-pagination"
              />
            </>
          )
        ) : allPagination.total === 0 ? (
          <div className="empty-message">{emptyMessage}</div>
        ) : (
          <>
            <div className="booking-cards">
              {filteredBookings.map((booking) =>
                renderCard(booking, {
                  showActionBadge: actions.bookingNeedsStaffAction(booking),
                })
              )}
            </div>
            <Pagination
              page={allPagination.page}
              totalPages={allPagination.totalPages}
              total={allPagination.total}
              pageSize={PAGE_SIZE.STAFF_BOOKINGS}
              onPageChange={allPagination.setPage}
              variant="center"
              className="booking-list-pagination"
            />
          </>
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
