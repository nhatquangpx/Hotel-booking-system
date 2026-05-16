import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { userHotelAPI } from '@/apis/guest/hotel';

const StaffHotelContext = createContext(null);

/**
 * Khách sạn cố định của nhân viên. API luôn trả assignedHotelId dạng { _id, name } | null.
 */
export function StaffHotelProvider({ children }) {
  const { user, role } = useAuth();
  const hotelId = (() => {
    const a = user?.assignedHotelId;
    if (!a) return '';
    if (typeof a === 'object' && a._id != null) return String(a._id);
    return String(a);
  })();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotel = useCallback(async () => {
    if (role !== 'staff' || !hotelId) {
      setHotel(null);
      setLoading(false);
      setError(
        role === 'staff' && !hotelId
          ? 'Tài khoản chưa được gán khách sạn'
          : null
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await userHotelAPI.getHotelById(hotelId);
      setHotel(data);
    } catch (err) {
      setHotel(null);
      setError(err?.message || 'Không tải được thông tin khách sạn');
    } finally {
      setLoading(false);
    }
  }, [hotelId, role]);

  useEffect(() => {
    fetchHotel();
  }, [fetchHotel]);

  const value = useMemo(
    () => ({
      hotelId,
      hotel,
      loading,
      error,
      refreshHotel: fetchHotel,
    }),
    [hotelId, hotel, loading, error, fetchHotel]
  );

  return (
    <StaffHotelContext.Provider value={value}>{children}</StaffHotelContext.Provider>
  );
}

export function StaffHotelOutlet() {
  return (
    <StaffHotelProvider>
      <Outlet />
    </StaffHotelProvider>
  );
}

export function useStaffHotel() {
  const ctx = useContext(StaffHotelContext);
  if (!ctx) {
    throw new Error('useStaffHotel chỉ dùng bên trong StaffHotelProvider');
  }
  return ctx;
}
