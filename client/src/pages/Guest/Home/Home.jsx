import Navbar from "../../../components/User/Navbar/Navbar"
import Slide from "../../../components/User/Slide/Slide"
import Categories from "../../../components/User/Categories/Categories"
import FeaturedHotels from "../../../components/User/FeaturedHotels/FeaturedHotels"
import Footer from "../../../components/User/Footer/Footer"
import "./HomePage.scss"
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const HomePage = () => {
  return (
    <div className="homepage-container">
      <Navbar/>
      <div style={{ height: '100px' }}></div>
      <div className="homepage-content">
        <Slide/>
        <Categories/>
        <FeaturedHotels/>

        {/* Phần lợi ích */}
        <section className="benefits-section">
          <h2>Tại sao chọn chúng tôi?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <CheckCircleIcon className="benefit-icon" />
              <h3>Đặt phòng dễ dàng</h3>
              <p>Quy trình đặt phòng đơn giản, nhanh chóng chỉ với vài bước</p>
            </div>
            <div className="benefit-item">
              <SecurityIcon className="benefit-icon" />
              <h3>Thanh toán an toàn</h3>
              <p>Hệ thống thanh toán bảo mật, đa dạng phương thức</p>
            </div>
            <div className="benefit-item">
              <SupportAgentIcon className="benefit-icon" />
              <h3>Hỗ trợ 24/7</h3>
              <p>Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc</p>
            </div>
            <div className="benefit-item">
              <LocalOfferIcon className="benefit-icon" />
              <h3>Giá tốt nhất</h3>
              <p>Cam kết giá tốt nhất thị trường với nhiều ưu đãi hấp dẫn</p>
            </div>
          </div>
        </section>

        {/* Phần đánh giá từ khách hàng */}
        <section className="testimonials-section">
          <h2>Khách hàng nói gì về chúng tôi?</h2>
          <div className="testimonials-grid">
            <div className="testimonial-item">
              <div className="testimonial-content">
                <p>"Dịch vụ tuyệt vời, đặt phòng dễ dàng và nhanh chóng."</p>
                <div className="testimonial-author">
                  <img src="/assets/fb1.jpg" alt="User" />
                  <div>
                    <h4>Lê Quỳnh</h4>
                    <p>Khách hàng thân thiết</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="testimonial-item">
              <div className="testimonial-content">
                <p>"Trải nghiệm tuyệt vời! Giá cả hợp lý và dịch vụ chuyên nghiệp."</p>
                <div className="testimonial-author">
                  <img src="/assets/fb2.jpg" alt="User" />
                  <div>
                    <h4>Phạm Đông</h4>
                    <p>Khách hàng mới</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="testimonial-item">
              <div className="testimonial-content">
                <p>"Tôi nhất định sẽ quay lại lần nữa, một chuyến đi đáng nhớ."</p>
                <div className="testimonial-author">
                  <img src="/assets/fb3.jpg" alt="User" />
                  <div>
                    <h4>Nguyễn Khánh Toàn</h4>
                    <p>Khách hàng mới</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>1000+</h3>
              <p>Khách sạn</p>
            </div>
            <div className="stat-item">
              <h3>50+</h3>
              <p>Thành phố</p>
            </div>
            <div className="stat-item">
              <h3>10000+</h3>
              <p>Khách hàng hài lòng</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Hỗ trợ khách hàng</p>
            </div>
          </div>
        </section>

        <section className="newsletter-section">
          <div className="newsletter-content">
            <h2>Đăng ký nhận thông tin</h2>
            <p>Nhận thông tin về các ưu đãi đặc biệt và tin tức mới nhất</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Nhập email của bạn" />
              <button type="submit">Đăng ký</button>
            </form>
          </div>
        </section>
      </div>
      <Footer/>
    </div>
  )
}

export default HomePage