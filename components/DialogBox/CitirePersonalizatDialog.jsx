import * as React from "react";
import { useApiData } from "../../context/ApiContext";
import { colors } from "../../utils/colors";
import languageDetector from "../../lib/languageDetector";

export default function CitirePersonalizatDialog({
  setImageCard,
  imageCard,
  setItem,
  item,
  handleVideoEnd,
}) {
  const [open, setOpen] = React.useState(false);
  const detectedLng = languageDetector.detect();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    console.log("item...", item);
    setOpen(false);

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

  React.useEffect(() => {
    console.log("item in dialog..", item);
  }, []);

  return (
    <>
      {/* Custom Modal Styles */}
      <style jsx>{`
        .modern-modal-overlay {
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
        
        .modern-modal-container {
          background: white;
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 1400px;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          transform: scale(0.85) translateY(30px);
          animation: modalSlideIn 0.4s ease-out forwards;
        }
        
        .modern-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 25px 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        .modern-modal-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        
        .modal-title {
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
        
        .modal-title::before {
          content: '✨';
          font-size: 24px;
        }
        
        .close-button {
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
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1) rotate(90deg);
        }
        
        .modern-modal-content {
          padding: 50px;
          overflow-y: auto;
          max-height: calc(90vh - 95px);
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          align-items: start;
        }
        
        .card-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(103, 126, 234, 0.1);
        }
        
        .card-image {
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          margin-bottom: 25px;
          transition: all 0.4s ease;
          border: 3px solid #f8f9fa;
        }
        
        .card-image:hover {
          transform: scale(1.05) rotateY(5deg);
          box-shadow: 0 25px 50px rgba(103, 126, 234, 0.3);
        }
        
        .card-title {
          color: #333;
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .video-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: white;
          padding: 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(103, 126, 234, 0.1);
        }
        
        .video-player {
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          width: 100%;
          transition: transform 0.3s ease;
        }
        
        .video-player:hover {
          transform: scale(1.02);
        }
        
        .description-section {
          grid-column: 1 / -1;
          margin-top: 30px;
        }
        
        .description-text {
          text-align: justify;
          font-size: 18px;
          line-height: 1.8;
          color: #444;
          padding: 35px;
          background: white;
          border-radius: 20px;
          border-left: 5px solid #667eea;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          position: relative;
        }
        
        .description-text::before {
          content: '"';
          position: absolute;
          top: 10px;
          left: 15px;
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
          .modern-modal-overlay {
            padding: 10px;
          }
          
          .modern-modal-container {
            max-height: 95vh;
            border-radius: 16px;
          }
          
          .modern-modal-header {
            padding: 20px 25px;
          }
          
          .modern-modal-content {
            padding: 25px;
          }
          
          .content-grid {
            grid-template-columns: 1fr;
            gap: 25px;
          }
          
          .modal-title {
            font-size: 22px;
          }
          
          .card-title {
            font-size: 26px;
          }
          
          .description-text {
            font-size: 16px;
            padding: 25px;
          }
          
          .card-section, .video-section {
            padding: 20px;
          }
        }
      `}</style>

      {item.data && (
        <div className="modern-modal-overlay" onClick={handleClose}>
          <div className="modern-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Custom Header */}
            <div className="modern-modal-header">
              {/* <h2 className="modal-title">Citire Personalizată</h2> */}
              <button className="close-button" onClick={handleClose}>
                ×
              </button>
            </div>

            {/* Content */}
            <div className="modern-modal-content">
              <div className="content-grid">
                {/* Card Section */}
                <div className="card-section">
                  <img
                    src={item.data && item.data.carte.image.finalUri}
                    width={isMobile ? 160 : 220}
                    height={isMobile ? 220 : 280}
                    alt="Tarot Card"
                    className="card-image"
                  />
                  <h3 className="card-title">
                    {item.data && (detectedLng === "hi"
                      ? item.data.carte.info.hu.nume
                      : detectedLng === "id"
                        ? item.data.carte.info.ru.nume
                        : item.data.carte.info[detectedLng].nume)}
                  </h3>
                </div>

                {/* Video Section or Text Section */}
                {item.data && (
                  detectedLng === "hi"
                    ? item.data.info.hu.url
                    : detectedLng === "id"
                      ? item.data.info.ru.url
                      : item.data.info[detectedLng].url
                ) ? (
                  <div className="video-section">
                    <video
                      width={isMobile ? "100%" : "100%"}
                      height={isMobile ? "240" : "350"}
                      controls
                      onEnded={handleVideoEnd}
                      autoPlay
                      className="video-player"
                    >
                      <source
                        src={
                          detectedLng === "hi"
                            ? item.data.info.hu.url
                            : detectedLng === "id"
                              ? item.data.info.ru.url
                              : item.data.info[detectedLng].url
                        }
                        type="video/mp4"
                      />
                    </video>
                  </div>
                ) : (
                  <div className="video-section">
                    <div className="description-text">
                      {item.data && (detectedLng === "hi"
                        ? item.data.info.hu.descriere
                        : detectedLng === "id"
                          ? item.data.info.ru.descriere
                          : item.data.info[detectedLng].descriere)}
                    </div>
                  </div>
                )}

                {/* Description - Only show when video exists */}
                {item.data && (
                  detectedLng === "hi"
                    ? item.data.info.hu.url
                    : detectedLng === "id"
                      ? item.data.info.ru.url
                      : item.data.info[detectedLng].url
                ) && (
                  <div className="description-section">
                    <div className="description-text">
                      {item.data && (detectedLng === "hi"
                        ? item.data.info.hu.descriere
                        : detectedLng === "id"
                          ? item.data.info.ru.descriere
                          : item.data.info[detectedLng].descriere)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
