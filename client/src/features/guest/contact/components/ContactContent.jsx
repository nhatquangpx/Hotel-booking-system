import { useState } from 'react';
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaClock, FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import { IMAGE_PATHS } from '../../../../constants/images';

/**
 * Contact Content component
 * Main content for contact page
 */
export const ContactContent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-container">
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Liên hệ với chúng tôi</h1>
          <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>
      </div>

      <div className="contact-main">
        <div className="contact-info">
          <h2>Thông tin liên hệ</h2>
          <div className="info-items">
            <div className="info-item">
              <div className="icon">
                <FaMapMarkerAlt />
              </div>
              <div className="content">
                <h3>Địa chỉ</h3>
                <p>Số 1 Đại Cồ Việt, Hà Nội</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon">
                <FaEnvelope />
              </div>
              <div className="content">
                <h3>Email</h3>
                <p>stayjourney2025@gmail.com</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon">
                <FaPhone />
              </div>
              <div className="content">
                <h3>Điện thoại</h3>
                <p>+84 332 915 004</p>
              </div>
            </div>
            
            <div className="info-item">
              <div className="icon">
                <FaClock />
              </div>
              <div className="content">
                <h3>Giờ làm việc</h3>
                <p>Thứ Hai - Thứ Sáu: 8:00 - 22:00</p>
                <p>Thứ Bảy - Chủ Nhật: 7:00 - 23:00</p>
              </div>
            </div>
          </div>
          
          <div className="social-links">
            <h3>Kết nối với chúng tôi</h3>
            <div className="social-icons">
              <a href="https://www.facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://x.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
              <a href="https://www.linkedin.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>
        
        <div className="contact-form">
          <h2>Gửi tin nhắn cho chúng tôi</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Họ và tên</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên của bạn" 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn" 
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại của bạn" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Tiêu đề</label>
              <input 
                type="text" 
                id="subject" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Nhập tiêu đề tin nhắn" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Nội dung tin nhắn</label>
              <textarea 
                id="message" 
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5" 
                placeholder="Nhập nội dung tin nhắn của bạn" 
                required
              ></textarea>
            </div>
            
            <button type="submit" className="submit-btn">Gửi tin nhắn</button>
          </form>
        </div>
      </div>
      
      <div className="map-section">
        <h2>Vị trí của chúng tôi</h2>
        <div className="map-container">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1862.3354292943043!2d105.84189920470483!3d21.00582691271613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ac71294bf0ab%3A0xc7e2d20e5e04a9da!2zxJDhuqFpIEjhu41jIELDoWNoIEtob2EgSMOgIE7hu5lp!5e0!3m2!1svi!2sus!4v1748368615690!5m2!1svi!2sus" 
            width="100%" 
            height="450" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            title="Location Map">
          </iframe>
        </div>
      </div>
      
      <div className="faq-section">
        <h2>Câu hỏi thường gặp</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>Làm thế nào để đặt phòng trên StayJourney?</h3>
            <p>Bạn có thể dễ dàng đặt phòng trên StayJourney bằng cách tìm kiếm khách sạn, chọn phòng phù hợp, và hoàn tất thanh toán theo hướng dẫn trên trang web hoặc ứng dụng của chúng tôi.</p>
          </div>
          
          <div className="faq-item">
            <h3>Chính sách hủy đặt phòng như thế nào?</h3>
            <p>Chính sách hủy đặt phòng sẽ phụ thuộc vào từng khách sạn và loại phòng bạn đặt. Thông tin chi tiết về chính sách hủy sẽ được hiển thị rõ ràng khi bạn đặt phòng.</p>
          </div>
          
          <div className="faq-item">
            <h3>Tôi có thể thay đổi thông tin đặt phòng không?</h3>
            <p>Có, bạn có thể thay đổi thông tin đặt phòng bằng cách đăng nhập vào tài khoản và truy cập phần "Đặt phòng của tôi". Tùy thuộc vào chính sách của khách sạn, một số thay đổi có thể phát sinh phí.</p>
          </div>
          
          <div className="faq-item">
            <h3>StayJourney có ứng dụng di động không?</h3>
            <p>Chúng tôi vẫn đang phát triển ứng dụng di động, hãy theo dõi trang web của chúng tôi để biết thêm thông tin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

