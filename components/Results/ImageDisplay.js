import { useState, useEffect } from 'react';

export default function ImageDisplay({ bannerbear, isCollection }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [collectionImages, setCollectionImages] = useState([]);

  useEffect(() => {
    if (bannerbear?.status === 'completed' && bannerbear?.type === 'collection') {
      // Process collection images
      let images = [];
      
      // Check for image_urls (direct URLs to each template variation)
      if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
        images = Object.entries(bannerbear.image_urls).map(([key, url]) => ({
          template: key,
          image_url: url,
          image_url_jpg: url.replace(/\.png$/, '.jpg')
        }));
      } 
      // Check for images array (from webhook data)
      else if (bannerbear.images && bannerbear.images.length > 0) {
        images = bannerbear.images.map((img, index) => ({
          template: `image_${index + 1}`,
          image_url: img.image_url,
          image_url_jpg: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg')
        }));
      }
      
      setCollectionImages(images);
    }
  }, [bannerbear]);

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

  return (
    <div className="collection-container">
      <p className="status">
        Collection Status: {bannerbear?.status || 'pending'}
        {bannerbear?.status !== 'completed' && (
          <span className="loading-dots">•••</span>
        )}
      </p>

      {bannerbear?.status === 'completed' && collectionImages.length > 0 && (
        <div className="images-grid">
          {collectionImages.map((image, index) => (
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