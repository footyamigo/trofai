import { useState, useEffect } from 'react';

export default function ImageDisplay({ bannerbear, isCollection }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState(bannerbear);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!bannerbear?.uid || status?.status === 'completed') return;

    const pollStatus = async () => {
      try {
        setIsPolling(true);
        const response = await fetch(`/api/status/${bannerbear.uid}`);
        if (!response.ok) {
          console.error('Failed to get status:', response.statusText);
          return;
        }
        
        const newStatus = await response.json();
        console.log('Status update:', newStatus);
        
        if (newStatus && (
          newStatus.status !== status?.status ||
          Object.keys(newStatus.image_urls || {}).length > Object.keys(status?.image_urls || {}).length
        )) {
          console.log('Updating status with new data:', newStatus);
          setStatus(newStatus);
          
          if (newStatus.status === 'completed') {
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [bannerbear?.uid, status?.status]);

  if (!bannerbear) return null;

  const downloadImage = async (url, filename = 'property-image.jpg') => {
    if (!url) return;
    
    setIsDownloading(true);
    
    try {
      // For remote images, we need to fetch and convert to blob
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isCollection) {
    return (
      <div className="collection-container">
        <p className="status">
          Collection Status: {bannerbear?.status || 'pending'}
          {bannerbear?.status !== 'completed' && (
            <span className="loading-dots">•••</span>
          )}
        </p>

        {bannerbear?.status === 'completed' && bannerbear?.image_urls && (
          <div className="images-grid">
            {Object.entries(bannerbear.image_urls).map(([templateId, url], index) => {
              // Only show PNG versions, skip JPG versions
              if (templateId.endsWith('_jpg')) return null;
              
              return (
                <div key={templateId} className="image-card">
                  <h4>Design {index + 1}</h4>
                  <div className="image-wrapper">
                    <img src={url} alt={`Design ${index + 1}`} />
                  </div>
                  <button 
                    className="download-button"
                    onClick={() => downloadImage(url, `property-design-${index + 1}.png`)}
                    disabled={isDownloading}
                  >
                    Download PNG
                  </button>
                  <button 
                    className="download-button secondary"
                    onClick={() => downloadImage(bannerbear.image_urls[`${templateId}_jpg`], `property-design-${index + 1}.jpg`)}
                    disabled={isDownloading}
                  >
                    Download JPG
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {bannerbear?.status === 'completed' && bannerbear?.zip_url && (
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

  // Single image display
  return (
    <div className="image-container">
      {bannerbear?.status === 'completed' && bannerbear?.image_url ? (
        <>
          <div className="image-wrapper">
            <img src={bannerbear.image_url} alt="Generated property image" />
          </div>
          
          <div className="download-buttons">
            <button 
              className="download-button"
              onClick={() => downloadImage(bannerbear.image_url_png || bannerbear.image_url, 'property-image.png')}
              disabled={isDownloading}
            >
              Download PNG
            </button>
            {bannerbear.image_url_jpg && (
              <button 
                className="download-button secondary"
                onClick={() => downloadImage(bannerbear.image_url_jpg, 'property-image.jpg')}
                disabled={isDownloading}
              >
                Download JPG
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="loading">
          <p>
            Image is being generated...
            <span className="loading-dots">•••</span>
          </p>
          <p className="image-id">Image ID: {bannerbear?.uid}</p>
        </div>
      )}

      <style jsx>{`
        .image-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
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

        .download-buttons {
          display: flex;
          gap: 1rem;
          width: 100%;
          max-width: 400px;
        }
        
        .download-button {
          padding: 0.8rem 1.5rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          flex: 1;
        }

        .download-button.secondary {
          background: #666;
        }
        
        .download-button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          background: #f9f9f9;
          border-radius: 8px;
          width: 100%;
        }

        .loading p {
          margin: 0;
        }

        .image-id {
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .loading-dots {
          display: inline-block;
          margin-left: 0.5rem;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 