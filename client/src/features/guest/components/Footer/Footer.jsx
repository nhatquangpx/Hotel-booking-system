import React from "react";
import "./Footer.scss";
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";

function Footer() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);

  const handleCityClick = (cityName) => {
    navigate(`/hotels?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__logo-social">
          <div className="footer__logo">
            <img src="/assets/logo_black_horizontal.png" alt="StayJourney Logo" style={{ height: '250px' }} />
          </div>
          <div className="footer__socials">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="footer__links">
          <div className="footer__col">
            <div className="footer__col-title">Điểm đến</div>
            <ul>
              <li onClick={() => handleCityClick('Hà Nội')}>Hà Nội</li>
              <li onClick={() => handleCityClick('Đà Nẵng')}>Đà Nẵng</li>
              <li onClick={() => handleCityClick('TP. Hồ Chí Minh')}>TP. Hồ Chí Minh</li>
              <li onClick={() => handleCityClick('Hội An')}>Hội An</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Hỗ trợ</div>
            <ul>
              <Link to="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li>Câu hỏi thường gặp</li>
              </Link>
              <Link to="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li>Trung tâm trợ giúp</li>
              </Link>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Dành cho khách hàng</div>
            <ul>
              <Link to="/my-bookings" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li>Đặt phòng của tôi</li>
              </Link>
              <Link to={`/profile/${user?.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <li>Tài khoản</li>
              </Link>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Về chúng tôi</div>
            <ul>
              <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
                <li>Giới thiệu</li>
              </Link>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Liên hệ</div>
            <ul>
              <li>Email: stayjourney2025@gmail.com</li>
              <li>Điện thoại: +84 332 915 004</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

