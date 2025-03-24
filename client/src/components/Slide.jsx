import React, { useState, useEffect } from "react";
import "../styles/Slide.scss";

const images = [
  "/assets/slide1.jpg",
  "/assets/slide2.jpg",
  "/assets/slide3.jpg",
];

const Slide = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // 3 giây đổi ảnh

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slider-container">
      <div
        className="slide-wrapper"
        style={{ transform: `translateX(-${currentIndex * 100}vw)` }}
      >
        {images.map((img, index) => (
          <div key={index} className="slide" style={{ backgroundImage: `url(${img})` }}>
            <h1>Khám phá thế giới theo cách của bạn – Đặt phòng dễ dàng, trải nghiệm đáng nhớ!</h1>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slide;
