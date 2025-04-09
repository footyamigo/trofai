import { useState, useEffect } from 'react';

export default function ImageDisplay({ bannerbear, isCollection, propertyId }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [collectionImages, setCollectionImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // If bannerbear is still pending, fetch the latest status
  useEffect(() => {
    async function fetchLatestStatus() {
      if (bannerbear?.uid && bannerbear?.status !== 'completed') {
        setIsLoading(true);
        setLoadError(null);
        
        try {
          // Determine if this is a collection or single image
          const type = bannerbear.template_set ? 'collection' : 'image';
          
          // Add propertyId to query if available
          const propertyIdParam = propertyId ? `&propertyId=${propertyId}` : '';
          
          // Make API call to get latest status
          const response = await fetch(`/api/direct-images?uid=${bannerbear.uid}&type=${type}${propertyIdParam}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch latest status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Latest Bannerbear status:', data.status);
          
          // If data is now completed, update our local state
          if (data.status === 'completed') {
            // Replace the bannerbear object with the latest data
            Object.assign(bannerbear, data);
          }
        } catch (error) {
          console.error('Error fetching latest status:', error);
          setLoadError(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchLatestStatus();
  }, [bannerbear?.uid, bannerbear?.status, propertyId]);
  
  useEffect(() => {
    if (bannerbear?.status === 'completed') {
      // Process collection images
      let images = [];
      
      // Check for image_urls (direct URLs to each template variation)
      if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
        console.log('Found image_urls:', Object.keys(bannerbear.image_urls).length);
        
        images = Object.entries(bannerbear.image_urls)
          .filter(([key, url]) => !key.endsWith('_jpg')) // Exclude JPG entries as we'll handle them separately
          .map(([key, url]) => {
            // Extract template name from the key (remove the _image_url suffix)
            const templateName = key.replace('_image_url', '');
            
            // Find matching JPG URL if available
            const jpgKey = `${key}_jpg`;
            const jpgUrl = bannerbear.image_urls[jpgKey];
            
            return {
              template: templateName,
              template_key: key,
              image_url: url,
              image_url_jpg: jpgUrl || url.replace(/\.png$/, '.jpg')
            };
          });
      } 
      // Check for images array (from webhook data)
      else if (bannerbear.images && bannerbear.images.length > 0) {
        console.log('Found images array:', bannerbear.images.length);
        
        images = bannerbear.images.map((img, index) => {
          // Try to extract template name if available, otherwise use index
          const templateName = img.template || `Design ${index + 1}`;
          
          return {
            template: templateName,
            image_url: img.image_url,
            image_url_jpg: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg'),
            image_url_png: img.image_url_png || img.image_url
          };
        });
      }
      
      console.log('Processed images:', images.length);
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

  // Helper to format template name for display
  const formatTemplateName = (templateKey) => {
    const name = templateKey.replace(/^template_/, '').replace(/_image_url$/, '');
    // Convert camelCase or snake_case to readable format
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ')         // Replace underscores with spaces
      .split(' ')                 // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
      .join(' ');                 // Join back
  };

  return (
    <div className="collection-container">
      <p className="status">
        Collection Status: {bannerbear?.status || 'pending'}
        {bannerbear?.status !== 'completed' && (
          <span className="loading-dots">•••</span>
        )}
        {isLoading && <span className="loading-message"> (Checking status...)</span>}
        {loadError && <span className="error-message"> (Error: {loadError})</span>}
      </p>

      {bannerbear?.status === 'completed' && collectionImages.length > 0 && (
        <div className="images-grid">
          {collectionImages.map((image, index) => (
            <div key={image.template_key || image.template || index} className="image-card">
              <h4>{formatTemplateName(image.template)}</h4>
              <div className="image-wrapper">
                <img src={image.image_url} alt={`Design ${index + 1}`} />
              </div>
              <button 
                className="download-button"
                onClick={() => downloadImage(image.image_url_png || image.image_url, `property-${formatTemplateName(image.template)}.png`)}
                disabled={isDownloading}
              >
                Download PNG
              </button>
              {image.image_url_jpg && (
                <button 
                  className="download-button secondary"
                  onClick={() => downloadImage(image.image_url_jpg, `property-${formatTemplateName(image.template)}.jpg`)}
                  disabled={isDownloading}
                >
                  Download JPG
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {bannerbear?.status === 'completed' && collectionImages.length === 0 && (
        <div className="no-images">
          <p>No individual images found in the collection. You can still download the ZIP file with all images.</p>
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
        
        .loading-message {
          font-style: italic;
          color: #666;
        }
        
        .error-message {
          color: #e53e3e;
          font-size: 0.9rem;
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
          background: #62d76b;
          color: black;
          border: 2px solid black;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          width: 100%;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          transition: all 0.2s ease;
        }

        .download-button:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }

        .download-button.secondary {
          background: #62d76b;
          color: black;
        }

        .download-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
        }

        .download-all {
          margin-top: 2rem;
          display: flex;
          justify-content: center;
        }

        .download-all .download-button {
          max-width: 300px;
        }
        
        .no-images {
          background: #f9f9f9;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 2rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
} 