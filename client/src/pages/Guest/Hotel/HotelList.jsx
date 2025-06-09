import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './HotelListPage.scss';

const HotelListPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    city: '',
    starRating: ''
  });

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        );
        console.log('Active filters:', activeFilters);
        const response = await api.userHotel.getAllHotels(activeFilters);
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Navbar />
      <div className="hotel-list-container">
        <div className="filter-section">
          <h2>Tìm kiếm khách sạn</h2>
          <div className="filter-form">
            <div className="filter-item">
              <label htmlFor="city">Thành phố</label>
              <input
                type="text"
                id="city"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                placeholder="Nhập tên thành phố"
              />
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
          <h1>Danh sách khách sạn</h1>
          
          {loading && <div className="loading">Đang tải...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && Array.isArray(hotels) && hotels.length === 0 && (
            <div className="no-hotels">Không tìm thấy khách sạn nào</div>
          )}
          
          <div className="hotel-grid">
            {hotels && hotels.map((hotel) => (
              <div className="hotel-card" key={hotel._id}>
                <div className="hotel-image">
                  <img 
                    src={hotel.images && hotel.images[0] || 'https://via.placeholder.com/300x200?text=Không+có+hình'} 
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