import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import {
  ADDON_CATEGORY_OPTIONS,
  ADDON_PRICING_UNIT_OPTIONS,
  formatAddonCategory,
  formatAddonPricingUnit,
} from '@/constants/addonServices';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import './AddonServicesPage.scss';

function AddonForm({ initial, onSubmit, onCancel, submitting, submitError }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [category, setCategory] = useState(initial?.category || 'other');
  const [pricingUnit, setPricingUnit] = useState(initial?.pricingUnit || 'per_stay');
  const [formError, setFormError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Tên dịch vụ không được để trống');
      return;
    }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setFormError('Giá phải là số không âm');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category,
      pricingUnit,
      isActive: initial?.isActive !== false,
    });
  };

  const displayError = formError || submitError;

  return (
    <form className="addon-form" onSubmit={handleSubmit}>
      {displayError ? (
        <div className="addon-form-error" role="alert">
          {displayError}
        </div>
      ) : null}
      <div className="form-group form-group--title">
        <label htmlFor="addon-name">Tên dịch vụ</label>
        <input
          id="addon-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
          placeholder="Ví dụ: Buffet sáng"
        />
      </div>
      <div className="form-group">
        <label htmlFor="addon-desc">Mô tả</label>
        <textarea
          id="addon-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Mô tả ngắn cho khách"
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="addon-price">Giá (VNĐ)</label>
          <input
            id="addon-price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="addon-category">Loại</label>
          <select id="addon-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {ADDON_CATEGORY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="addon-unit">Cách tính giá</label>
        <select id="addon-unit" value={pricingUnit} onChange={(e) => setPricingUnit(e.target.value)}>
          {ADDON_PRICING_UNIT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="addon-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Hủy
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Tạo dịch vụ'}
        </button>
      </div>
    </form>
  );
}

