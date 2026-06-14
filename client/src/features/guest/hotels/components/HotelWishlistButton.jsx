import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { IconButton, Tooltip } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '@/apis';
import './HotelWishlistButton.scss';

/**
 * Nút trái tim trên thẻ khách sạn — chỉ khách (role guest) mới lưu wishlist.
 */
export const HotelWishlistButton = ({
  hotelId,
  isWishlisted,
  onWishlistedChange,
  className = '',
  inline = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user?.user);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', {
        state: { redirectUrl: `${location.pathname}${location.search || ''}` },
      });
      return;
    }

    if (user.role !== 'guest') {
      toast.error('Chỉ tài khoản khách (guest) mới dùng được danh sách yêu thích.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.guestWishlist.toggleWishlist(hotelId);
      onWishlistedChange?.(hotelId, data.wishlisted);
      toast.success(
        data.wishlisted
          ? 'Đã thêm vào danh sách yêu thích'
          : 'Đã bỏ khỏi danh sách yêu thích'
      );
    } catch (err) {
      toast.error(err?.message || 'Không thể cập nhật danh sách yêu thích.');
      console.error('Wishlist toggle failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const active = Boolean(isWishlisted);
  const tooltipTitle = !user
    ? 'Đăng nhập để lưu yêu thích'
    : user.role !== 'guest'
      ? 'Chỉ tài khoản guest mới lưu wishlist'
      : active
        ? 'Bỏ khỏi danh sách yêu thích'
        : 'Thêm vào danh sách yêu thích';

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton
        type="button"
        className={`hotel-wishlist-btn ${className} ${active ? 'hotel-wishlist-btn--active' : ''}`}
        onClick={handleClick}
        disabled={loading}
        aria-label={active ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
        size="small"
        sx={{
          position: inline ? 'static' : 'absolute',
          top: inline ? 'auto' : 8,
          right: inline ? 'auto' : 8,
          zIndex: 5,
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 1)',
          },
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}
      >
        {active ? (
          <Favorite sx={{ fontSize: 22, color: '#e53935' }} />
        ) : (
          <FavoriteBorder sx={{ fontSize: 22, color: '#5f6368' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default HotelWishlistButton;
