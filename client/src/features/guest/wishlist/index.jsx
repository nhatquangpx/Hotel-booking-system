import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestLayout } from '@/features/guest/components/layout';
import { HotelCard } from '@/features/guest/hotels/components';
import api from '@/apis';
import './Wishlist.scss';

/**
 * Trang danh sách khách sạn đã lưu (wishlist) của khách.
 */
const GuestWishlistPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.user);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.guestWishlist.getWishlist();
      setHotels(Array.isArray(data?.hotels) ? data.hotels : []);
    } catch (e) {
      setError('Không thể tải danh sách yêu thích.');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { redirectUrl: '/wishlist' } });
      return;
    }
    if (user.role !== 'guest') {
      navigate('/');
      return;
    }
    loadWishlist();
  }, [user, navigate, loadWishlist]);

  const onWishlistedChange = useCallback((hotelId, wishlisted) => {
    if (!wishlisted) {
      setHotels((prev) => prev.filter((h) => String(h._id) !== String(hotelId)));
    }
  }, []);

  if (!user || user.role !== 'guest') {
    return null;
  }

  return (
    <GuestLayout>
      <div className="guest-wishlist">
        <h1 className="guest-wishlist__title">Danh sách yêu thích</h1>
        <p className="guest-wishlist__subtitle">
          Các khách sạn bạn đã lưu. Nhấn trái tim trên thẻ để bỏ lưu.
        </p>

        {loading && <div className="guest-wishlist__state">Đang tải...</div>}
        {error && <div className="guest-wishlist__state guest-wishlist__state--error">{error}</div>}

        {!loading && !error && hotels.length === 0 && (
          <div className="guest-wishlist__empty">Bạn chưa lưu khách sạn nào.</div>
        )}

        {!loading && !error && hotels.length > 0 && (
          <div className="guest-wishlist__grid">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                isWishlisted
                onWishlistedChange={onWishlistedChange}
              />
            ))}
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default GuestWishlistPage;
