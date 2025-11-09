import './NewsletterSection.scss';

/**
 * Newsletter section component
 * Allows users to subscribe to newsletter
 */
export const NewsletterSection = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    alert('Cảm ơn bạn đã đăng ký!');
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-content">
        <h2>Đăng ký nhận thông tin</h2>
        <p>Nhận thông tin về các ưu đãi đặc biệt và tin tức mới nhất</p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input type="email" placeholder="Nhập email của bạn" required />
          <button type="submit">Đăng ký</button>
        </form>
      </div>
    </section>
  );
};

