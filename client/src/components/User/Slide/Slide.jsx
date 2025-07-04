import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./Slide.scss"; 

const Slide = ({
  images = [
    "/assets/slide1.jpg",
    "/assets/slide2.jpg",
    "/assets/slide3.jpg"
  ],
  showTitle = true,
  className = "",
  style = {},
  slideHeight = "100%",
  borderRadius = "0"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
    <div className={`slider-container ${className}`} style={{ height: slideHeight, ...style }}>
      <div
        className="slide-wrapper"
        style={{
          transform: `translateX(-${currentIndex * 100}vw)`
        }}
      >
        {images.map((img, index) => (
          <div
            key={index}
            className="slide"
            style={{
              backgroundImage: `url(${img})`
            }}
          >
            {showTitle && (
              <div className="slide-content">
                <h1>
                  Chào mừng đến với Hotel Booking
                </h1>
                <p>
                  Khám phá và đặt phòng tại những khách sạn tốt nhất Việt Nam. 
                  Với hơn 1000+ khách sạn chất lượng, chúng tôi cam kết mang đến 
                  cho bạn trải nghiệm nghỉ dưỡng tuyệt vời nhất.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="prev-btn" onClick={prevSlide}>
        <FaChevronLeft />
      </button>
      <button className="next-btn" onClick={nextSlide}>
        <FaChevronRight />
      </button>

      <div className="dots-container">
        {images.map((_, index) => (
          <div
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Slide;
