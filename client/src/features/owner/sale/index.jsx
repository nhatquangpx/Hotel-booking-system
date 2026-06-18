import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import OwnerLayout from '../components/OwnerLayout';
import OwnerGuideCollapsible from '../components/OwnerGuideCollapsible';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import { ownerSaleAPI } from '@/apis/owner/sale';
import Dialog from '@/components/ui/Dialog';
import { saleStatusDisplay, countOpenSales, vnTodayYmd } from './saleUtils';
import './SalePage.scss';

const ROOM_TYPES = [
  { value: 'standard', label: 'Tiêu chuẩn' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Gia đình' },
  { value: 'executive', label: 'Executive' },
];

const scopeLabel = (s) => (s.scope === 'hotel' ? 'Toàn khách sạn' : 'Theo loại phòng');
const roomTypeLabel = (value) => ROOM_TYPES.find((r) => r.value === value)?.label || value || '—';

function SaleForm({ initial, hotelId, onSubmit, onCancel, submitting, submitError }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [scope, setScope] = useState(initial?.scope || 'hotel');
  const [roomType, setRoomType] = useState(initial?.roomType || 'standard');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent ?? 15);
  const [formError, setFormError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Tên chương trình không được để trống');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc');
      return;
    }
    if (endDate < startDate) {
      setFormError('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
      return;
    }
    const pct = Number(discountPercent);
    if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
      setFormError('Phần trăm giảm giá phải từ 1 đến 100');
      return;
    }
    if (scope === 'room_type' && !roomType) {
      setFormError('Vui lòng chọn loại phòng');
      return;
    }

    const body = {
      hotelId,
      title: title.trim(),
      scope,
      startDate,
      endDate,
      discountPercent: Number(discountPercent),
    };
    if (scope === 'room_type') body.roomType = roomType;
    if (initial) body.isActive = initial.isOpen ?? initial.isActive !== false;
    onSubmit(body);
  };

  const displayError = formError || submitError;

  return (
    <form className="sale-form" onSubmit={handleSubmit}>
      {displayError && (
        <div className="sale-form-error" role="alert">
          {displayError}
        </div>
      )}
      <div className="form-group form-group--title">
        <label htmlFor="sale-title">Tên chương trình</label>
        <input
          id="sale-title"
          type="text"
          className="sale-form-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="Ví dụ: Sale 2/5–12/5"
        />
      </div>
      <div className="form-group">
        <label>Phạm vi</label>
        <div className="sale-scope-options">
          <label>
            <input
              type="radio"
              name="scope"
              checked={scope === 'hotel'}
              onChange={() => setScope('hotel')}
            />
            Toàn khách sạn
          </label>
          <label>
            <input
              type="radio"
              name="scope"
              checked={scope === 'room_type'}
              onChange={() => setScope('room_type')}
            />
            Theo loại phòng
          </label>
        </div>
      </div>
      {scope === 'room_type' && (
        <div className="form-group">
          <label>Loại phòng</label>
          <select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
            {ROOM_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-row">
        <div className="form-group">
          <label>Lưu trú từ ngày</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Lưu trú đến ngày</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>
      <p className="sale-form-hint">
        Giảm theo từng đêm ở trong khoảng này. Sau ngày kết thúc, chương trình tự đóng và các đêm từ ngày sau đó
        tính giá mặc định.
      </p>
      <div className="form-group">
        <label>Giảm giá (%)</label>
        <input
          type="number"
          min={1}
          max={100}
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          required
        />
      </div>
      <div className="sale-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Tạo'}
        </button>
      </div>
    </form>
  );
}

const OwnerSalePage = () => {
  const { selectedHotelId: hotelId, loading: hotelsLoading, hotels } = useOwnerHotel();
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.OWNER_SALES,
    total: 0,
    totalPages: 1,
  });
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [pendingToggle, setPendingToggle] = useState(null);

  const fetchOpenCount = useCallback(async () => {
    if (!hotelId) {
      setOpenCount(0);
      return;
    }
    try {
      const result = await ownerSaleAPI.list({ hotelId, all: true });
      setOpenCount(countOpenSales(result.items || []));
    } catch {
      setOpenCount(0);
    }
  }, [hotelId]);

  const fetchSales = useCallback(async (targetPage = page) => {
    if (hotelsLoading) return;
    if (!hotelId) {
      setSales([]);
      setPagination({ page: 1, limit: PAGE_SIZE.OWNER_SALES, total: 0, totalPages: 1 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await ownerSaleAPI.list({
        hotelId,
        page: targetPage,
        limit: PAGE_SIZE.OWNER_SALES,
      });
      setSales(result.items || []);
      setPagination(result.pagination);
      setPage(targetPage);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không tải được danh sách sale');
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelsLoading, page]);

  useEffect(() => {
    setPage(1);
  }, [hotelId]);

  useEffect(() => {
    fetchSales(page);
  }, [fetchSales, page, hotelId]);

  useEffect(() => {
    fetchOpenCount();
  }, [fetchOpenCount]);

  const handleFormSubmit = async (body) => {
    setSubmitting(true);
    setError(null);
    setSubmitError(null);
    try {
      if (editing) {
        await ownerSaleAPI.update(editing._id, body);
        toast.success('Đã cập nhật chương trình sale');
      } else {
        await ownerSaleAPI.create(body);
        toast.success('Đã tạo chương trình sale');
      }
      setModalOpen(false);
      setEditing(null);
      setSubmitError(null);
      await fetchSales(page);
      await fetchOpenCount();
    } catch (e) {
      const msg = e?.message || 'Không lưu được chương trình sale';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!pendingToggle) return;
    const { sale, open } = pendingToggle;
    setSubmitting(true);
    setError(null);
    try {
      await ownerSaleAPI.setStatus(sale._id, open);
      setPendingToggle(null);
      await fetchSales(page);
      await fetchOpenCount();
      toast.success(open ? 'Đã mở chương trình sale' : 'Đã đóng chương trình sale');
    } catch (e) {
      const msg = e?.message || 'Không đổi trạng thái được';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="owner-sale-page">
        <div className="page-header">
          <OwnerGuideCollapsible label="Hướng dẫn chương trình sale — bấm để xem">
            <div className="sale-guide-card">
              <div className="sale-guide-card__intro">
                <h3>Chương trình sale theo ngày lưu trú</h3>
                <p className="page-desc">
                  Chỉ các <strong>đêm ở</strong> trong khoảng bạn chọn được giảm. Kỳ đặt trải cả đêm sale và không
                  sale → hệ thống tính hai mức giá rồi cộng một tổng. Sau ngày kết thúc, chương trình{' '}
                  <strong>đóng</strong> — đêm từ ngày sau đó giá mặc định.
                </p>
              </div>
              <div className="sale-guide-note">
                <strong>Ví dụ:</strong> sale 2/5–12/5 → đêm 2–12/5 giảm; đơn ở 13/5 trở đi không sale. Nhiều chương
                trình chồng nhau → mỗi đêm lấy % cao nhất.
              </div>
            </div>
          </OwnerGuideCollapsible>
        </div>

        <div className="sale-toolbar">
          <div className="sale-toolbar-meta">
            <span className="meta-item">
              Tổng: <strong>{pagination.total}</strong>
            </span>
            <span className="meta-item">
              Đang mở: <strong>{openCount}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setSubmitError(null);
              setModalOpen(true);
            }}
            disabled={!hotelId}
          >
            + Thêm chương trình
          </button>
        </div>

        {error && <div className="state-msg state-msg--error">{error}</div>}
        {(hotelsLoading || loading) && <div className="state-msg">Đang tải...</div>}
        {!hotelsLoading && !loading && hotels.length === 0 && (
          <div className="state-msg">Bạn chưa có khách sạn.</div>
        )}
        {!hotelsLoading && !loading && hotelId && pagination.total === 0 && !error && (
          <div className="state-msg">Chưa có chương trình sale nào.</div>
        )}

        {!hotelsLoading && !loading && sales.length > 0 && (
          <div className="sale-table-wrap">
            <table className="sale-table">
              <thead>
                <tr>
                  <th>Ngày lưu trú</th>
                  <th>Tên</th>
                  <th>Phạm vi</th>
                  <th>Loại</th>
                  <th>Giảm</th>
                  <th>Trạng thái</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const status = saleStatusDisplay(s);
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="time-range">
                          <span>{s.startDate}</span>
                          <span className="time-sep">→</span>
                          <span>{s.endDate}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{s.title}</strong>
                      </td>
                      <td>
                        <span className={`scope-chip ${s.scope === 'hotel' ? 'scope-chip--hotel' : 'scope-chip--type'}`}>
                          {scopeLabel(s)}
                        </span>
                      </td>
                      <td>{s.scope === 'room_type' ? roomTypeLabel(s.roomType) : 'Tất cả loại phòng'}</td>
                      <td>
                        <span className="discount-badge">-{s.discountPercent}%</span>
                      </td>
                      <td>
                        <span className={`status-pill ${status.pillClass}`}>{status.label}</span>
                      </td>
                      <td className="sale-row-actions">
                        <button
                          type="button"
                          className="action-btn action-btn--edit"
                          onClick={() => {
                            setEditing(s);
                            setSubmitError(null);
                            setModalOpen(true);
                          }}
                        >
                          Sửa
                        </button>
                        {s.isOpen ? (
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            onClick={() => setPendingToggle({ sale: s, open: false })}
                          >
                            Đóng
                          </button>
                        ) : (
                          s.endDate >= vnTodayYmd() && (
                            <button
                              type="button"
                              className="action-btn action-btn--success"
                              onClick={() => setPendingToggle({ sale: s, open: true })}
                            >
                              Mở
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!hotelsLoading && !loading && pagination.total > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
            variant="center"
            className="sale-pagination"
          />
        )}

        <Dialog
          isOpen={modalOpen}
          onClose={() => {
            if (!submitting) {
              setModalOpen(false);
              setSubmitError(null);
            }
          }}
          title={editing ? 'Sửa chương trình sale' : 'Chương trình sale mới'}
          maxWidth="600px"
        >
          {hotelId && (
            <SaleForm
              hotelId={hotelId}
              initial={editing}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                if (!submitting) {
                  setModalOpen(false);
                  setSubmitError(null);
                }
              }}
              submitting={submitting}
              submitError={submitError}
            />
          )}
        </Dialog>

        <Dialog
          isOpen={!!pendingToggle}
          onClose={() => !submitting && setPendingToggle(null)}
          title={pendingToggle?.open ? 'Mở chương trình' : 'Đóng chương trình'}
          maxWidth="460px"
        >
          <div className="confirm-box">
            <p>
              {pendingToggle?.open
                ? 'Bật lại chương trình sale này?'
                : 'Đóng chương trình? Các đêm lưu trú sau đó sẽ không còn giảm giá.'}
            </p>
            <p className="confirm-box__title">
              <strong>{pendingToggle?.sale?.title || ''}</strong>
            </p>
            <div className="confirm-box__actions">
              <button type="button" className="btn-secondary" onClick={() => setPendingToggle(null)} disabled={submitting}>
                Hủy
              </button>
              <button
                type="button"
                className={`btn-primary ${pendingToggle?.open ? '' : 'btn-danger'}`}
                onClick={handleConfirmToggle}
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : pendingToggle?.open ? 'Mở' : 'Đóng'}
              </button>
            </div>
          </div>
        </Dialog>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSalePage;

