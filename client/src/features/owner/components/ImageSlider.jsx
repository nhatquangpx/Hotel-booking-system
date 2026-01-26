import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ImageSlider.scss';

/**
 * ImageSlider Component
 * Simple image slider for hotel images
 */
const ImageSlider = ({ images, onImageClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="image-slider">
      <div className="slider-wrapper">
        {images.map((img, index) => (
          <div
            key={index}
            className={`slide ${index === currentIndex ? 'active' : ''}`}
            onClick={() => onImageClick?.(currentIndex)}
          >
            <img src={img} alt={`Slide ${index + 1}`} />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button className="slider-btn prev-btn" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          <button className="slider-btn next-btn" onClick={nextSlide}>
            <FaChevronRight />
          </button>
          <div className="slider-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="slider-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider;
