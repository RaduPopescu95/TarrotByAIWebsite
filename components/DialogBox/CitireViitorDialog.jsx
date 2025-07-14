import * as React from "react";

import { useApiData } from "../../context/ApiContext";
import { colors } from "../../utils/colors";
import languageDetector from "../../lib/languageDetector";

export default function CitireViitorDialog({
  setImageCard,
  imageCard,
  setItem,
  item,
}) {
  const [open, setOpen] = React.useState(false);
  const detectedLng = languageDetector.detect();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    console.log("item...", item);
    setOpen(false);
    setImageCard("");
    setItem({});
  };
  
  const [isMobile, setIsMobile] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Simple responsive check without MUI
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Set initial values
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Custom Modal Styles */}
      <style jsx>{`
        .future-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          animation: modalFadeIn 0.4s ease-out forwards;
        }
        
        .future-modal-container {
          background: white;
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          transform: scale(0.85) translateY(30px);
          animation: modalSlideIn 0.4s ease-out forwards;
        }
        
        .future-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 25px 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        .future-modal-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        
        .future-modal-title {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .future-modal-title::before {
          content: '🔮';
          font-size: 24px;
        }
        
        .future-close-button {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          font-size: 24px;
          font-weight: bold;
          position: relative;
          z-index: 1;
        }
        
        .future-close-button:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1) rotate(90deg);
        }
        
        .future-modal-content {
          padding: 50px;
          overflow-y: auto;
          max-height: calc(90vh - 95px);
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          text-align: center;
        }
        
        .future-card-container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(103, 126, 234, 0.1);
          margin-bottom: 30px;
        }
        
        .future-card-image {
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          margin-bottom: 30px;
          transition: all 0.4s ease;
          border: 3px solid #f8f9fa;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }
        
        .future-card-image:hover {
          transform: scale(1.05) rotateY(5deg);
          box-shadow: 0 25px 50px rgba(103, 126, 234, 0.3);
        }
        
        .future-card-title {
          color: #333;
          font-size: 36px;
          font-weight: 800;
          margin: 0 0 30px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .future-description-container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
          border-left: 5px solid #667eea;
          position: relative;
        }
        
        .future-description-text {
          text-align: justify;
          font-size: 18px;
          line-height: 1.8;
          color: #444;
          margin: 0;
        }
        
        .future-description-container::before {
          content: '"';
          position: absolute;
          top: 15px;
          left: 20px;
          font-size: 60px;
          color: #667eea;
          opacity: 0.3;
          font-family: Georgia, serif;
        }
        
        @keyframes modalFadeIn {
          to {
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          to {
            transform: scale(1) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .future-modal-overlay {
            padding: 10px;
          }
          
          .future-modal-container {
            max-height: 95vh;
            border-radius: 16px;
          }
          
          .future-modal-header {
            padding: 20px 25px;
          }
          
          .future-modal-content {
            padding: 25px;
          }
          
          .future-modal-title {
            font-size: 22px;
          }
          
          .future-card-title {
            font-size: 28px;
          }
          
          .future-description-text {
            font-size: 16px;
          }
          
          .future-card-container,
          .future-description-container {
            padding: 25px;
          }
        }
      `}</style>

      {imageCard.length > 0 && (
        <div className="future-modal-overlay" onClick={handleClose}>
          <div className="future-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Custom Header */}
            <div className="future-modal-header">
              <h2 className="future-modal-title">Citire Viitor</h2>
              <button className="future-close-button" onClick={handleClose}>
                ×
              </button>
            </div>

            {/* Content */}
            <div className="future-modal-content">
              {/* Card Section */}
              <div className="future-card-container">
                {imageCard && (
                  <img
                    src={imageCard}
                    width={isMobile ? 250 : 350}
                    height={isMobile ? 350 : 450}
                    alt="Tarot Card"
                    className="future-card-image"
                  />
                )}
                
                {item.info && (
                  <h3 className="future-card-title">
                    {detectedLng === "hi"
                      ? item.info.hu.nume
                      : detectedLng === "id"
                        ? item.info.ru.nume
                        : item.info[detectedLng].nume}
                  </h3>
                )}
              </div>

              {/* Description */}
              {item.info && (
                <div className="future-description-container">
                  <p className="future-description-text">
                    {detectedLng === "hi"
                      ? item.info.hu.descriere
                      : detectedLng === "id"
                        ? item.info.ru.descriere
                        : item.info[detectedLng].descriere}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
