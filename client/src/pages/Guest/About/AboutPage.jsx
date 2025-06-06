import Navbar from "../../../components/User/Navbar/Navbar"
import Footer from "../../../components/User/Footer/Footer"
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaHeart, FaThumbsUp, FaGlobe, FaStar } from "react-icons/fa"
import "./AboutPage.scss"

const AboutPage = () => {
  return (
    <>
      <Navbar />
      <div className="about-container">
        <div className="about-hero">
          <div className="hero-content">
            <h1>Về StayJourney</h1>
            <p>Trải nghiệm du lịch tuyệt vời với dịch vụ đặt phòng hàng đầu</p>
          </div>
        </div>
        
        <div className="about-section">
          <div className="about-content">
            <h2>Sứ mệnh của chúng tôi</h2>
            <p>StayJourney ra đời với sứ mệnh mang đến cho khách hàng những trải nghiệm du lịch tuyệt vời nhất với dịch vụ đặt phòng khách sạn chất lượng cao, đa dạng về lựa chọn và giá cả phải chăng.</p>
            
            <p>Chúng tôi luôn cố gắng kết nối du khách với những nơi lưu trú tốt nhất, từ khách sạn 5 sao sang trọng đến những homestay ấm cúng, đảm bảo mọi hành trình của bạn đều trở nên đáng nhớ.</p>
          </div>
          
          <div className="about-image">
            <img src="/assets/about-mission.jpg" alt="Sứ mệnh của StayJourney" />
          </div>
        </div>
        
        <div className="about-section reverse">
          <div className="about-content">
            <h2>Giá trị cốt lõi</h2>
            <div className="values-grid">
              <div className="value-item">
                <div className="value-icon"><FaStar /></div>
                <h3>Chất lượng</h3>
                <p>Cam kết mang đến dịch vụ và trải nghiệm tốt nhất cho khách hàng.</p>
              </div>
              <div className="value-item">
                <div className="value-icon"><FaHeart /></div>
                <h3>Tin cậy</h3>
                <p>Xây dựng mối quan hệ dựa trên sự minh bạch và uy tín.</p>
              </div>
              <div className="value-item">
                <div className="value-icon"><FaGlobe /></div>
                <h3>Đổi mới</h3>
                <p>Không ngừng cải tiến và phát triển để đáp ứng nhu cầu thay đổi.</p>
              </div>
              <div className="value-item">
                <div className="value-icon"><FaThumbsUp /></div>
                <h3>Trách nhiệm</h3>
                <p>Có trách nhiệm với cộng đồng và môi trường trong mọi hoạt động.</p>
              </div>
            </div>
          </div>
          
          <div className="about-image">
            <img src="/assets/slide2.jpg" alt="Giá trị cốt lõi" />
          </div>
        </div>
        
        <div className="team-section">
          <h2>Đội ngũ của chúng tôi</h2>
          <p className="team-intro">StayJourney được thành lập bởi những chuyên gia đam mê về du lịch và công nghệ, với mong muốn tạo ra nền tảng đặt phòng tiện lợi và đáng tin cậy nhất.</p>
          
          <div className="team-grid">
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/team-member2.jpg" alt="CEO" />
              </div>
              <h3>Đoàn Nhật Quang</h3>
              <p className="member-title">Nhà sáng lập & CEO</p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/team-member1.jpg" alt="COO" />
              </div>
              <h3>Đoàn Nhật Quang</h3>
              <p className="member-title">Giám đốc vận hành</p>
            </div>
            <div className="team-member">
              <div className="member-image">
                <img src="/assets/team-member3.jpg" alt="CTO" />
              </div>
              <h3>Đoàn Nhật Quang</h3>
              <p className="member-title">Giám đốc công nghệ</p>
            </div>
          </div>
        </div>
        
        <div className="contact-section">
          <h2>Liên hệ với chúng tôi</h2>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon"><FaMapMarkerAlt /></div>
              <h3>Địa chỉ</h3>
              <p>Số 1 Đại Cồ Việt, Hà Nội</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><FaEnvelope /></div>
              <h3>Email</h3>
              <p>stayjourney2025@gmail.com</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon"><FaPhone /></div>
              <h3>Điện thoại</h3>
              <p>+84 332 915 004</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default AboutPage 