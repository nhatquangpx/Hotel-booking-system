import React, { useState, useEffect, useMemo } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Dialog from '@/components/ui/Dialog';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import './HotelFormDialog.scss';

/**
 * Hotel Form Dialog Component
 * Reusable dialog for creating and editing hotels
 */
const HotelFormDialog = ({ 
  isOpen, 
  onClose, 
  hotelId = null, 
  onSuccess 
}) => {
  const isEdit = !!hotelId;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      number: '',
      street: '',
      city: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    starRating: 3,
    ownerId: '',
    status: 'active',
    policies: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      refundMinDaysBeforeCheckIn: 2,
    },
    paymentQr: {
      accountName: '',
      accountNumber: '',
      bankName: ''
    },
    paymentVnpay: {
      tmnCode: '',
      secureSecret: ''
    }
  });
  const [existingQrImageUrl, setExistingQrImageUrl] = useState(null);
  const [qrImageFile, setQrImageFile] = useState(null);
  const [owners, setOwners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [showVnpaySecret, setShowVnpaySecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vnpayWasConfigured, setVnpayWasConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOwners();
      if (isEdit) {
        fetchHotel();
      } else {
        // Reset form for create
        setFormData({
          name: '',
          description: '',
          address: {
            number: '',
            street: '',
            city: ''
          },
          contactInfo: {
            phone: '',
            email: ''
          },
          starRating: 3,
          ownerId: '',
          status: 'active',
          policies: {
            checkInTime: '14:00',
            checkOutTime: '12:00',
            refundMinDaysBeforeCheckIn: 2,
          },
          paymentQr: {
            accountName: '',
            accountNumber: '',
            bankName: ''
          },
          paymentVnpay: {
            tmnCode: '',
            secureSecret: ''
          }
        });
        setSelectedFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setExistingQrImageUrl(null);
        setQrImageFile(null);
        setShowVnpaySecret(false);
        setError(null);
        setVnpayWasConfigured(false);
      }
    }
  }, [isOpen, hotelId]);

  const qrObjectUrl = useMemo(() => {
    if (!qrImageFile) return null;
    return URL.createObjectURL(qrImageFile);
  }, [qrImageFile]);

  useEffect(() => {
    return () => {
      if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    };
  }, [qrObjectUrl]);

  const qrPreviewSrc =
    qrObjectUrl ||
    (existingQrImageUrl ? getImageUrl(existingQrImageUrl) : null);

  const fetchOwners = async () => {
    try {
      const users = await api.adminUser.getAllUsers();
      setOwners(users.filter(u => u.role === 'owner'));
    } catch (err) {
      setOwners([]);
    }
  };

  const fetchHotel = async () => {
    try {
      setLoading(true);
      setQrImageFile(null);
      setExistingQrImageUrl(null);
      const hotelData = await api.adminHotel.getHotelById(hotelId);
      setFormData({
        name: hotelData.name || '',
        ownerId: hotelData.ownerId?._id || '',
        description: hotelData.description || '',
        address: {
          number: hotelData.address?.number || '',
          street: hotelData.address?.street || '',
          city: hotelData.address?.city || '',
        },
        starRating: hotelData.starRating || 1,
        contactInfo: {
          phone: hotelData.contactInfo?.phone || '',
          email: hotelData.contactInfo?.email || '',
        },
        policies: {
          checkInTime: hotelData.policies?.checkInTime || '14:00',
          checkOutTime: hotelData.policies?.checkOutTime || '12:00',
          refundMinDaysBeforeCheckIn: hotelData.policies?.refundMinDaysBeforeCheckIn ?? 2,
        },
        status: hotelData.status || 'active',
        paymentQr: {
          accountName: hotelData.paymentConfig?.qr?.accountName || '',
          accountNumber: hotelData.paymentConfig?.qr?.accountNumber || '',
          bankName: hotelData.paymentConfig?.qr?.bankName || '',
        },
        paymentVnpay: {
          tmnCode: hotelData.paymentConfig?.vnpay?.tmnCode || '',
          secureSecret: '',
        },
      });
      setVnpayWasConfigured(Boolean(hotelData.paymentConfig?.vnpay?.isConfigured));
      setExistingQrImageUrl(hotelData.paymentConfig?.qr?.qrImageUrl || null);
      setQrImageFile(null);
      setShowVnpaySecret(false);
      setExistingImages(hotelData.images || []);
      setImagePreviews(hotelData.images?.map(img => getImageUrl(img)) || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin khách sạn');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentQrChange = (e) => {
    const { name, value } = e.target;
    const field = name.replace('paymentQr.', '');
    setFormData((prev) => ({
      ...prev,
      paymentQr: {
        ...prev.paymentQr,
        [field]: value,
      },
    }));
  };

  const handlePaymentVnpayChange = (e) => {
    const { name, value } = e.target;
    const field = name.replace('paymentVnpay.', '');
    setFormData((prev) => ({
      ...prev,
      paymentVnpay: {
        ...prev.paymentVnpay,
        [field]: value,
      },
    }));
  };

  const handleQrImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrImageFile(file);
    e.target.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    // Check if it's a new file or existing image
    const existingCount = existingImages.length;
    if (index < existingCount) {
      // Remove existing image
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove new file
      const newIndex = index - existingCount;
      setSelectedFiles(prev => prev.filter((_, i) => i !== newIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const appendCommonFields = (fd) => {
        fd.append('name', formData.name);
        fd.append('description', formData.description);
        fd.append('starRating', formData.starRating);
        fd.append('ownerId', formData.ownerId);
        fd.append('status', formData.status);
        fd.append('address[number]', formData.address.number);
        fd.append('address[street]', formData.address.street);
        fd.append('address[city]', formData.address.city);
        fd.append('contactInfo[phone]', formData.contactInfo.phone);
        fd.append('contactInfo[email]', formData.contactInfo.email);
        fd.append('policies[checkInTime]', formData.policies.checkInTime);
        fd.append('policies[checkOutTime]', formData.policies.checkOutTime);
        fd.append(
          'policies[refundMinDaysBeforeCheckIn]',
          String(
            Math.min(
              90,
              Math.max(0, parseInt(String(formData.policies.refundMinDaysBeforeCheckIn), 10) || 2)
            )
          )
        );
        fd.append('paymentConfig[qr][accountName]', formData.paymentQr.accountName || '');
        fd.append('paymentConfig[qr][accountNumber]', formData.paymentQr.accountNumber || '');
        fd.append('paymentConfig[qr][bankName]', formData.paymentQr.bankName || '');
        fd.append('paymentConfig[vnpay][tmnCode]', formData.paymentVnpay.tmnCode || '');
        const vnpaySecretTrimmed = String(formData.paymentVnpay.secureSecret || '').trim();
        if (vnpaySecretTrimmed) {
          fd.append('paymentConfig[vnpay][secureSecret]', vnpaySecretTrimmed);
        }
        if (qrImageFile) {
          fd.append('qrCodeImage', qrImageFile);
        }
      };

      const accountName = String(formData.paymentQr.accountName || '').trim();
      const accountNumber = String(formData.paymentQr.accountNumber || '').trim();
      const bankName = String(formData.paymentQr.bankName || '').trim();

      if (!accountName || !accountNumber || !bankName) {
        setError('Vui lòng nhập đầy đủ tên chủ tài khoản, số tài khoản và ngân hàng.');
        setSaving(false);
        return;
      }

      if (!qrImageFile && !existingQrImageUrl) {
        setError('Vui lòng tải ảnh mã QR nhận tiền (lưu trên Cloudinary khi server đã cấu hình).');
        setSaving(false);
        return;
      }

      const vnpayTmnCode = String(formData.paymentVnpay.tmnCode || '').trim();
      const vnpaySecureSecret = String(formData.paymentVnpay.secureSecret || '').trim();
      const hasAnyVnpayInput = Boolean(vnpayTmnCode || vnpaySecureSecret);
      const vnpaySecretOptional =
        Boolean(vnpayTmnCode) && !vnpaySecureSecret && vnpayWasConfigured;
      if (hasAnyVnpayInput && (!vnpayTmnCode || !vnpaySecureSecret) && !vnpaySecretOptional) {
        setError(
          'VNPay là tùy chọn: nhập đủ TMN Code và Secure Secret, hoặc để trống cả hai. Nếu khách sạn đã cấu hình VNPay, có thể để trống Secret khi chỉ sửa TMN Code.'
        );
        setSaving(false);
        return;
      }

      if (isEdit) {
        const formDataToSend = new FormData();
        appendCommonFields(formDataToSend);
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
        selectedFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        await api.adminHotel.updateHotel(hotelId, formDataToSend);
      } else {
        const formDataToSend = new FormData();
        appendCommonFields(formDataToSend);
        selectedFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        await api.adminHotel.createHotel(formDataToSend);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} khách sạn`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa khách sạn' : 'Tạo khách sạn mới'}
      maxWidth="700px"
      className="hotel-form-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <form className="hotel-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Tên khách sạn</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.number">Số nhà</label>
              <input
                type="text"
                id="address.number"
                name="address.number"
                value={formData.address.number}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address.street">Đường</label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address.city">Thành phố</label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactInfo.phone">Số điện thoại</label>
              <input
                type="text"
                id="contactInfo.phone"
                name="contactInfo.phone"
                value={formData.contactInfo.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactInfo.email">Email</label>
              <input
                type="email"
                id="contactInfo.email"
                name="contactInfo.email"
                value={formData.contactInfo.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="starRating">Xếp hạng sao</label>
              <select
                id="starRating"
                name="starRating"
                value={formData.starRating}
                onChange={handleChange}
                required
              >
                <option value="1">1 sao</option>
                <option value="2">2 sao</option>
                <option value="3">3 sao</option>
                <option value="4">4 sao</option>
                <option value="5">5 sao</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ownerId">Chủ khách sạn</label>
              <select
                id="ownerId"
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn chủ khách sạn --</option>
                {owners.map(owner => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Dừng hoạt động</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          </div>

          <div className="form-group form-group--images">
            <label htmlFor="images">Ảnh khách sạn</label>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            {isEdit && (
              <p className="form-hint">
                Có thể thêm ảnh mới hoặc xóa ảnh hiện có. Ảnh đã lưu sẽ được giữ khi bạn không xóa.
              </p>
            )}
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src} alt={`Preview ${index + 1}`} />
                    <IconButton
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                      size="small"
                      type="button"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section-qr">
            <h4 className="form-section-qr__title">Thanh toán QR (chuyển khoản)</h4>
            <p className="form-section-qr__hint">
              Bắt buộc: điền đủ thông tin tài khoản và ảnh QR nhận tiền để khách thanh toán chuyển khoản.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentQr.accountName">Chủ tài khoản *</label>
                <input
                  type="text"
                  id="paymentQr.accountName"
                  name="paymentQr.accountName"
                  value={formData.paymentQr.accountName}
                  onChange={handlePaymentQrChange}
                  placeholder="Tên chủ TK"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentQr.accountNumber">Số tài khoản *</label>
                <input
                  type="text"
                  id="paymentQr.accountNumber"
                  name="paymentQr.accountNumber"
                  value={formData.paymentQr.accountNumber}
                  onChange={handlePaymentQrChange}
                  placeholder="Số TK"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentQr.bankName">Ngân hàng *</label>
                <input
                  type="text"
                  id="paymentQr.bankName"
                  name="paymentQr.bankName"
                  value={formData.paymentQr.bankName}
                  onChange={handlePaymentQrChange}
                  placeholder="VD: MB Bank"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="qrCodeImage">Ảnh mã QR nhận tiền *</label>
              <input
                type="file"
                id="qrCodeImage"
                name="qrCodeImage"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleQrImageChange}
                required={!qrPreviewSrc}
              />
              {qrPreviewSrc && (
                <div className="qr-image-preview">
                  <img src={qrPreviewSrc} alt="Mã QR nhận tiền" />
                </div>
              )}
            </div>
          </div>

          <div className="form-section-qr">
            <h4 className="form-section-qr__title">Thanh toán VNPay (merchant riêng)</h4>
            <p className="form-section-qr__hint">
              Tùy chọn: nhập đủ TMN và Secret khi cấu hình mới. Khi sửa khách sạn đã có VNPay, secret không tải từ server — để trống Secret nếu chỉ đổi TMN (giữ secret đã lưu); để trống cả hai để tắt VNPay.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentVnpay.tmnCode">VNPay TMN Code</label>
                <input
                  type="text"
                  id="paymentVnpay.tmnCode"
                  name="paymentVnpay.tmnCode"
                  value={formData.paymentVnpay.tmnCode}
                  onChange={handlePaymentVnpayChange}
                  placeholder="Ví dụ: 2QXUI4J4"
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentVnpay.secureSecret">VNPay Secure Secret</label>
                <div className="secret-input-wrap">
                  <input
                    type={showVnpaySecret ? 'text' : 'password'}
                    id="paymentVnpay.secureSecret"
                    name="paymentVnpay.secureSecret"
                    value={formData.paymentVnpay.secureSecret}
                    onChange={handlePaymentVnpayChange}
                    placeholder={
                      isEdit
                        ? 'Nhập secret mới hoặc để trống nếu giữ secret cũ'
                        : 'Nhập secure secret của merchant'
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-secret-btn"
                    onClick={() => setShowVnpaySecret((prev) => !prev)}
                    aria-label={showVnpaySecret ? 'Ẩn secure secret' : 'Hiện secure secret'}
                  >
                    {showVnpaySecret ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group-policies">
            <label>Chính sách</label>
            <div className="policies-inputs">
              <div className="policy-item policy-item--time">
                <input
                  type="time"
                  id="policies.checkInTime"
                  name="policies.checkInTime"
                  value={formData.policies.checkInTime}
                  onChange={handleChange}
                />
                <label htmlFor="policies.checkInTime">Giờ nhận phòng</label>
              </div>
              <div className="policy-item policy-item--time">
                <input
                  type="time"
                  id="policies.checkOutTime"
                  name="policies.checkOutTime"
                  value={formData.policies.checkOutTime}
                  onChange={handleChange}
                />
                <label htmlFor="policies.checkOutTime">Giờ trả phòng</label>
              </div>
              <div className="policy-item policy-item--refund-days">
                <input
                  type="number"
                  id="policies.refundMinDaysBeforeCheckIn"
                  name="policies.refundMinDaysBeforeCheckIn"
                  min={0}
                  max={90}
                  value={formData.policies.refundMinDaysBeforeCheckIn}
                  onChange={handleChange}
                />
                <label htmlFor="policies.refundMinDaysBeforeCheckIn">
                  Ngày trước check-in tối thiểu (hoàn tiền — đơn đã thanh toán)
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo khách sạn')}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default HotelFormDialog;

