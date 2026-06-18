import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/apis';
import { PAGE_SIZE } from '@/constants/pagination';

/**
 * Custom hook for managing hotel filters with server-side pagination
 */
export const useHotelFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.GUEST_HOTELS,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    starRating: searchParams.get('starRating') || '',
    name: searchParams.get('name') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    maxPeople: searchParams.get('maxPeople') || '',
    roomType: searchParams.get('roomType') || '',
    amenities: searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [],
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await api.userHotel.getHotelCities();
        setCities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        );

        const params = {
          page,
          limit: PAGE_SIZE.GUEST_HOTELS,
          ...activeFilters,
          amenities: activeFilters.amenities?.length
            ? activeFilters.amenities.join(',')
            : undefined,
        };

        const hasFilters = Object.keys(activeFilters).length > 0;
        const result = hasFilters
          ? await api.userHotel.getHotelByFilter(params)
          : await api.userHotel.getAllHotels(params);

        setHotels(result.items || []);
        setPagination(result.pagination);
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách khách sạn');
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFilters = { ...filters };

    if (name === 'amenities') {
      if (checked) {
        newFilters.amenities = [...(newFilters.amenities || []), value];
      } else {
        newFilters.amenities = (newFilters.amenities || []).filter((a) => a !== value);
      }
    } else {
      newFilters[name] = value;
    }

    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val !== '' && (Array.isArray(val) ? val.length > 0 : true)) {
        if (Array.isArray(val)) {
          params.set(key, val.join(','));
        } else {
          params.set(key, val);
        }
      }
    });
    setSearchParams(params);
  };

  const handleAmenityToggle = (amenity) => {
    const newFilters = { ...filters };
    if (newFilters.amenities.includes(amenity)) {
      newFilters.amenities = newFilters.amenities.filter((a) => a !== amenity);
    } else {
      newFilters.amenities = [...newFilters.amenities, amenity];
    }
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val !== '' && (Array.isArray(val) ? val.length > 0 : true)) {
        if (Array.isArray(val)) {
          params.set(key, val.join(','));
        } else {
          params.set(key, val);
        }
      }
    });
    setSearchParams(params);
  };

  const clearFilters = () => {
    const emptyFilters = {
      city: '',
      starRating: '',
      name: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      maxPeople: '',
      roomType: '',
      amenities: [],
    };
    setFilters(emptyFilters);
    setSearchParams({});
  };

  return {
    hotels,
    cities,
    filters,
    loading,
    error,
    page,
    setPage,
    pagination,
    handleFilterChange,
    handleAmenityToggle,
    clearFilters,
  };
};
