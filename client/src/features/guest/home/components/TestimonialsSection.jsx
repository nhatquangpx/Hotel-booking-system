import { IMAGE_PATHS } from '@/constants/images';
import './TestimonialsSection.scss';

/**
 * Testimonials section component
 * Displays customer reviews/testimonials
 */
export const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: 'Dịch vụ tuyệt vời, đặt phòng dễ dàng và nhanh chóng.',
      author: 'Lê Quỳnh',
      role: 'Khách hàng thân thiết',
      image: IMAGE_PATHS.TESTIMONIAL_1,
    },
    {
      quote: 'Trải nghiệm tuyệt vời! Giá cả hợp lý và dịch vụ chuyên nghiệp.',
      author: 'Phạm Đông',
      role: 'Khách hàng mới',
      image: IMAGE_PATHS.TESTIMONIAL_2,
    },
    {
      quote: 'Tôi nhất định sẽ quay lại lần nữa, một chuyến đi đáng nhớ.',
      author: 'Nguyễn Khánh Toàn',
      role: 'Khách hàng mới',
      image: IMAGE_PATHS.TESTIMONIAL_3,
    },
  ];

  return (
    <section className="testimonials-section">
      <h2>Khách hàng nói gì về chúng tôi?</h2>
      <div className="testimonials-grid">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="testimonial-item">
            <div className="testimonial-content">
              <p>"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <img src={testimonial.image} alt={testimonial.author} />
                <div>
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

