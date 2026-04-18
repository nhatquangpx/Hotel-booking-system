import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Outlet } from 'react-router-dom';
import { ownerHotelAPI } from '@/apis/owner/hotel';

const STORAGE_KEY = 'owner_selected_hotel_id';

const OwnerHotelContext = createContext(null);

export function OwnerHotelProvider({ children }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotelId, setSelectedHotelIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ownerHotelAPI.getOwnerHotels();
      const arr = Array.isArray(list) ? list : [];
      setHotels(arr);

      setSelectedHotelIdState((prev) => {
        const fromStorage = (() => {
          try {
            return localStorage.getItem(STORAGE_KEY) || '';
          } catch {
            return '';
          }
        })();
        const candidate = prev || fromStorage;
        const valid =
          candidate && arr.some((h) => String(h._id) === String(candidate));
        if (valid) {
          try {
            localStorage.setItem(STORAGE_KEY, String(candidate));
          } catch {
            /* ignore */
          }
          return String(candidate);
        }
        const first = arr[0]?._id;
        if (first) {
          const id = String(first);
          try {
            localStorage.setItem(STORAGE_KEY, id);
          } catch {
            /* ignore */
          }
          return id;
        }
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        return '';
      });
    } catch {
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const setSelectedHotelId = useCallback((id) => {
    const s = id != null ? String(id) : '';
    setSelectedHotelIdState(s);
    try {
      if (s) localStorage.setItem(STORAGE_KEY, s);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const selectedHotel = useMemo(
    () => hotels.find((h) => String(h._id) === String(selectedHotelId)),
    [hotels, selectedHotelId]
  );

  const value = useMemo(
    () => ({
      hotels,
      loading,
      selectedHotelId,
      setSelectedHotelId,
      selectedHotel,
      refreshHotels: fetchHotels,
    }),
    [hotels, loading, selectedHotelId, setSelectedHotelId, selectedHotel, fetchHotels]
  );

  return (
    <OwnerHotelContext.Provider value={value}>{children}</OwnerHotelContext.Provider>
  );
}

/** Bọc các route `/owner/*` để mọi trang owner dùng chung context khách sạn */
export function OwnerHotelOutlet() {
  return (
    <OwnerHotelProvider>
      <Outlet />
    </OwnerHotelProvider>
  );
}

export function useOwnerHotel() {
  const ctx = useContext(OwnerHotelContext);
  if (!ctx) {
    throw new Error('useOwnerHotel chỉ dùng bên trong OwnerHotelProvider');
  }
  return ctx;
}
