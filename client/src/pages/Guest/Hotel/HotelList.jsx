import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './HotelList.scss';

const HotelListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    starRating: searchParams.get('starRating') || '',
    name: searchParams.get('name') || '',
    search: searchParams.get('search') || ''
  });

  // Fetch all cities when component mounts
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.userHotel.getAllHotels();
        const hotelsData = Array.isArray(response) ? response : [];
        const uniqueCities = [...new Set(hotelsData.map(hotel => hotel.address.city))].sort();
        setCities(uniqueCities);
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };

    fetchCities();
  }, []); // Empty dependency array means this runs once when component mounts

  // Fetch filtered hotels when filters change
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        );
        console.log('Active filters:', activeFilters);
        
        // Sử dụng API mới nếu có bộ lọc
        const response = Object.keys(activeFilters).length > 0
          ? await api.userHotel.getHotelByFilter(activeFilters)
          : await api.userHotel.getAllHotels();
          
        console.log('API Response:', response);
        setHotels(Array.isArray(response) ? response : []);
        setLoading(false);
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
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value
    };
    setFilters(newFilters);
    
    // Cập nhật URL với các bộ lọc mới
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="hotel-list-container">
        <div className="filter-section">
          <h2>Tìm kiếm khách sạn</h2>
          <div className="filter-form">
            <div className="filter-item">
              <label htmlFor="name">Tên khách sạn</label>
              <input
                type="text"
                id="name"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Nhập tên khách sạn..."
              />
            </div>
            <div className="filter-item">
              <label htmlFor="city">Thành phố</label>
              <select
                id="city"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả thành phố</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label htmlFor="starRating">Hạng sao</label>
              <select
                id="starRating"
                name="starRating"
                value={filters.starRating}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả</option>
                <option value="1">1 Sao</option>
                <option value="2">2 Sao</option>
                <option value="3">3 Sao</option>
                <option value="4">4 Sao</option>
                <option value="5">5 Sao</option>
              </select>
            </div>
          </div>
        </div>

        <div className="hotel-list">
          <h1>
            {filters.search 
              ? `Kết quả tìm kiếm cho "${filters.search}"`
              : filters.name 
                ? `Kết quả tìm kiếm cho "${filters.name}"`
                : filters.city 
                  ? `Khách sạn tại ${filters.city}`
                  : 'Danh sách khách sạn'}
          </h1>
          
          {loading && <div className="loading">Đang tải...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && Array.isArray(hotels) && hotels.length === 0 && (
            <div className="no-hotels">
              {filters.search || filters.name || filters.city 
                ? 'Không tìm thấy khách sạn phù hợp với tiêu chí tìm kiếm'
                : 'Không có khách sạn nào'}
            </div>
          )}
          
          <div className="hotel-grid">
            {hotels && hotels.map((hotel) => (
              <div className="hotel-card" key={hotel._id}>
                <div className="hotel-image">
                  <img 
                    src={hotel.images && hotel.images[0] ? `${import.meta.env.VITE_API_URL}${hotel.images[0]}` : 'https://via.placeholder.com/300x200?text=Không+có+hình'} 
                    alt={hotel.name} 
                  />
                </div>
                <div className="hotel-info">
                  <h3>{hotel.name}</h3>
                  <div className="hotel-rating">
                    {Array(hotel.starRating).fill().map((_, i) => (
                      <span key={i} className="star">★</span>
                    ))}
                  </div>
                  <p className="hotel-address">
                    {`${hotel.address.number} ${hotel.address.street}, ${hotel.address.city}`}
                  </p>
                  <Link to={`/hotels/${hotel._id}`} className="view-details-btn">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HotelListPage;