import { useState, useEffect } from 'react';

export default function ImageDisplay({ bannerbear, isCollection }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState(bannerbear);
  const [isPolling, setIsPolling] = useState(false);
  const [bannerBearImages, setBannerBearImages] = useState([]);

  useEffect(() => {
    if (!bannerbear?.uid || status?.status === 'completed') return;

    const pollStatus = async () => {
      try {
        setIsPolling(true);
        const response = await fetch(`/api/status/${bannerbear.uid}?type=${isCollection ? 'collection' : 'single'}`);
        if (!response.ok) {
          console.error('Failed to get status:', response.statusText);
          return;
        }
        
        const newStatus = await response.json();
        console.log('Status update:', newStatus);
        
        // Update status if we have new data
        if (newStatus && (
          newStatus.status !== status?.status ||
          Object.keys(newStatus.image_urls || {}).length > Object.keys(status?.image_urls || {}).length ||
          newStatus.zip_url !== status?.zip_url
        )) {
          console.log('Updating status with new data:', newStatus);
          setStatus(newStatus);
          
          if (newStatus.status === 'completed') {
            setIsPolling(false);
            
            // If we have images data in the response, use it
            if (newStatus.images && newStatus.images.length > 0) {
              setBannerBearImages(newStatus.images);
            }
            // If we have image_urls but no images array, extract them
            else if (newStatus.image_urls && Object.keys(newStatus.image_urls).length > 0) {
              const extractedImages = [];
              
              // Process image_urls by looking for entries that don't end with _jpg
              // Each of these represents one image
              Object.entries(newStatus.image_urls).forEach(([templateId, url]) => {
                if (!templateId.endsWith('_jpg')) {
                  extractedImages.push({
                    template: templateId,
                    image_url: url,
                    image_url_png: url,
                    image_url_jpg: newStatus.image_urls[`${templateId}_jpg`]
                  });
                }
              });
              
              setBannerBearImages(extractedImages);
            }
            // If we still have no images, fetch directly from Bannerbear
            else {
              fetchBannerbearImagesDirectly(newStatus.uid);
            }
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [bannerbear?.uid, status?.status, isCollection]);

  // Function to fetch images directly from Bannerbear
  const fetchBannerbearImagesDirectly = async (uid) => {
    try {
      console.log('Fetching Bannerbear collection directly:', uid);
      const response = await fetch(`/api/direct-images?uid=${uid}&type=collection`);
      if (!response.ok) {
        console.error('Failed to get direct images:', response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('Direct Bannerbear response:', data);
      
      if (data.images && data.images.length > 0) {
        setBannerBearImages(data.images);
      } else if (data.image_urls && Object.keys(data.image_urls).length > 0) {
        // Extract images from image_urls object
        const extractedImages = [];
        
        Object.entries(data.image_urls).forEach(([templateId, url]) => {
          if (!templateId.endsWith('_jpg')) {
            extractedImages.push({
              template: templateId,
              image_url: url,
              image_url_png: url,
              image_url_jpg: data.image_urls[`${templateId}_jpg`]
            });
          }
        });
        
        setBannerBearImages(extractedImages);
      }
    } catch (error) {
      console.error('Error fetching Bannerbear collection directly:', error);
    }
  };

  // Return fallback UI if bannerbear data is missing
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
    const currentStatus = status || bannerbear;
    const isComplete = currentStatus?.status === 'completed';
    const hasImages = currentStatus?.image_urls && Object.keys(currentStatus.image_urls).length > 0;
    const hasBannerBearImages = bannerBearImages && bannerBearImages.length > 0;
    
    console.log('Collection status:', currentStatus);
    console.log('Has extracted images:', hasBannerBearImages, bannerBearImages.length);
    console.log('Has images:', hasImages, Object.keys(currentStatus?.image_urls || {}));

    // When status is complete but we haven't processed images yet, do it now
    useEffect(() => {
      if (isComplete && !hasBannerBearImages && bannerbear?.uid) {
        console.log('Status complete but no images loaded, fetching directly...');
        fetchBannerbearImagesDirectly(bannerbear.uid);
      }
    }, [isComplete, hasBannerBearImages, bannerbear?.uid]);

    return (
      <div className="collection-container">
        <p className="status">
          Collection Status: {currentStatus?.status || 'pending'}
          {!isComplete && (
            <span className="loading-dots">•••</span>
          )}
        </p>

        {/* Display extracted images from Bannerbear if available */}
        {hasBannerBearImages && (
          <div className="images-grid">
            {bannerBearImages.map((image, index) => (
              <div key={index} className="image-card">
                <h4>Design {index + 1}</h4>
                <div className="image-wrapper">
                  <img src={image.image_url} alt={`Design ${index + 1}`} />
                </div>
                <button 
                  className="download-button"
                  onClick={() => downloadImage(image.image_url_png || image.image_url, `property-design-${index + 1}.png`)}
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

        {/* Display images array from status if available and we have no extracted images */}
        {isComplete && !hasBannerBearImages && currentStatus?.images && currentStatus.images.length > 0 && (
          <div className="images-grid">
            {currentStatus.images.map((image, index) => (
              <div key={index} className="image-card">
                <h4>Design {index + 1}</h4>
                <div className="image-wrapper">
                  <img src={image.image_url} alt={`Design ${index + 1}`} />
                </div>
                <button 
                  className="download-button"
                  onClick={() => downloadImage(image.image_url_png || image.image_url, `property-design-${index + 1}.png`)}
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

        {/* Display image_urls object if available and we have no extracted images */}
        {isComplete && !hasBannerBearImages && hasImages && !currentStatus?.images?.length && (
          <div className="images-grid">
            {Object.entries(currentStatus.image_urls).map(([templateId, url], index) => {
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
                    onClick={() => downloadImage(currentStatus.image_urls[`${templateId}_jpg`], `property-design-${index + 1}.jpg`)}
                    disabled={isDownloading}
                  >
                    Download JPG
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isComplete && currentStatus?.zip_url && (
          <div className="download-all">
            <button 
              className="download-button"
              onClick={() => downloadImage(currentStatus.zip_url, 'property-designs.zip')}
              disabled={isDownloading}
            >
              Download All Images (ZIP)
            </button>
          </div>
        )}

        {isComplete && !hasBannerBearImages && !hasImages && !currentStatus?.images?.length && (
          <div className="no-images-message">
            <p>Collection is complete but no images were found. Attempting to fetch directly from Bannerbear...</p>
            <button
              className="refresh-button"
              onClick={() => fetchBannerbearImagesDirectly(bannerbear.uid)}
            >
              Refresh Images
            </button>
            <pre>{JSON.stringify(currentStatus, null, 2)}</pre>
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

          .no-images-message {
            background: #fff3cd;
            border: 1px solid #ffeeba;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
          }
          
          pre {
            background: #f8f9fa;
            padding: 0.5rem;
            border-radius: 4px;
            overflow: auto;
            font-size: 0.8rem;
          }
          
          .refresh-button {
            background: #17a2b8;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            margin: 1rem 0;
            cursor: pointer;
            font-weight: bold;
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