import React from "react";
import "./Footer.scss";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__logo-social">
          <div className="footer__logo">
            <img src="/assets/logo_black_horizontal.png" alt="StayJourney Logo" style={{ height: '250px' }} />
          </div>
          <div className="footer__socials">
            <a href="#" className="footer__icon"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-twitter"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-instagram"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="footer__links">
          <div className="footer__col">
            <div className="footer__col-title">Điểm đến</div>
            <ul>
              <li>Hà Nội</li>
              <li>Đà Nẵng</li>
              <li>TP. Hồ Chí Minh</li>
              <li>Hội An</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Hỗ trợ</div>
            <ul>
              <li>Câu hỏi thường gặp</li>
              <li>Chính sách hủy phòng</li>
              <li>Trung tâm trợ giúp</li>
              <li>Dịch vụ khách hàng</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Dành cho khách hàng</div>
            <ul>
              <li>Đặt phòng của tôi</li>
              <li>Tài khoản</li>
              <li>Khuyến mãi</li>
              <li>Blog du lịch</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Về chúng tôi</div>
            <ul>
              <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}><li>Giới thiệu</li></Link>
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