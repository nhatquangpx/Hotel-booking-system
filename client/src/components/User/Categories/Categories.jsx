import "./Categories.scss";
import { Link, useNavigate } from 'react-router-dom';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LandscapeIcon from '@mui/icons-material/Landscape';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PoolIcon from '@mui/icons-material/Pool';
import VillaIcon from '@mui/icons-material/Villa';

const Categories = () => {
  const navigate = useNavigate();

  const cities = [
    {
      id: 1,
      name: "Hà Nội",
      img: "assets/hanoi.jpg",
      icon: <LocationCityIcon sx={{ fontSize: 40 }} />
    },
    {
      id: 2,
      name: "Hồ Chí Minh",
      img: "assets/hochiminh.jpg",
      icon: <LocationCityIcon sx={{ fontSize: 40 }} />
    },
    {
      id: 3,
      name: "Đà Nẵng",
      img: "assets/danang.jpg",
      icon: <BeachAccessIcon sx={{ fontSize: 40 }} />
    },
    {
      id: 4,
      name: "Hải Phòng",
      img: "assets/haiphong.jpg",
      icon: <DirectionsBoatIcon sx={{ fontSize: 40 }} />
    },
    {
      id: 5,
      name: "Nha Trang",
      img: "assets/nhatrang.jpg",
      icon: <PoolIcon sx={{ fontSize: 40 }} />
    },
    {
      id: 6,
      name: "Phú Quốc",
      img: "assets/phuquoc.jpg",
      icon: <VillaIcon sx={{ fontSize: 40 }} />
    }
  ];

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
        {cities.map((city) => (
          <div 
            key={city.id} 
            className='category'
            onClick={() => handleCityClick(city.name)}
            style={{ cursor: 'pointer' }}
          >
            <img src={city.img} alt={city.name} />
            <div className="overlay"></div>
            <div className="category_text">
              <div className="category_text_icon">{city.icon}</div>
              <p>{city.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
