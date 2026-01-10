import { useState, useEffect } from 'react';
import { getImageUrl } from '@/constants/images';
import './HotelGallery.scss';

/**
 * Hotel Gallery Component
 * Hiển thị hình ảnh khách sạn với ảnh chính và ảnh phụ
 */
const HotelGallery = ({ hotel }) => {
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    if (hotel?.images && hotel.images.length > 0) {
      setMainImage(getImageUrl(hotel.images[0]));
    }
  }, [hotel]);

  const handleSubImageClick = (imageSrc) => {
    setMainImage(getImageUrl(imageSrc));
  };

  if (!hotel) return null;

  return (
    <div className="hotel-gallery">
      {hotel.images && hotel.images.length > 0 ? (
        <>
          <div className="main-image">
            <img src={mainImage} alt={`${hotel.name} - Ảnh chính`} />
          </div>
          {hotel.images.length > 1 && (
            <div className="sub-images">
              {hotel.images
                .filter(image => getImageUrl(image) !== mainImage)
                .map((image, index) => (
                  <div 
                    className="sub-image-item" 
                    key={index} 
                    onClick={() => handleSubImageClick(image)}
                  >
                    <img 
                      src={getImageUrl(image)} 
                      alt={`${hotel.name} - Ảnh phụ ${index + 2}`} 
                    />
                  </div>
                ))}
            </div>
          )}
        </>
      ) : (
        <div className="main-image">
          <img 
            src="https://via.placeholder.com/800x500?text=Không+có+hình" 
            alt={hotel.name} 
          />
        </div>
      )}
    </div>
  );
};

export default HotelGallery;

