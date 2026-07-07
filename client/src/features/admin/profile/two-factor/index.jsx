import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Security, AccountCircle, Edit, Lock, Devices, Delete, DeleteSweep } from '@mui/icons-material';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import './TwoFactor.scss';

/**
 * Admin 2FA Settings page
 * Manage two-factor authentication settings
 */
const AdminTwoFactorPage = () => {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    requires2FA: false,
    remainingBackupCodes: 0
  });
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showConfirmRemoveAll, setShowConfirmRemoveAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetch2FAStatus();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (twoFactorStatus.enabled) {
      fetchTrustedDevices();
    } else {
      setTrustedDevices([]);
    }
  }, [twoFactorStatus.enabled]);

  const fetch2FAStatus = async () => {
    try {
      setLoading(true);
      const status = await api.auth.get2FAStatus();
      setTwoFactorStatus(status);
    } catch (error) {
      toast.error('Không thể tải trạng thái xác thực 2 lớp');
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setSaving(true);
      const result = await api.auth.enable2FA();
      const codes = result.backupCodes || [];

      setTwoFactorStatus((prev) => ({
        ...prev,
        enabled: true,
        remainingBackupCodes: codes.length,
      }));
      setBackupCodes(codes);
      setShowBackupCodes(true);
      
      toast.success('Đã bật xác thực 2 lớp thành công! Mã dự phòng đã được gửi đến email của bạn.');
    } catch (error) {
      toast.error(error.message || 'Không thể bật xác thực 2 lớp');
      console.error('Error enabling 2FA:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setSaving(true);
      await api.auth.disable2FA();
      
      setTwoFactorStatus(prev => ({ ...prev, enabled: false, remainingBackupCodes: 0 }));
      setShowBackupCodes(false);
      setBackupCodes([]);
      setShowConfirmDisable(false);
      
      toast.success('Đã tắt xác thực 2 lớp thành công');
    } catch (error) {
      toast.error(error.message || 'Không thể tắt xác thực 2 lớp');
      console.error('Error disabling 2FA:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setSaving(true);
      const result = await api.auth.regenerateBackupCodes();
      
      setBackupCodes(result.backupCodes || []);
      setShowBackupCodes(true);
      await fetch2FAStatus(); // Refresh status
      
      toast.success('Đã tạo lại mã dự phòng. Mã mới đã được gửi đến email của bạn.');
    } catch (error) {
      toast.error(error.message || 'Không thể tạo lại mã dự phòng');
      console.error('Error regenerating backup codes:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Đã sao chép mã dự phòng vào clipboard');
  };

  const fetchTrustedDevices = async () => {
    try {
      setLoadingDevices(true);
      const result = await api.auth.getTrustedDevices();
      setTrustedDevices(result.devices || []);
    } catch (error) {
      toast.error('Không thể tải danh sách thiết bị tin cậy');
      console.error('Error fetching trusted devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      setSaving(true);
      await api.auth.removeTrustedDevice(deviceId);
      await fetchTrustedDevices();
      toast.success('Đã xóa thiết bị tin cậy thành công');
    } catch (error) {
      toast.error(error.message || 'Không thể xóa thiết bị');
      console.error('Error removing device:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAllDevices = async () => {
    try {
      setSaving(true);
      await api.auth.removeAllTrustedDevices();
      await fetchTrustedDevices();
      setShowConfirmRemoveAll(false);
      toast.success('Đã xóa tất cả thiết bị tin cậy thành công');
    } catch (error) {
      toast.error(error.message || 'Không thể xóa tất cả thiết bị');
      console.error('Error removing all devices:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user) {
    return (
      <AdminLayout>
        <div>Vui lòng đăng nhập để xem cài đặt bảo mật</div>
      </AdminLayout>
    );
  }

  const basePath = '/admin/profile';

  return (
    <AdminLayout>
      <div className="admin-profile-container">
        <div className="profile-header">
          <h1>Bảo mật tài khoản</h1>
          <p>Quản lý xác thực 2 lớp và bảo mật</p>
        </div>

        <div className="profile-content">
          <div className="sidebar">
            <Link 
              to={basePath} 
              className={`menu-item ${location.pathname === basePath ? 'active' : ''}`}
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link 
              to={`${basePath}/edit`} 
              className={`menu-item ${location.pathname === `${basePath}/edit` ? 'active' : ''}`}
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`${basePath}/changepassword`} 
              className={`menu-item ${location.pathname === `${basePath}/changepassword` ? 'active' : ''}`}
            >
              <Lock sx={{ fontSize: 20, marginRight: 1 }} />
              Đổi mật khẩu
            </Link>
            <Link 
              to={`${basePath}/two-factor`} 
              className={`menu-item ${location.pathname === `${basePath}/two-factor` ? 'active' : ''}`}
            >
              <Security sx={{ fontSize: 20, marginRight: 1 }} />
              Xác thực 2 lớp
            </Link>
          </div>

          <div className="main-content">
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : (
              <div className="two-factor-settings">
                <div className="section">
                  <h2>Xác thực 2 lớp (2FA)</h2>
                  <p className="section-description">
                    Xác thực 2 lớp giúp bảo vệ tài khoản của bạn bằng cách yêu cầu mã OTP qua email khi đăng nhập.
                  </p>

                  <div className="twofa-status-card">
                    <div className="status-header">
                      <div className="status-info">
                        <h3>Trạng thái</h3>
                        <span className={`status-badge ${twoFactorStatus.enabled ? 'enabled' : 'disabled'}`}>
                          {twoFactorStatus.enabled ? 'Đã bật' : 'Chưa bật'}
                        </span>
                      </div>
                    </div>

                    {twoFactorStatus.enabled && (
                      <div className="status-details">
                        <p>
                          <strong>Số mã dự phòng còn lại:</strong> {twoFactorStatus.remainingBackupCodes}
                        </p>
                      </div>
                    )}

                    <div className="twofa-actions">
                      {!twoFactorStatus.enabled ? (
                        <button
                          className="btn-enable"
                          onClick={handleEnable2FA}
                          disabled={saving}
                        >
                          {saving ? 'Đang xử lý...' : 'Bật xác thực 2 lớp'}
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn-regenerate"
                            onClick={handleRegenerateBackupCodes}
                            disabled={saving}
                          >
                            {saving ? 'Đang xử lý...' : 'Tạo lại mã dự phòng'}
                          </button>
                          <button
                            className="btn-disable"
                            onClick={() => setShowConfirmDisable(true)}
                            disabled={saving}
                          >
                            Tắt xác thực 2 lớp
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {showBackupCodes && backupCodes.length > 0 && (
                    <div className="backup-codes-card">
                      <h3>Mã dự phòng</h3>
                      <p className="warning-text">
                        ⚠️ Lưu trữ các mã này ở nơi an toàn. Mỗi mã chỉ có thể sử dụng một lần.
                        Mã dự phòng cũng đã được gửi đến email của bạn.
                      </p>
                      <div className="codes-grid">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="code-item">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="codes-actions">
                        <button className="btn-copy" onClick={copyBackupCodes}>
                          Sao chép tất cả
                        </button>
                        <button className="btn-close" onClick={() => setShowBackupCodes(false)}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                  {showConfirmDisable && (
                    <div className="confirm-dialog">
                      <div className="dialog-content">
                        <h3>Xác nhận tắt xác thực 2 lớp</h3>
                        <p>Bạn có chắc chắn muốn tắt xác thực 2 lớp? Tài khoản của bạn sẽ kém an toàn hơn.</p>
                        <div className="dialog-actions">
                          <button
                            className="btn-cancel"
                            onClick={() => setShowConfirmDisable(false)}
                            disabled={saving}
                          >
                            Hủy
                          </button>
                          <button
                            className="btn-confirm"
                            onClick={handleDisable2FA}
                            disabled={saving}
                          >
                            {saving ? 'Đang xử lý...' : 'Xác nhận tắt'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trusted Devices Section */}
                {twoFactorStatus.enabled && (
                  <div className="section">
                    <div className="section-header">
                      <h2>
                        <Devices sx={{ fontSize: 24, marginRight: 1, verticalAlign: 'middle' }} />
                        Thiết bị tin cậy
                      </h2>
                      <p className="section-description">
                        Các thiết bị bạn đã chọn "Nhớ thiết bị này" sẽ không cần xác thực 2 lớp trong 30 ngày.
                      </p>
                    </div>

                    {loadingDevices ? (
                      <div className="loading">Đang tải danh sách thiết bị...</div>
                    ) : trustedDevices.length === 0 ? (
                      <div className="empty-state">
                        <p>Bạn chưa có thiết bị tin cậy nào.</p>
                        <p className="empty-hint">Thiết bị sẽ được thêm vào danh sách khi bạn chọn "Nhớ thiết bị này" khi đăng nhập.</p>
                      </div>
                    ) : (
                      <div className="trusted-devices-card">
                        <div className="devices-header">
                          <p className="devices-count">
                            Tổng cộng: <strong>{trustedDevices.length}</strong> thiết bị
                          </p>
                          {trustedDevices.length > 0 && (
                            <button
                              className="btn-remove-all"
                              onClick={() => setShowConfirmRemoveAll(true)}
                              disabled={saving}
                            >
                              <DeleteSweep sx={{ fontSize: 18, marginRight: 0.5 }} />
                              Xóa tất cả
                            </button>
                          )}
                        </div>

                        <div className="devices-list">
                          {trustedDevices.map((device) => {
                            const daysRemaining = getDaysRemaining(device.expiresAt);
                            return (
                              <div key={device.deviceId} className="device-item">
                                <div className="device-info">
                                  <div className="device-name-row">
                                    <h4>{device.deviceName}</h4>
                                    <span className={`days-badge ${daysRemaining <= 7 ? 'warning' : ''}`}>
                                      {daysRemaining > 0 
                                        ? `Còn ${daysRemaining} ngày` 
                                        : 'Đã hết hạn'}
                                    </span>
                                  </div>
                                  <p className="device-details">
                                    <strong>Đã tin cậy:</strong> {formatDate(device.trustedAt)}
                                  </p>
                                  <p className="device-details">
                                    <strong>Hết hạn:</strong> {formatDate(device.expiresAt)}
                                  </p>
                                  {device.userAgent && (
                                    <p className="device-user-agent">
                                      {device.userAgent.length > 80 
                                        ? `${device.userAgent.substring(0, 80)}...` 
                                        : device.userAgent}
                                    </p>
                                  )}
                                </div>
                                <button
                                  className="btn-remove-device"
                                  onClick={() => handleRemoveDevice(device.deviceId)}
                                  disabled={saving}
                                  title="Xóa thiết bị"
                                >
                                  <Delete sx={{ fontSize: 18 }} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {showConfirmRemoveAll && (
                      <div className="confirm-dialog">
                        <div className="dialog-content">
                          <h3>Xác nhận xóa tất cả thiết bị</h3>
                          <p>Bạn có chắc chắn muốn xóa tất cả thiết bị tin cậy? Bạn sẽ phải xác thực 2 lớp lại trên tất cả các thiết bị.</p>
                          <div className="dialog-actions">
                            <button
                              className="btn-cancel"
                              onClick={() => setShowConfirmRemoveAll(false)}
                              disabled={saving}
                            >
                              Hủy
                            </button>
                            <button
                              className="btn-confirm"
                              onClick={handleRemoveAllDevices}
                              disabled={saving}
                            >
                              {saving ? 'Đang xử lý...' : 'Xác nhận xóa tất cả'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTwoFactorPage;
