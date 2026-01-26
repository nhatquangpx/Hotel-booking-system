import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ImageModal.scss';

/**
 * ImageModal Component
 * Fullscreen image viewer modal
 */
const ImageModal = ({ isOpen, images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || !images || images.length === 0) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="image-modal-overlay" onClick={handleOverlayClick}>
      <div className="image-modal-content">
        <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
          <FaTimes />
        </button>

        {images.length > 1 && (
          <>
            <button className="modal-nav-btn prev-btn" onClick={prevImage} aria-label="Ảnh trước">
              <FaChevronLeft />
            </button>
            <button className="modal-nav-btn next-btn" onClick={nextImage} aria-label="Ảnh sau">
              <FaChevronRight />
            </button>
            <div className="modal-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}

        <div className="modal-image-container">
          <img src={images[currentIndex]} alt={`Image ${currentIndex + 1}`} />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