export default function AddonServicesPage({
  Layout,
  hotelId,
  addonApi,
  roleLabel = 'khách sạn',
  guideLabel = 'Hướng dẫn dịch vụ đi kèm — bấm để xem',
}) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const loadAddons = useCallback(async () => {
    if (!hotelId) {
      setAddons([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { items, pagination } = await addonApi.list({
        hotelId,
        page,
        limit: PAGE_SIZE.OWNER_SALES,
      });
      setAddons(items || []);
      setTotalPages(pagination?.pages || 1);
      setTotal(pagination?.total || items?.length || 0);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Không tải được dịch vụ');
      setAddons([]);
    } finally {
      setLoading(false);
    }
  }, [addonApi, hotelId, page]);

  useEffect(() => {
    setPage(1);
  }, [hotelId]);

  useEffect(() => {
    loadAddons();
  }, [loadAddons]);

  const openCreate = () => {
    setEditing(null);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const openEdit = (addon) => {
    setEditing(addon);
    setSubmitError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (body) => {
    if (!hotelId) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      if (editing) {
        await addonApi.update(editing._id, body);
        toast.success('Đã cập nhật dịch vụ');
      } else {
        await addonApi.create({ ...body, hotelId });
        toast.success('Đã tạo dịch vụ mới');
      }
      setDialogOpen(false);
      await loadAddons();
    } catch (err) {
      setSubmitError(typeof err === 'string' ? err : err?.message || 'Không lưu được dịch vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (addon) => {
    try {
      await addonApi.setStatus(addon._id, !addon.isActive);
      toast.success(addon.isActive ? 'Đã tắt dịch vụ' : 'Đã bật dịch vụ');
      await loadAddons();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Không đổi trạng thái được');
    }
  };

  return (
    <Layout>
      <div className="owner-addon-page">
        <div className="page-header">
          <OwnerGuideCollapsible label={guideLabel}>
            <div className="addon-guide-card">
              <div className="addon-guide-card__intro">
                <h3>Hướng dẫn quản lý dịch vụ đi kèm</h3>
                <p className="page-desc">
                  Dịch vụ đi kèm là các khoản khách có thể mua thêm trong lúc đặt phòng như ăn sáng,
                  ăn trưa, ăn tối, spa hoặc dịch vụ phòng. Hệ thống sẽ tự cộng tiền dịch vụ vào đơn.
                </p>
              </div>
              <div className="addon-guide-grid">
                <div className="addon-guide-item">
                  <span className="addon-guide-item__step">1</span>
                  <div>
                    <strong>Tạo dịch vụ rõ ràng</strong>
                    <p>
                      Đặt tên dễ hiểu, mô tả ngắn gọn, chọn đúng loại và giá để khách nhận biết ngay
                      khi đặt phòng.
                    </p>
                  </div>
                </div>
                <div className="addon-guide-item">
                  <span className="addon-guide-item__step">2</span>
                  <div>
                    <strong>Chọn cách tính phù hợp</strong>
                    <p>
                      Dùng theo kỳ lưu trú cho dịch vụ một lần, theo đêm cho dịch vụ lặp lại mỗi đêm,
                      hoặc theo người/đêm khi giá phụ thuộc số khách thực tế.
                    </p>
                  </div>
                </div>
                <div className="addon-guide-item">
                  <span className="addon-guide-item__step">3</span>
                  <div>
                    <strong>Bật hoặc tạm tắt linh hoạt</strong>
                    <p>
                      Khi tạm hết dịch vụ hoặc chưa muốn bán, hãy dùng nút bật/tắt thay vì xóa để giữ
                      lịch sử và thao tác nhanh hơn.
                    </p>
                  </div>
                </div>
              </div>
              <div className="addon-guide-note">
                <strong>Gợi ý:</strong> nên ưu tiên các dịch vụ khách thường mua kèm như buffet sáng,
                đón sân bay, giặt ủi hoặc spa để tăng giá trị mỗi đơn đặt phòng.
              </div>
            </div>
          </OwnerGuideCollapsible>
        </div>
        <div className="addon-toolbar">
          <div>
            <h2 style={{ margin: '0 0 0.35rem' }}>Dịch vụ đi kèm</h2>
            <p className="page-desc">
              Quản lý các dịch vụ khách có thể mua kèm khi đặt phòng tại {roleLabel} (ăn sáng, spa, v.v.).
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={openCreate} disabled={!hotelId}>
            Thêm dịch vụ
          </button>
        </div>

        {!hotelId ? (
          <p className="state-msg">Vui lòng chọn khách sạn để quản lý dịch vụ.</p>
        ) : loading ? (
          <p className="state-msg">Đang tải...</p>
        ) : addons.length === 0 ? (
          <p className="state-msg">Chưa có dịch vụ nào. Nhấn &quot;Thêm dịch vụ&quot; để bắt đầu.</p>
        ) : (
          <>
            <div className="addon-table-wrap">
              <table className="addon-table">
                <thead>
                  <tr>
                    <th>Tên</th>
                    <th>Loại</th>
                    <th>Giá</th>
                    <th>Cách tính</th>
                    <th>Trạng thái</th>
                    <th className="cell-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {addons.map((addon) => (
                    <tr key={addon._id}>
                      <td className="addon-title-cell">
                        <strong>{addon.name}</strong>
                        {addon.description ? <p className="addon-desc">{addon.description}</p> : null}
                      </td>
                      <td>{formatAddonCategory(addon.category)}</td>
                      <td>{Number(addon.price).toLocaleString('vi-VN')} VNĐ</td>
                      <td>{formatAddonPricingUnit(addon.pricingUnit)}</td>
                      <td>
                        <span className={`status-pill ${addon.isActive ? 'status-pill--open' : 'status-pill--closed'}`}>
                          {addon.isActive ? 'Đang bán' : 'Tạm tắt'}
                        </span>
                      </td>
                      <td className="addon-row-actions">
                        <button type="button" className="action-btn action-btn--edit" onClick={() => openEdit(addon)}>
                          Sửa
                        </button>
                        {addon.isActive ? (
                          <button
                            type="button"
                            className="action-btn action-btn--danger"
                            onClick={() => toggleStatus(addon)}
                          >
                            Tắt
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="action-btn action-btn--success"
                            onClick={() => toggleStatus(addon)}
                          >
                            Bật
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE.OWNER_SALES}
                onPageChange={setPage}
                variant="center"
                className="addon-pagination"
              />
            ) : null}
          </>
        )}

        <Dialog
          isOpen={dialogOpen}
          onClose={() => !submitting && setDialogOpen(false)}
          title={editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
          maxWidth="600px"
        >
          <AddonForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            submitting={submitting}
            submitError={submitError}
          />
        </Dialog>
      </div>
    </Layout>
  );
}
