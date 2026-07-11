import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components';
import Dialog from '@/components/ui/Dialog';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import api from '@/apis';
import { toast } from 'react-toastify';
import { apiErrorMessage, formatDateTime } from '@/shared/utils';
import './CancelAbuseList.scss';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'sanctioned', label: 'Đã cấm' },
  { value: 'dismissed', label: 'Đã bỏ qua' },
  { value: 'all', label: 'Tất cả' },
];

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  sanctioned: 'Đã cấm',
  dismissed: 'Đã bỏ qua',
};

const PAGE_LIMIT = PAGE_SIZE.ADMIN_CONTACT;

const formatMoney = (n) =>
  Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 });

const AdminCancelAbuseListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [config, setConfig] = useState({ threshold: 3, windowDays: 7, defaultSanctionDays: 7 });
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [sanctionDays, setSanctionDays] = useState('7');
  const [adminNote, setAdminNote] = useState('');

  const fetchFlags = useCallback(async (targetPage) => {
    try {
      setLoading(true);
      const data = await api.adminCancelAbuse.getFlags({
        page: targetPage,
        limit: PAGE_LIMIT,
        status: statusFilter,
      });
      setFlags(data.flags || []);
      setPagination(data.pagination || { page: targetPage, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
      setPendingCount(data.pendingCount || 0);
      if (data.config) setConfig(data.config);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể tải danh sách đen'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchFlags(page);
  }, [fetchFlags, page]);

  const openDetail = useCallback(async (id) => {
    try {
      setDetailLoading(true);
      const data = await api.adminCancelAbuse.getFlagById(id);
      setSelected(data);
      setSanctionDays(String(config.defaultSanctionDays || 7));
      setAdminNote('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể tải chi tiết mục danh sách đen'));
    } finally {
      setDetailLoading(false);
    }
  }, [config.defaultSanctionDays]);

  useEffect(() => {
    const flagId = searchParams.get('flagId');
    if (!flagId) return;
    openDetail(flagId);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, openDetail]);

  const closeDetail = () => {
    setSelected(null);
    setAdminNote('');
  };

  const handleReview = async (action) => {
    if (!selected?._id) return;
    try {
      setReviewing(true);
      const payload = {
        action,
        adminNote: adminNote.trim(),
      };
      if (action === 'sanction') {
        payload.sanctionDays = sanctionDays === 'permanent' ? null : Number(sanctionDays);
      }
      const res = await api.adminCancelAbuse.reviewFlag(selected._id, payload);
      toast.success(res.message || 'Đã xử lý');
      closeDetail();
      fetchFlags(page);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể xử lý mục danh sách đen'));
    } finally {
      setReviewing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-cancel-abuse-page">
        <div className="page-toolbar">
          <div className="page-toolbar__info">
            <p className="page-toolbar__hint">
              Khách hủy ≥ {config.threshold} đơn trong {config.windowDays} ngày sẽ được đưa vào danh sách đen để admin xem xét.
            </p>
            {pendingCount > 0 && (
              <span className="pending-pill">{pendingCount} chờ xử lý</span>
            )}
          </div>
          <div className="status-filters" role="tablist">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={statusFilter === f.value ? 'is-active' : ''}
                onClick={() => {
                  setStatusFilter(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Khách</th>
                <th>Số lần hủy</th>
                <th>Cửa sổ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : flags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Không có mục nào trong danh sách đen
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag._id}>
                    <td>
                      <div className="guest-cell">
                        <strong>{flag.guest?.name || '—'}</strong>
                        <span>{flag.guest?.email || ''}</span>
                        <span>{flag.guest?.phone || ''}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{flag.cancelCount}</strong> / {config.windowDays} ngày
                    </td>
                    <td className="muted">
                      {formatDateTime(flag.windowStart)} → {formatDateTime(flag.windowEnd)}
                    </td>
                    <td>
                      <span className={`flag-status flag-status--${flag.status}`}>
                        {STATUS_LABELS[flag.status] || flag.status}
                      </span>
                    </td>
                    <td className="muted">{formatDateTime(flag.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="review-btn"
                        onClick={() => openDetail(flag._id)}
                      >
                        Xem xét
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}

        <Dialog
          isOpen={!!selected || detailLoading}
          onClose={closeDetail}
          title="Xem xét danh sách đen"
          maxWidth="640px"
          className="cancel-abuse-detail-dialog"
        >
          {detailLoading || !selected ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="cancel-abuse-detail">
              <section>
                <h4>Khách</h4>
                <p>
                  <strong>{selected.guest?.name}</strong>
                  <br />
                  {selected.guest?.email} · {selected.guest?.phone}
                </p>
                <p className="muted">
                  Tài khoản:{' '}
                  {selected.guest?.status === 'inactive' ? 'Ngừng hoạt động' : 'Hoạt động'}
                  {selected.guest?.inactiveUntil
                    ? ` (đến ${formatDateTime(selected.guest.inactiveUntil)})`
                    : ''}
                </p>
              </section>

              <section>
                <h4>
                  Đơn đã hủy ({selected.cancelCount} trong {config.windowDays} ngày)
                </h4>
                <ul className="booking-list">
                  {(selected.bookingIds || []).map((b) => {
                    const id = typeof b === 'object' ? b._id : b;
                    const booking = typeof b === 'object' ? b : null;
                    return (
                      <li key={String(id)}>
                        {booking ? (
                          <>
                            <strong>
                              {booking.hotel?.name || 'KS'} · P.
                              {booking.room?.roomNumber || '—'}
                            </strong>
                            <span>
                              {formatDateTime(booking.checkInDate)} →{' '}
                              {formatDateTime(booking.checkOutDate)}
                            </span>
                            <span>
                              Hủy: {formatDateTime(booking.guestCancelRequestedAt)} ·{' '}
                              {formatMoney(booking.finalAmount ?? booking.totalPrice)}₫
                            </span>
                            {booking.cancellationReason && (
                              <span className="muted">{booking.cancellationReason}</span>
                            )}
                          </>
                        ) : (
                          <span>#{String(id).slice(-6).toUpperCase()}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {selected.status === 'pending' ? (
                <section className="review-form">
                  <h4>Quyết định</h4>
                  <label htmlFor="sanctionDays">Thời gian vô hiệu hóa</label>
                  <select
                    id="sanctionDays"
                    value={sanctionDays}
                    onChange={(e) => setSanctionDays(e.target.value)}
                  >
                    <option value="3">3 ngày</option>
                    <option value="7">7 ngày</option>
                    <option value="14">14 ngày</option>
                    <option value="30">30 ngày</option>
                    <option value="permanent">Không thời hạn</option>
                  </select>

                  <label htmlFor="adminNote">Ghi chú (tuỳ chọn)</label>
                  <textarea
                    id="adminNote"
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Lý do xử lý..."
                  />

                  <div className="review-actions">
                    <button
                      type="button"
                      className="btn-dismiss"
                      disabled={reviewing}
                      onClick={() => handleReview('dismiss')}
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="button"
                      className="btn-sanction"
                      disabled={reviewing}
                      onClick={() => handleReview('sanction')}
                    >
                      {reviewing ? 'Đang xử lý...' : 'Vô hiệu hóa tài khoản'}
                    </button>
                  </div>
                </section>
              ) : (
                <section>
                  <h4>Đã xử lý</h4>
                  <p>
                    {STATUS_LABELS[selected.status]}
                    {selected.reviewedBy?.name ? ` bởi ${selected.reviewedBy.name}` : ''}
                    {selected.reviewedAt ? ` · ${formatDateTime(selected.reviewedAt)}` : ''}
                  </p>
                  {selected.adminNote && <p className="muted">{selected.adminNote}</p>}
                  {selected.sanctionUntil && (
                    <p className="muted">
                      Cấm đến: {formatDateTime(selected.sanctionUntil)}
                    </p>
                  )}
                  {selected.status === 'sanctioned' && !selected.sanctionUntil && (
                    <p className="muted">Cấm không thời hạn (mở lại thủ công trong Người dùng)</p>
                  )}
                </section>
              )}
            </div>
          )}
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCancelAbuseListPage;
