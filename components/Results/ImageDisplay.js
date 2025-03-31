import { useState, useEffect } from 'react';

export default function ImageDisplay({ bannerbear, isCollection }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadImage = async (url, filename = 'property-image.jpg') => {
    if (!url) return;
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!bannerbear) {
    return (
      <div className="fallback-message">
        <p>No image data available yet. Please try again.</p>
        <style jsx>{`
          .fallback-message {
            background: #f9f9f9;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
          }
        `}</style>
      </div>
    );
  }

  // Get all template image URLs (they end with _image_url but don't end with _jpg)
  const templateUrls = Object.entries(bannerbear)
    .filter(([key, value]) => key.endsWith('_image_url') && !key.endsWith('_jpg'))
    .map(([key, value]) => ({
      template: key,
      image_url: value,
      image_url_jpg: bannerbear[`${key}_jpg`]
    }));

  return (
    <div className="collection-container">
      <p className="status">
        Collection Status: {bannerbear?.status || 'pending'}
        {bannerbear?.status !== 'completed' && (
          <span className="loading-dots">•••</span>
        )}
      </p>

      {templateUrls.length > 0 && (
        <div className="images-grid">
          {templateUrls.map((image, index) => (
            <div key={image.template} className="image-card">
              <h4>Design {index + 1}</h4>
              <div className="image-wrapper">
                <img src={image.image_url} alt={`Design ${index + 1}`} />
              </div>
              <button 
                className="download-button"
                onClick={() => downloadImage(image.image_url, `property-design-${index + 1}.png`)}
                disabled={isDownloading}
              >
                Download PNG
              </button>
              {image.image_url_jpg && (
                <button 
                  className="download-button secondary"
                  onClick={() => downloadImage(image.image_url_jpg, `property-design-${index + 1}.jpg`)}
                  disabled={isDownloading}
                >
                  Download JPG
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {bannerbear?.zip_url && (
        <div className="download-all">
          <button 
            className="download-button"
            onClick={() => downloadImage(bannerbear.zip_url, 'property-designs.zip')}
            disabled={isDownloading}
          >
            Download All Images (ZIP)
          </button>
        </div>
      )}

      <style jsx>{`
        .collection-container {
          width: 100%;
        }

        .status {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .loading-dots {
          display: inline-block;
          margin-left: 0.5rem;
          animation: pulse 1.5s infinite;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .image-card {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        h4 {
          margin: 0;
          font-size: 1.1rem;
        }

        .image-wrapper {
          width: 100%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .image-wrapper img {
          width: 100%;
          height: auto;
          display: block;
        }

        .download-button {
          padding: 0.8rem 1.5rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
        }

        .download-button.secondary {
          background: #666;
        }

        .download-button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .download-all {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
        }

        .download-all .download-button {
          max-width: 300px;
          background: #28a745;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 