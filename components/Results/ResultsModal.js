import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiShare2 } from 'react-icons/fi';

export default function ResultsModal({ isOpen, onClose, results }) {
  const [activeTab, setActiveTab] = useState('images');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedCaptionOption, setSelectedCaptionOption] = useState('main');
  const [editedCaptions, setEditedCaptions] = useState({
    main: '',
    alternative: ''
  });

  // Initialize edited captions from props when results change
  useEffect(() => {
    if (!results) return;
    
    setEditedCaptions({
      main: results.captionOptions?.main || results.caption || '',
      alternative: results.captionOptions?.alternative || ''
    });
  }, [results]);

  // Early return after hooks are defined
  if (!results || !results.bannerbear) return null;
  
  const { bannerbear, caption, captionOptions } = results;
  
  // Get the current caption based on selection or fallback
  const currentCaption = selectedCaptionOption === 'main' 
    ? editedCaptions.main
    : editedCaptions.alternative;
  
  // Check if we have alternative caption option
  const hasAlternativeCaption = captionOptions && captionOptions.alternative;
  
  // Format template name
  const formatTemplateName = (templateName) => {
    if (!templateName) return 'Property Image';
    
    return templateName
      .replace(/^template_/, '')
      .replace(/_image_url$/, '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Extract images from bannerbear data
  const processImages = () => {
    let images = [];
    
    if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
      images = Object.entries(bannerbear.image_urls)
        .filter(([key]) => !key.endsWith('_jpg'))
        .map(([key, url]) => {
          const templateName = key.replace('_image_url', '');
          const jpgKey = `${key}_jpg`;
          const jpgUrl = bannerbear.image_urls[jpgKey];
          
          return {
            template: templateName,
            name: formatTemplateName(templateName),
            url: url,
            jpgUrl: jpgUrl || url.replace(/\.png$/, '.jpg')
          };
        });
    } 
    else if (bannerbear.images && bannerbear.images.length > 0) {
      images = bannerbear.images.map((img, index) => {
        const templateName = img.template || `Design ${index + 1}`;
        
        return {
          template: templateName,
          name: formatTemplateName(templateName),
          url: img.image_url,
          jpgUrl: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg')
        };
      });
    }
    
    return images;
  };
  
  const images = processImages();
  const selectedImage = images[selectedImageIndex] || {};
  
  // Handle image download
  const downloadImage = async (url, filename) => {
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
  
  // Handle zip download
  const downloadZip = () => {
    if (bannerbear.zip_url) {
      downloadImage(bannerbear.zip_url, 'property-designs.zip');
    }
  };
  
  // Handle caption copy
  const copyCaption = () => {
    if (currentCaption) {
      navigator.clipboard.writeText(currentCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    }
  };
  
  // Handle caption option switch
  const handleCaptionOptionChange = (option) => {
    setSelectedCaptionOption(option);
  };
  
  // Handle caption editing
  const handleCaptionChange = (e) => {
    const updatedValue = e.target.value;
    setEditedCaptions({
      ...editedCaptions,
      [selectedCaptionOption]: updatedValue
    });
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Your Generated Property Content"
    >
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Images
        </button>
        <button 
          className={`tab ${activeTab === 'caption' ? 'active' : ''}`}
          onClick={() => setActiveTab('caption')}
        >
          Caption
        </button>
      </div>
      
      {activeTab === 'images' && (
        <div className="images-tab">
          <div className="main-image-container">
            {selectedImage.url ? (
              <img 
                src={selectedImage.url} 
                alt={selectedImage.name || 'Property Image'} 
                className="main-image" 
              />
            ) : (
              <div className="no-image">No images available</div>
            )}
            
            {selectedImage.url && (
              <div className="image-actions">
                <button 
                  className="action-button" 
                  onClick={() => downloadImage(selectedImage.url, `property-${selectedImage.name || 'image'}.png`)}
                  disabled={isDownloading}
                >
                  <FiDownload className="icon" />
                  <span>Download PNG</span>
                </button>
                
                {selectedImage.jpgUrl && (
                  <button 
                    className="action-button" 
                    onClick={() => downloadImage(selectedImage.jpgUrl, `property-${selectedImage.name || 'image'}.jpg`)}
                    disabled={isDownloading}
                  >
                    <FiDownload className="icon" />
                    <span>Download JPG</span>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {images.length > 0 && (
            <div className="thumbnails">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image.url} alt={image.name || `Design ${index + 1}`} />
                  <div className="thumbnail-name">{image.name || `Design ${index + 1}`}</div>
                </div>
              ))}
            </div>
          )}
          
          {bannerbear.zip_url && (
            <div className="download-all">
              <button 
                className="download-all-button" 
                onClick={downloadZip}
                disabled={isDownloading}
              >
                <FiDownload className="icon" />
                <span>Download All Images (ZIP)</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'caption' && (
        <div className="caption-tab">
          <div className="caption-container">
            <div className="caption-header">
              <h3>Instagram Caption</h3>
              <button 
                className="caption-action" 
                onClick={copyCaption}
              >
                <FiCopy className="icon" />
                <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            
            {hasAlternativeCaption && (
              <div className="caption-options">
                <button 
                  className={`caption-option-btn ${selectedCaptionOption === 'main' ? 'active' : ''}`}
                  onClick={() => handleCaptionOptionChange('main')}
                >
                  Option 1
                </button>
                <button 
                  className={`caption-option-btn ${selectedCaptionOption === 'alternative' ? 'active' : ''}`}
                  onClick={() => handleCaptionOptionChange('alternative')}
                >
                  Option 2
                </button>
              </div>
            )}
            
            <div className="caption-content">
              <textarea
                className="caption-textarea"
                value={currentCaption}
                onChange={handleCaptionChange}
                rows={12}
                placeholder="Your caption will appear here for editing..."
              />
            </div>
          </div>
          
          <div className="social-share">
            <h3>Share Caption & Image</h3>
            <div className="share-buttons">
              <a 
                href={`https://www.instagram.com/`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="share-button instagram"
              >
                <FiShare2 className="icon" />
                <span>Open Instagram</span>
              </a>
            </div>
            <p className="share-note">
              Copy your caption and download your image to share on Instagram.
            </p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .tabs {
          display: flex;
          border-bottom: 1px solid #eaeaea;
          margin-bottom: 1.5rem;
        }
        
        .tab {
          padding: 0.8rem 1.5rem;
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        
        .tab.active {
          color: #0070f3;
        }
        
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: #0070f3;
          border-radius: 3px 3px 0 0;
        }
        
        .images-tab {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .main-image-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .main-image {
          width: 100%;
          height: auto;
          object-fit: contain;
          max-height: 500px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .no-image {
          width: 100%;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          font-style: italic;
          border-radius: 8px;
        }
        
        .image-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
          margin-top: 0.5rem;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.2rem;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .action-button:nth-child(2) {
          background: linear-gradient(90deg, #3F9142, #7CB342);
        }
        
        .action-button:hover {
          background: linear-gradient(90deg, #43A047, #7CB342);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          transform: translateY(-1px);
        }
        
        .action-button:nth-child(2):hover {
          background: linear-gradient(90deg, #388E3C, #689F38);
        }
        
        .action-button:disabled {
          background: #999;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .icon {
          font-size: 1.1rem;
        }
        
        .thumbnails {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          scrollbar-width: thin;
          scrollbar-color: #0070f3 #eaeaea;
        }
        
        .thumbnails::-webkit-scrollbar {
          height: 6px;
        }
        
        .thumbnails::-webkit-scrollbar-track {
          background: #eaeaea;
          border-radius: 10px;
        }
        
        .thumbnails::-webkit-scrollbar-thumb {
          background-color: #0070f3;
          border-radius: 10px;
        }
        
        .thumbnail {
          min-width: 120px;
          max-width: 120px;
          cursor: pointer;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        
        .thumbnail:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .thumbnail.active {
          box-shadow: 0 0 0 3px #0070f3, 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .thumbnail img {
          width: 100%;
          height: 80px;
          object-fit: cover;
        }
        
        .thumbnail-name {
          font-size: 0.75rem;
          padding: 0.5rem;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: #f9f9f9;
        }
        
        .download-all {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }
        
        .download-all-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .download-all-button:hover {
          background: linear-gradient(90deg, #43A047, #7CB342);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          transform: translateY(-1px);
        }
        
        .download-all-button:disabled {
          background: #999;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .caption-tab {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .caption-container {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #eaeaea;
        }
        
        .caption-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .caption-header h3 {
          margin: 0;
          color: #333;
        }
        
        .caption-action {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .caption-action:hover {
          background: linear-gradient(90deg, #43A047, #7CB342);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          transform: translateY(-1px);
        }
        
        .caption-content {
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
          background: #f9f9f9;
          padding: 0;
          border-radius: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .caption-textarea {
          width: 100%;
          min-height: 250px;
          padding: 1.25rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 1rem;
          line-height: 1.6;
          color: #333;
          resize: vertical;
          background-color: #ffffff;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .caption-textarea:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
        }
        
        .social-share {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .social-share h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #333;
        }
        
        .share-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .share-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.2rem;
          background: linear-gradient(90deg, #4CAF50, #8BC34A);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .share-button:hover {
          background: linear-gradient(90deg, #43A047, #7CB342);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          transform: translateY(-1px);
        }
        
        .share-button.instagram {
          background: linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d);
        }
        
        .share-note {
          margin-top: 1rem;
          color: #666;
          font-size: 0.9rem;
          font-style: italic;
        }
        
        .caption-options {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 0.5rem;
        }
        
        .caption-option-btn {
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
        }
        
        .caption-option-btn.active {
          color: #4CAF50;
          border-bottom-color: #4CAF50;
        }
        
        @media (max-width: 768px) {
          .image-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .action-button {
            width: 100%;
          }
          
          .thumbnails {
            gap: 0.5rem;
          }
          
          .thumbnail {
            min-width: 100px;
            max-width: 100px;
          }
        }
      `}</style>
    </Modal>
  );
} 