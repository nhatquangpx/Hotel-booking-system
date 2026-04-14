import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '@/apis';

/**
 * Wishlist cho guest: một lần fetch /guest/wishlist, giữ Set id + cập nhật khi toggle.
 * Tránh nhân bộ effect ở nhiều trang và đồng bộ cancel/error.
 */
export function useGuestWishlist() {
  const user = useSelector((state) => state.user?.user);
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'guest') {
      setWishlistIds(new Set());
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await api.guestWishlist.getWishlist();
        const list = data?.hotels || [];
        if (!cancelled) {
          setWishlistIds(new Set(list.map((h) => String(h._id))));
        }
      } catch {
        if (!cancelled) {
          setWishlistIds(new Set());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const applyWishlistedChange = useCallback((hotelId, wishlisted) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      const id = String(hotelId);
      if (wishlisted) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const isWishlisted = useCallback(
    (hotelId) => {
      if (hotelId == null || hotelId === '') {
        return false;
      }
      return wishlistIds.has(String(hotelId));
    },
    [wishlistIds]
  );

  return {
    wishlistIds,
    loading,
    applyWishlistedChange,
    isWishlisted,
  };
}

export default useGuestWishlist;
