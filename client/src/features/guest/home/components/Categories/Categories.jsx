import "./Categories.scss";
import { useNavigate } from 'react-router-dom';
import { CITIES } from '@/constants/cities';

const Categories = () => {
  const navigate = useNavigate();

  const handleCityClick = (cityName) => {
    navigate(`/hotels?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <div className='categories'>
      <h1>Khám Phá Điểm Đến Hấp Dẫn</h1>
      <p>
        Khám phá những thành phố sôi động, những bãi biển tuyệt đẹp và những 
        điểm đến hấp dẫn tại Việt Nam. Từ thủ đô Hà Nội với văn hóa lâu đời, 
        đến Sài Gòn nhộn nhịp, hay những bãi biển xinh đẹp của Nha Trang và 
        Phú Quốc. Hãy chọn điểm đến lý tưởng cho chuyến du lịch của bạn.
      </p>

      <div className='categories_list'>
        {CITIES.map((city) => {
          const IconComponent = city.icon;
          return (
            <div 
              key={city.id} 
              className='category'
              onClick={() => handleCityClick(city.name)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCityClick(city.name);
                }
              }}
              aria-label={`Khám phá ${city.name}`}
            >
              <img src={city.img} alt={city.name} loading="lazy" />
              <div className="overlay"></div>
              <div className="category_text">
                <div className="category_text_icon">
                  <IconComponent sx={{ fontSize: 40 }} />
                </div>
                <p>{city.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;

