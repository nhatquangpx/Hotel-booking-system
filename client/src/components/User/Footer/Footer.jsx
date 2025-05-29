import React from "react";
import "./Footer.scss";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__subscribe">
        <div className="footer__subscribe-left">
          <h2 className="footer__subscribe-title">Subscribe<br/>Newsletter</h2>
          <div className="footer__subscribe-desc">
            <b>The Travel</b>
            <p>Get inspired! Receive travel discounts, tips and behind the scenes stories.</p>
          </div>
          <form className="footer__subscribe-form">
            <input type="email" placeholder="Your email address" className="footer__input" />
            <button type="submit" className="footer__button">Subscribe</button>
          </form>
        </div>
        <div className="footer__subscribe-right">
          {/* SVG hộp thư minh họa */}
          <svg width="260" height="180" viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="60" y="30" width="180" height="105" rx="52" fill="#22372B" stroke="#5ED6B3" strokeWidth="12"/>
            <rect x="180" y="90" width="90" height="30" fill="#FF8C8C"/>
            <rect x="120" y="135" width="30" height="45" fill="#B28B7A"/>
            <rect x="150" y="135" width="30" height="45" fill="#8C6B5C"/>
            <rect x="60" y="30" width="120" height="105" rx="52" fill="#5A6A6A"/>
          </svg>
        </div>
      </div>
      <div className="footer__main">
        <div className="footer__logo-social">
          <div className="footer__logo">g<span className="footer__logo-o">o</span>lobe</div>
          <div className="footer__socials">
            <a href="#" className="footer__icon"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-twitter"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-instagram"></i></a>
            <a href="#" className="footer__icon"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="footer__links">
          <div className="footer__col">
            <div className="footer__col-title">Our Destinations</div>
            <ul>
              <li>Canada</li>
              <li>Alaska</li>
              <li>France</li>
              <li>Iceland</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Our Activities</div>
            <ul>
              <li>Northern Lights</li>
              <li>Cruising & sailing</li>
              <li>Multi-activities</li>
              <li>Kayaking</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Travel Blogs</div>
            <ul>
              <li>Bali Travel Guide</li>
              <li>Sri Lanka Travel Guide</li>
              <li>Peru Travel Guide</li>
              <li>Bali Travel Guide</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">About Us</div>
            <ul>
              <li>Our Story</li>
              <li>Work with us</li>
            </ul>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Contact Us</div>
            <ul>
              <li>Our Story</li>
              <li>Work with us</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 