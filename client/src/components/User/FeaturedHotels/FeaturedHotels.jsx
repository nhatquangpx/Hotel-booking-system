import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Rating } from '@mui/material';
import { styled } from '@mui/material/styles';
import api from '../../../apis';
import './FeaturedHotels.scss';

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#ffd700',
  },
  '& .MuiRating-iconHover': {
    color: '#ffd700',
  },
});

const FeaturedHotels = () => {
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        const response = await api.userHotel.getFeaturedHotels();
        // Kiểm tra response và set data
        if (response && Array.isArray(response)) {
          setFeaturedHotels(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setFeaturedHotels(response.data);
        } else {
          setFeaturedHotels([]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching featured hotels:', error);
        setError('Không thể tải danh sách khách sạn. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchFeaturedHotels();
  }, []);

  const handlePrevClick = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, featuredHotels.length - 5) : prevIndex - 1
    );
  };

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= featuredHotels.length - 5 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!Array.isArray(featuredHotels) || featuredHotels.length === 0) {
    return <div className="no-hotels">Không có khách sạn nổi bật nào.</div>;
  }

  // Tính toán danh sách khách sạn hiển thị
  const visibleHotels = featuredHotels.slice(currentIndex, currentIndex + 5);

  return (
    <div className="featured-hotels">
      <h1>Khách Sạn Nổi Bật</h1>
      <p>
        Khám phá những khách sạn 5 sao sang trọng bậc nhất, mang đến trải nghiệm 
        nghỉ dưỡng đẳng cấp với dịch vụ hoàn hảo và tiện nghi hiện đại.
      </p>

      <div className="featured-hotels-container">
        {featuredHotels.length > 5 && (
          <button className="nav-button prev" onClick={handlePrevClick}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        
        <div className="featured-hotels-list">
          {visibleHotels.map((hotel) => (
            <Link to={`/hotels/${hotel._id}`} key={hotel._id}>
              <div className="hotel-card">
                <div className="hotel-image">
                  <img 
                    src={hotel.images[0]?.startsWith('http') 
                      ? hotel.images[0] 
                      : `${import.meta.env.VITE_API_URL}${hotel.images[0]}`} 
                    alt={hotel.name} 
                  />
                  <div className="hotel-rating">
                    <StyledRating
                      value={hotel.starRating}
                      readOnly
                      precision={0.5}
                      icon={<FontAwesomeIcon icon={faStar} />}
                      emptyIcon={<FontAwesomeIcon icon={faStar} />}
                    />
                  </div>
                </div>
                <div className="hotel-info">
                  <h3>{hotel.name}</h3>
                  <p className="hotel-location">
                    {hotel.address.street}, {hotel.address.city}
                  </p>
                  <p className="hotel-description">{hotel.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {featuredHotels.length > 5 && (
          <button className="nav-button next" onClick={handleNextClick}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FeaturedHotels; 