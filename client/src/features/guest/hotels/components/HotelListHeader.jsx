/**
 * Hotel List Header component
 * Displays the title based on current filters
 */
export const HotelListHeader = ({ filters }) => {
  const getTitle = () => {
    if (filters.search) {
      return `Kết quả tìm kiếm cho "${filters.search}"`;
    }
    if (filters.name) {
      return `Kết quả tìm kiếm cho "${filters.name}"`;
    }
    if (filters.city) {
      return `Khách sạn tại ${filters.city}`;
    }
    return 'Danh sách khách sạn';
  };

  return <h1>{getTitle()}</h1>;
};

