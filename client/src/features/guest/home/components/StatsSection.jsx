import './StatsSection.scss';

/**
 * Stats section component
 * Displays statistics about the service
 */
export const StatsSection = () => {
  const stats = [
    { value: '1000+', label: 'Khách sạn' },
    { value: '50+', label: 'Thành phố' },
    { value: '10000+', label: 'Khách hàng hài lòng' },
    { value: '24/7', label: 'Hỗ trợ khách hàng' },
  ];

  return (
    <section className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <h3>{stat.value}</h3>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

