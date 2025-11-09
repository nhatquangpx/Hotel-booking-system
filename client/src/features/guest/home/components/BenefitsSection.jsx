import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import './BenefitsSection.scss';

/**
 * Benefits section component
 * Displays why choose us benefits
 */
export const BenefitsSection = () => {
  const benefits = [
    {
      icon: CheckCircleIcon,
      title: 'Đặt phòng dễ dàng',
      description: 'Quy trình đặt phòng đơn giản, nhanh chóng chỉ với vài bước',
    },
    {
      icon: SecurityIcon,
      title: 'Thanh toán an toàn',
      description: 'Hệ thống thanh toán bảo mật, đa dạng phương thức',
    },
    {
      icon: SupportAgentIcon,
      title: 'Hỗ trợ 24/7',
      description: 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc',
    },
    {
      icon: LocalOfferIcon,
      title: 'Giá tốt nhất',
      description: 'Cam kết giá tốt nhất thị trường với nhiều ưu đãi hấp dẫn',
    },
  ];

  return (
    <section className="benefits-section">
      <h2>Tại sao chọn chúng tôi?</h2>
      <div className="benefits-grid">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <div key={index} className="benefit-item">
              <IconComponent className="benefit-icon" />
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

