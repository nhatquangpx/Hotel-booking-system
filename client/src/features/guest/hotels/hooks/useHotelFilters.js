import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/apis';

/**
 * Custom hook for managing hotel filters
 * Handles filter state and fetching filtered hotels
 */
export const useHotelFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch all cities when component mounts
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.userHotel.getAllHotels();
        const hotelsData = Array.isArray(response) ? response : [];
        const uniqueCities = [...new Set(hotelsData.map(hotel => hotel.address?.city).filter(Boolean))].sort();
        setCities(uniqueCities);
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };

    fetchCities();
  }, []);

  // Fetch filtered hotels when filters change
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        );

        const response = Object.keys(activeFilters).length > 0
          ? await api.userHotel.getHotelByFilter(activeFilters)
          : await api.userHotel.getAllHotels();

        setHotels(Array.isArray(response) ? response : []);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách khách sạn');
        setHotels([]);
        setLoading(false);
        console.error(err);
      }
    };

    fetchHotels();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newFilters = { ...filters };

    // Xử lý checkbox cho amenities
    if (name === 'amenities') {
      if (checked) {
        newFilters.amenities = [...(newFilters.amenities || []), value];
      } else {
        newFilters.amenities = (newFilters.amenities || []).filter(a => a !== value);
      }
    } else {
      newFilters[name] = value;
    }

    setFilters(newFilters);

    // Update URL with new filters
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
      newFilters.amenities = newFilters.amenities.filter(a => a !== amenity);
    } else {
      newFilters.amenities = [...newFilters.amenities, amenity];
    }
    setFilters(newFilters);

    // Update URL
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
    handleFilterChange,
    handleAmenityToggle,
    clearFilters,
  };
};

