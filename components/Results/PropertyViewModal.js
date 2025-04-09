import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiX } from 'react-icons/fi';
import { FaInstagram, FaFacebookSquare } from 'react-icons/fa';

export default function PropertyViewModal({ isOpen, onClose, property }) {
  const [activeTab, setActiveTab] = useState('images');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const thumbnailsRef = useRef(null);

  // Reset selected images when property changes
  useEffect(() => {
    if (property) {
      setSelectedImages([]);
    }
  }, [property]);

  if (!property) return null;

  console.log('Property data in modal:', property); // Debug log

  // Get the caption from property - update caption retrieval logic
  const captionText = property.caption || 
                     (property.captionOptions && property.captionOptions.main) || 
                     (property.propertyData && property.propertyData.caption) ||
                     (typeof property.bannerbear?.raw?.caption === 'string' ? property.bannerbear.raw.caption : '') || 
                     'No caption available';
  
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
  
  // Process images from the property data
  const processImages = () => {
    let images = [];
    const { bannerbear } = property;
    
    if (!bannerbear) return [];
    
    if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
      images = Object.entries(bannerbear.image_urls)
        .filter(([key]) => !key.endsWith('_jpg'))
        .map(([key, url], index, array) => {
          const templateName = key.replace('_image_url', '');
          const jpgKey = `${key}_jpg`;
          const jpgUrl = bannerbear.image_urls[jpgKey];
          
          return {
            template: templateName,
            name: formatTemplateName(templateName),
            url: url,
            jpgUrl: jpgUrl || url.replace(/\.png$/, '.jpg'),
            isStory: array.length - index <= 3  // Last 3 images are stories
          };
        });
    } 
    else if (bannerbear.images && bannerbear.images.length > 0) {
      images = bannerbear.images.map((img, index, array) => {
        const templateName = img.template || `Design ${index + 1}`;
        
        return {
          template: templateName,
          name: formatTemplateName(templateName),
          url: img.image_url,
          jpgUrl: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg'),
          isStory: array.length - index <= 3  // Last 3 images are stories
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
    if (property.bannerbear?.zip_url) {
      downloadImage(property.bannerbear.zip_url, 'property-designs.zip');
    }
  };
  
  // Handle caption copy
  const copyCaption = () => {
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Add image selection handler
  const toggleImageSelection = (image, index) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.url === image.url);
      if (isSelected) {
        return prev.filter(img => img.url !== image.url);
      } else {
        return [...prev, { ...image, originalIndex: index }];
      }
    });
  };

  // Add remove image handler
  const removeSelectedImage = (imageUrl) => {
    setSelectedImages(prev => prev.filter(img => img.url !== imageUrl));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Your Generated Property Content"
    >
      <div className="content-container">
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
          <button 
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Post to Social
          </button>
        </div>
        
        {activeTab === 'images' && (
          <div className="images-tab">
            <div className="images-layout">
              <div className="main-image-container">
                {selectedImage.url ? (
                  <div className={`instagram-frame ${selectedImage.isStory ? 'story-frame' : ''}`}>
                    {!selectedImage.isStory ? (
                      <>
                        <div className="instagram-header">
                          <div className="profile-info">
                            <div className="profile-picture"></div>
                            <div className="profile-name">Your Profile</div>
                          </div>
                          <div className="more-options">•••</div>
                        </div>
                        <div className="instagram-image">
                          <img 
                            src={selectedImage.url} 
                            alt={selectedImage.name || 'Property Image'} 
                            className="main-image" 
                          />
                        </div>
                        <div className="instagram-actions">
                          <div className="action-icons">
                            <span>♡</span>
                            <span>💬</span>
                            <span>↪</span>
                          </div>
                          <div className="bookmark">🔖</div>
                        </div>
                      </>
                    ) : (
                      <div className="story-container">
                        <div className="story-image">
                          <img 
                            src={selectedImage.url} 
                            alt={selectedImage.name || 'Property Image'} 
                            className="story-main-image" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-image">No images available</div>
                )}
              </div>
              
              {images.length > 0 && (
                <div className="thumbnails-section">
                  <div className="thumbnails-header">
                    <h3 className="section-title">All Designs</h3>
                    <div className="download-actions">
                      {selectedImage.url && (
                        <button 
                          className="action-button"
                          onClick={() => downloadImage(selectedImage.url, `property-${selectedImage.name || 'image'}.png`)}
                          disabled={isDownloading}
                        >
                          <FiDownload className="icon" />
                          <span>Download PNG</span>
                        </button>
                      )}
                      {property.bannerbear?.zip_url && (
                        <button 
                          className="download-all-button" 
                          onClick={downloadZip}
                          disabled={isDownloading}
                        >
                          <FiDownload className="icon" />
                          <span>Download All (ZIP)</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="thumbnails-wrapper">
                    <div className="thumbnails" ref={thumbnailsRef}>
                      {images.map((image, index) => (
                        <div 
                          key={index} 
                          className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <div className="thumbnail-image">
                            <img src={image.url} alt={image.name || `Design ${index + 1}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'caption' && (
          <div className="caption-tab">
            <div className="caption-container">
              <div className="caption-header">
                <h3 className="section-title">Instagram Caption</h3>
                <div className="caption-actions">
                <button 
                    className="caption-action" 
                  onClick={copyCaption}
                >
                  <FiCopy className="icon" />
                    <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                </button>
                </div>
              </div>
              
              <div className="caption-content">
                <textarea
                  className="caption-textarea"
                  value={captionText}
                  readOnly
                  rows={12}
                  placeholder="Your caption will appear here for editing..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="social-tab">
            <div className="social-content">
              <div className="social-layout">
                <div className="social-images-container">
                  <h3 className="section-title">Select Images to Post</h3>
                  <div className="social-images">
                    <div className="social-thumbnails">
                      {images
                        .filter(image => !image.isStory)
                        .map((image, index) => (
                          <div 
                            key={index} 
                            className={`social-thumbnail ${selectedImages.some(img => img.url === image.url) ? 'active' : ''}`}
                            onClick={() => toggleImageSelection(image, index)}
                          >
                            <img src={image.url} alt={image.name || `Design ${index + 1}`} />
                            {selectedImages.some(img => img.url === image.url) && (
                              <div className="selected-indicator">✓</div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="selected-images">
                      <h4 className="subsection-title">Selected Images</h4>
                      <div className="selected-images-row">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="selected-image-item">
                            <img src={image.url} alt={image.name || `Selected ${index + 1}`} />
                            <button 
                              className="remove-image"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSelectedImage(image.url);
                              }}
                            >
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="social-right-panel">
                  <div className="social-caption">
                    <div className="caption-header">
                      <h3 className="section-title">Your Caption</h3>
                      <button 
                        className="caption-action" 
                        onClick={copyCaption}
                      >
                        <FiCopy className="icon" />
                        <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <textarea
                      className="caption-textarea"
                      value={captionText}
                      readOnly
                      placeholder="Your caption will appear here..."
                      rows={8}
                    />
                  </div>

            <div className="social-actions">
              <h3 className="section-title">Share to Social Media</h3>
              <div className="social-buttons">
                <a 
                  href="https://www.instagram.com/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-button instagram"
                >
                  <FaInstagram className="icon" />
                  <div className="button-content">
                    <span className="button-title">Post to Instagram</span>
                    <span className="button-desc">Share your property listing</span>
                  </div>
                </a>
                <a 
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-button facebook"
                >
                  <FaFacebookSquare className="icon" />
                  <div className="button-content">
                    <span className="button-title">Share on Facebook</span>
                    <span className="button-desc">Post to your business page</span>
                  </div>
                </a>
              </div>
              <p className="social-tip">
                💡 Tip: Copy your caption first, then click on the social media platform where you want to post. Paste your caption in the post creation page.
              </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .content-container {
          max-height: 85vh;
          overflow-y: auto;
          padding: 0.5rem;
          position: relative;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          margin-bottom: 1.5rem;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
          padding: 0 0.5rem;
          gap: 2rem;
        }

        .tab {
          padding: 0.75rem 0.5rem;
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          min-width: 80px;
          text-align: center;
        }

        .tab:hover {
          color: #64748b;
        }

        .tab.active {
          color: #62d76b;
        }

        .tab::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: transparent;
          transition: all 0.2s ease;
        }
        
        .tab.active::after {
          background: #62d76b;
        }

        .images-tab {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        
        .images-layout {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          height: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .main-image-container {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: transparent;
          padding: 0;
          padding-right: 8px;
          font-size: 16px; /* Restore font size */
        }

        .instagram-frame {
          width: 100%;
          max-width: 450px;
          background: white;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          overflow: hidden;
          margin: 0;
        }

        .story-frame {
          max-width: 270px;
          aspect-ratio: 9/16;
        }

        .instagram-header {
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #efefef;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .profile-picture {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #efefef;
        }

        .profile-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .instagram-image {
          width: 100%;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-image {
          width: 100%;
          height: auto;
          object-fit: contain;
          max-height: 470px;
        }

        .story-main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .instagram-actions {
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .action-icons {
          display: flex;
          gap: 1rem;
          font-size: 1.5rem;
        }

        .bookmark {
          font-size: 1.5rem;
        }

        .thumbnails-section {
          width: 380px;
          flex-shrink: 0;
          background: white;
          border-radius: 10px;
          padding: 0.75rem;
          border: 1px solid #edf2f7;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          height: fit-content;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 3rem;
          font-size: 16px; /* Restore font size */
        }

        .thumbnails-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-weight: normal;
          color: #1a202c;
          font-size: 0.95rem;
          margin: 0;
        }

        .download-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-button,
        .download-all-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #62d76b;
          color: black;
          border: 2px solid black;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }
        
        .thumbnails-wrapper {
          overflow-y: auto;
          padding-right: 4px;
        }

        .thumbnails {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          padding-bottom: 0.5rem;
        }

        .thumbnail {
          width: 100%;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          background: white;
          aspect-ratio: 1;
        }

        .thumbnail-image {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        .thumbnail:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .thumbnail:hover img {
          transform: scale(1.05);
        }
        
        .thumbnail.active {
          box-shadow: 0 0 0 2px #62d76b, 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .caption-tab {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .caption-container {
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .caption-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .caption-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .caption-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #62d76b;
          color: black;
          border: 2px solid black;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          white-space: nowrap;
        }
        
        .caption-action:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }
        
        .caption-action:active {
          transform: translateY(1px);
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }
        
        .caption-textarea {
          width: 100%;
          min-height: 240px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #4a5568;
          resize: vertical;
          background-color: #ffffff;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .caption-textarea:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
        }

        .social-tab {
          padding: 1rem;
          height: calc(100vh - 180px); /* Adjust based on your header/footer height */
        }

        .social-content {
          height: 100%;
        }

        .social-layout {
          display: flex;
          gap: 1.5rem;
          height: 100%;
        }

        .social-images-container {
          width: 45%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .social-images {
          flex: 1;
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
          overflow-y: auto;
        }

        .social-images::-webkit-scrollbar {
          width: 8px;
        }

        .social-images::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .social-images::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .social-images::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .social-thumbnails {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .social-right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
          overflow-y: hidden;
        }

        .social-caption {
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .social-actions {
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .social-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .social-button {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 10px;
          text-decoration: none;
          color: white;
          transition: all 0.2s ease;
        }

        .social-button.instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .social-button.facebook {
          background: #1877f2;
        }

        .social-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .social-button .icon {
          font-size: 2rem;
        }

        .button-content {
          display: flex;
          flex-direction: column;
        }

        .button-title {
          font-weight: 600;
          font-size: 1rem;
        }

        .button-desc {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .social-tip {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #666;
          border-left: 3px solid #62d76b;
        }

        .social-thumbnail {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .social-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .social-thumbnail:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .social-thumbnail.active {
          border-color: #62d76b;
          box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
        }

        .selected-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #62d76b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .selected-images {
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .subsection-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0 0 1rem 0;
        }

        .selected-images-row {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .selected-images-row::-webkit-scrollbar {
          height: 6px;
        }

        .selected-images-row::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .selected-images-row::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .selected-images-row::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .selected-image-item {
          position: relative;
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #edf2f7;
        }

        .selected-image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #e53e3e;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .remove-image:hover {
          background: white;
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .images-layout {
            flex-direction: column;
          }

          .thumbnails-section {
            width: 100%;
          }

          .social-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Modal>
  );
} 