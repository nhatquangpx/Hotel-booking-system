import React, { useState, useEffect, useCallback } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import { ownerSaleAPI } from '@/apis/owner/sale';
import Dialog from '@/components/ui/Dialog';
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

function SaleForm({ initial, hotelId, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [scope, setScope] = useState(initial?.scope || 'hotel');
  const [roomType, setRoomType] = useState(initial?.roomType || 'standard');
  const [startDate, setStartDate] = useState(initial?.startDate || '');
  const [endDate, setEndDate] = useState(initial?.endDate || '');
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent ?? 15);
  const [isActive, setIsActive] = useState(initial?.isActive !== false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = {
      hotelId,
      title: title.trim(),
      scope,
      startDate,
      endDate,
      discountPercent: Number(discountPercent),
      isActive,
    };
    if (scope === 'room_type') body.roomType = roomType;
    onSubmit(body);
  };

  return (
    <form className="sale-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Tên chương trình</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="Ví dụ: Flash sale tháng 4"
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
          <label>Từ ngày</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Đến ngày</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>
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
      {initial && (
        <div className="form-group">
          <label>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Đang kích hoạt
          </label>
        </div>
      )}
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

/**
 * Trang quản lý chương trình sale (giảm % theo thời gian, phạm vi KS hoặc loại phòng)
 */
const OwnerSalePage = () => {
  const { selectedHotelId: hotelId, loading: hotelsLoading, hotels } = useOwnerHotel();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    type: null,
    sale: null,
  });

  const fetchSales = useCallback(async () => {
    if (hotelsLoading) {
      return;
    }
    if (!hotelId) {
      setSales([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ownerSaleAPI.list(hotelId);
      setSales(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Không tải được danh sách sale';
      setError(msg);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelsLoading]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };

  const handleFormSubmit = async (body) => {
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        await ownerSaleAPI.update(editing._id, body);
      } else {
        await ownerSaleAPI.create(body);
      }
      setModalOpen(false);
      setEditing(null);
      await fetchSales();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Không lưu được';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (sale) => {
    setConfirmState({ isOpen: true, type: 'deactivate', sale });
  };

  const handleActivate = async (sale) => {
    setConfirmState({ isOpen: true, type: 'activate', sale });
  };

  const closeConfirmModal = () => {
    if (submitting) return;
    setConfirmState({ isOpen: false, type: null, sale: null });
  };

  const handleConfirmAction = async () => {
    const { sale, type } = confirmState;
    if (!sale || !type) return;

    setError(null);
    setSubmitting(true);
    try {
      if (type === 'deactivate') {
        await ownerSaleAPI.deactivate(sale._id);
      } else {
        await ownerSaleAPI.update(sale._id, { isActive: true });
      }
      await fetchSales();
      closeConfirmModal();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        (type === 'deactivate' ? 'Không tắt được' : 'Không bật lại được');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="owner-sale-page">
        <div className="page-header">
          <div className="sale-guide-card">
            <div className="sale-guide-card__intro">
              <h3>Cách dùng chương trình sale</h3>
              <p className="page-desc">
                Tạo khuyến mãi theo thời gian cho toàn khách sạn hoặc từng loại phòng. Khi chương trình còn hiệu
                lực, khách sẽ thấy ngay giá gốc, giá sau giảm và nhãn phần trăm ưu đãi trên danh sách phòng.
              </p>
            </div>
            <div className="sale-guide-grid">
              <div className="sale-guide-item">
                <span className="sale-guide-item__step">1</span>
                <div>
                  <strong>Chọn phạm vi áp dụng</strong>
                  <p>Tạo sale cho toàn khách sạn hoặc chỉ một loại phòng cụ thể.</p>
                </div>
              </div>
              <div className="sale-guide-item">
                <span className="sale-guide-item__step">2</span>
                <div>
                  <strong>Đặt tên dễ nhớ cho chương trình</strong>
                  <p>Đặt tên ngắn gọn để bạn dễ nhận ra từng đợt khuyến mãi khi xem lại danh sách.</p>
                </div>
              </div>
              <div className="sale-guide-item">
                <span className="sale-guide-item__step">3</span>
                <div>
                  <strong>Đặt thời gian và mức giảm</strong>
                  <p>Nhập ngày bắt đầu, ngày kết thúc và phần trăm ưu đãi muốn áp dụng.</p>
                </div>
              </div>
              <div className="sale-guide-item">
                <span className="sale-guide-item__step">4</span>
                <div>
                  <strong>Giá giảm được áp dụng tự động</strong>
                  <p>Khi khách đặt phòng, hệ thống sẽ tự lấy đúng mức giá ưu đãi còn hiệu lực.</p>
                </div>
              </div>
            </div>
            <div className="sale-guide-note">
              <strong>Lưu ý:</strong> nếu có nhiều chương trình cùng chồng thời gian, hệ thống sẽ tự chọn mức giảm
              cao nhất cho từng đêm.
            </div>
          </div>
        </div>

        <div className="sale-toolbar">
          <div className="sale-toolbar-meta">
            <span className="meta-item">
              Tổng chương trình: <strong>{sales.length}</strong>
            </span>
            <span className="meta-item">
              Đang hoạt động: <strong>{sales.filter((s) => s.isActive).length}</strong>
            </span>
          </div>
          <button type="button" className="btn-primary" onClick={openCreate} disabled={!hotelId}>
            + Thêm chương trình
          </button>
        </div>

        {error && <div className="state-msg state-msg--error">{error}</div>}
        {(hotelsLoading || loading) && <div className="state-msg">Đang tải...</div>}
        {!hotelsLoading && !loading && hotels.length === 0 && (
          <div className="state-msg">Bạn chưa có khách sạn.</div>
        )}
        {!hotelsLoading && !loading && hotelId && sales.length === 0 && !error && (
          <div className="state-msg">Chưa có chương trình sale nào.</div>
        )}

        {!hotelsLoading && !loading && sales.length > 0 && (
          <div className="sale-table-wrap">
            <table className="sale-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Tên</th>
                  <th>Phạm vi</th>
                  <th>Loại</th>
                  <th>Giảm</th>
                  <th>Trạng thái</th>
                  <th className="cell-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="time-range">
                        <span>{s.startDate}</span>
                        <span className="time-sep">→</span>
                        <span>{s.endDate}</span>
                      </div>
                    </td>
                    <td>
                      <div className="sale-title-cell">
                        <strong>{s.title}</strong>
                      </div>
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
                      <span className={`status-pill ${s.isActive ? 'status-pill--active' : 'status-pill--inactive'}`}>
                        {s.isActive ? 'Hoạt động' : 'Tạm tắt'}
                      </span>
                    </td>
                    <td className="sale-row-actions">
                      <button type="button" className="action-btn action-btn--edit" onClick={() => openEdit(s)}>
                        Sửa
                      </button>
                      {s.isActive && (
                        <button
                          type="button"
                          className="action-btn action-btn--danger"
                          onClick={() => handleDeactivate(s)}
                        >
                          Vô hiệu
                        </button>
                      )}
                      {!s.isActive && (
                        <button
                          type="button"
                          className="action-btn action-btn--success"
                          onClick={() => handleActivate(s)}
                        >
                          Bật lại
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog
          isOpen={modalOpen}
          onClose={() => !submitting && setModalOpen(false)}
          title={editing ? 'Sửa chương trình sale' : 'Chương trình sale mới'}
          maxWidth="520px"
        >
          {hotelId && (
            <SaleForm
              hotelId={hotelId}
              initial={editing}
              onSubmit={handleFormSubmit}
              onCancel={() => !submitting && setModalOpen(false)}
              submitting={submitting}
            />
          )}
        </Dialog>

        <Dialog
          isOpen={confirmState.isOpen}
          onClose={closeConfirmModal}
          title={
            confirmState.type === 'deactivate'
              ? 'Xác nhận tắt chương trình'
              : 'Xác nhận bật lại chương trình'
          }
          maxWidth="460px"
        >
          <div className="confirm-box">
            <p>
              {confirmState.type === 'deactivate'
                ? 'Bạn có chắc muốn tắt chương trình sale này không?'
                : 'Bạn có chắc muốn bật lại chương trình sale này không?'}
            </p>
            <p className="confirm-box__title">
              <strong>{confirmState.sale?.title || ''}</strong>
            </p>
            <div className="confirm-box__actions">
              <button type="button" className="btn-secondary" onClick={closeConfirmModal} disabled={submitting}>
                Hủy
              </button>
              <button
                type="button"
                className={`btn-primary ${confirmState.type === 'deactivate' ? 'btn-danger' : ''}`}
                onClick={handleConfirmAction}
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : confirmState.type === 'deactivate' ? 'Xác nhận tắt' : 'Xác nhận bật'}
              </button>
            </div>
          </div>
        </Dialog>
      </div>
    </OwnerLayout>
  );
};

export default OwnerSalePage;
