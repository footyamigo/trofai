import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiShare2, FiChevronLeft, FiChevronRight, FiX, FiRefreshCw, FiSave } from 'react-icons/fi';
import { FaInstagram, FaFacebookSquare } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../src/context/AuthContext';

export default function ResultsModal({ isOpen, onClose, results }) {
  const [activeTab, setActiveTab] = useState('images');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedCaptionOption, setSelectedCaptionOption] = useState('main');
  const [editedCaptions, setEditedCaptions] = useState({
    main: '',
    alternative: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const hasAlternativeCaption = Boolean(results?.captionOptions?.alternative);
  const thumbnailsRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // State for social connection status
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false); // To prevent multiple fetches
  const [isPosting, setIsPosting] = useState(false); // Loading state for posting actions

  // Fetch social connection status ONCE when the modal opens
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const fetchStatus = async () => {
      if (!isMounted || isLoadingStatus) return; // Don't fetch if already loading

      setIsLoadingStatus(true);
      const sessionToken = localStorage.getItem('session');

      if (!sessionToken) {
        console.log('ResultsModal: No session token, cannot fetch status.');
        if (isMounted) {
          setIsFacebookConnected(false);
          setIsInstagramConnected(false);
          setIsLoadingStatus(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/social/status', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        // Check again if mounted before processing response
        if (!isMounted) return; 
        
        const data = await response.json();
        if (data.success && data.connections) {
          setIsFacebookConnected(data.connections.facebook || false);
          setIsInstagramConnected(data.connections.instagram || false);
        } else {
          console.error('ResultsModal: Failed to fetch social status:', data.message);
           // Handle potential errors, maybe set defaults
           setIsFacebookConnected(false);
           setIsInstagramConnected(false);
        }
      } catch (error) {
         if (!isMounted) return; 
         console.error('ResultsModal: Error fetching social status:', error);
         // Set defaults on error
         setIsFacebookConnected(false);
         setIsInstagramConnected(false);
      } finally {
         if (isMounted) {
            setIsLoadingStatus(false);
         }
      }
    };

    // Fetch status only when modal becomes visible
    if (isOpen) {
      // Reset status before fetching if needed, or rely on initial state
      // setIsLoadingStatus(true); // Moved inside fetchStatus to avoid race conditions
      fetchStatus();
    } else {
      // Optionally reset state when modal closes
      setIsLoadingStatus(false);
      setIsFacebookConnected(false); 
      setIsInstagramConnected(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };

  }, [isOpen]); // Depend only on isOpen to trigger fetch

  // Initialize captions when results change
  useEffect(() => {
    if (results) {
      console.log('Results in modal:', results);
      console.log('Caption from results:', results.caption);
      
      // Make sure we check for empty strings too, not just null/undefined
      const mainCaption = results.caption || '';
      const altCaption = results.captionOptions?.alternative || '';
      
      console.log('Setting edited captions:', { main: mainCaption, alternative: altCaption });
      
      setEditedCaptions({
        main: mainCaption,
        alternative: altCaption
      });
      setIsSaved(false);
      // Reset selected images when results change
      setSelectedImages([]);
    }
  }, [results]);

  // Early return after hooks are defined
  if (!results || !results.bannerbear) return null;
  
  const { bannerbear, caption, captionOptions, propertyData } = results;
  
  // Get the current caption based on selection or fallback
  const currentCaption = editedCaptions[selectedCaptionOption] || '';
  
  // Add debug log for current caption
  console.log('Current rendered caption:', currentCaption);
  
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
    
    // Debug output for checking what data is available
    console.log('Processing images from bannerbear:', bannerbear);
    
    // Create separate arrays for standard images and large images
    const standardImages = [];
    const largeImages = [];
    
    if (bannerbear.images && bannerbear.images.length > 0) {
      console.log('Using bannerbear.images array with length:', bannerbear.images.length);
      
      // First pass - categorize images
      bannerbear.images.forEach((img) => {
        const templateName = img.template || '';
        const height = parseInt(img.height) || 0;
        
        const imageData = {
          template: templateName,
          name: formatTemplateName(templateName),
          url: img.image_url,
          jpgUrl: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg'),
          height: height
        };
        
        // Determine if this is a large image (story format)
        const isLargeImage = 
          height >= 1900 || 
          templateName.includes('1920') || 
          templateName.includes('large') || 
          templateName.includes('horizontal') ||
          img.image_url.includes('1920');
        
        if (isLargeImage) {
          imageData.isStory = true;
          largeImages.push(imageData);
        } else {
          imageData.isStory = false;
          standardImages.push(imageData);
        }
      });
      
      // Combine the arrays with standard images first, then large images
      images = [...standardImages, ...largeImages];
    } 
    else if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
      console.log('Using bannerbear.image_urls object with keys:', Object.keys(bannerbear.image_urls));
      
      // First get all the images
      const tempImages = Object.entries(bannerbear.image_urls)
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
      
      // Then categorize them
      tempImages.forEach(img => {
        // Determine if this is a large image based on template name
        const isLargeImage = 
          img.template.includes('1920') || 
          img.template.includes('large') || 
          img.template.includes('horizontal') ||
          img.url.includes('1920');
        
        img.isStory = isLargeImage;
        
        if (isLargeImage) {
          largeImages.push(img);
        } else {
          standardImages.push(img);
        }
      });
      
      // Combine the arrays with standard images first, then large images
      images = [...standardImages, ...largeImages];
    }
    
    console.log('Final processed images:', images.map(img => `${img.name}: isStory=${img.isStory}`));
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
    navigator.clipboard.writeText(currentCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };
  
  // Handle caption option switch
  const handleCaptionOptionChange = (option) => {
    setSelectedCaptionOption(option);
  };
  
  // Handle caption editing
  const handleCaptionChange = (e) => {
    const newCaption = e.target.value;
    setEditedCaptions({
      ...editedCaptions,
      [selectedCaptionOption]: newCaption
    });
  };

  // Handle thumbnail scrolling
  const scrollThumbnails = (direction) => {
    if (thumbnailsRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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
  
  // Add regenerate handler
  const handleRegenerateCaption = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/regenerate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentCaption: currentCaption,
          currentOption: selectedCaptionOption
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate caption');
      }

      const data = await response.json();
      
      setEditedCaptions(prev => ({
        ...prev,
        [selectedCaptionOption]: data.caption
      }));

      toast.success('Caption regenerated successfully!');
    } catch (error) {
      console.error('Failed to regenerate caption:', error);
      toast.error(error.message || 'Failed to regenerate caption. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle save property
  const handleSaveProperty = async () => {
    if (!user) {
      toast.error('Please sign in to save this property');
      return;
    }

    if (isSaved) {
      toast.success('Property already saved to your profile');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the data to save
      const propertyToSave = {
        // Basic property info
        address: propertyData?.address || 'Unknown Address',
        price: propertyData?.price || 'Unknown Price',
        bedrooms: propertyData?.bedrooms || 0,
        bathrooms: propertyData?.bathrooms || 0,
        propertyType: propertyData?.propertyType || 'Unknown',
        description: propertyData?.description || '',
        features: propertyData?.features || [],
        
        // Generated content
        images: images.map(img => ({
          url: img.url,
          name: img.name,
          isStory: img.isStory
        })),
        captions: {
          main: editedCaptions.main,
          alternative: editedCaptions.alternative
        },
        
        // Metadata
        generatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/properties/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save property');
      }

      setIsSaved(true);
      toast.success('Property saved to your profile');
    } catch (error) {
      console.error('Failed to save property:', error);
      toast.error(error.message || 'Failed to save property. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- Handlers for posting --- 
  const handlePostToInstagram = async () => {
    // 1. Check connection status FIRST
    if (!isInstagramConnected) {
      toast.error("Please connect your Instagram account in Settings first.");
      // TODO: Maybe add a link/button to settings?
      return;
    }
    // 2. Check if images are selected
    if (selectedImages.length === 0) {
      toast.error("Please select at least one image to post.");
      return;
    }
    // 3. Proceed with posting logic (currently placeholder)
    console.log("Attempting to post to Instagram:", { caption: currentCaption, images: selectedImages });
    toast('Instagram posting not yet implemented.');
    // TODO: Implement API call 
    // ... (setIsPosting, fetch, finally) ...
  };

  const handlePostToFacebook = async () => {
    // Checks for connection and selected images remain
     if (!isFacebookConnected) {
      toast.error("Please connect your Facebook account in Settings first.");
      return;
    }
     if (selectedImages.length === 0) {
      toast.error("Please select at least one image to post.");
      return;
    }
    
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    // Extract image URLs (use .url property)
    const imageUrlsToPost = selectedImages.map(img => img.url);
    
    // --- Call Backend API --- 
    setIsPosting(true);
    toast.loading('Posting to Facebook...');

    try {
      const response = await fetch('/api/social/post-facebook', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          caption: currentCaption, 
          imageUrls: imageUrlsToPost // Send array of URLs
        }),
      });

      const data = await response.json();
      toast.dismiss(); // Dismiss loading toast regardless of outcome

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to post to Facebook.');
      }

      toast.success(data.message || 'Successfully posted to Facebook!');
      // Maybe close modal or clear selection after successful post?
      // onClose(); 
      // setSelectedImages([]);

    } catch (error) {
      toast.dismiss();
      console.error('Error posting to Facebook:', error);
      toast.error(error.message || 'Failed to post to Facebook.');
    } finally {
      setIsPosting(false); 
    }
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
            
              {images.length > 1 && (
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
                      {bannerbear.zip_url && (
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
                    className="caption-action regenerate" 
                    onClick={handleRegenerateCaption}
                    disabled={isRegenerating}
                  >
                    <FiRefreshCw className={`icon ${isRegenerating ? 'spinning' : ''}`} />
                    <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                <button 
                  className="caption-action" 
                  onClick={copyCaption}
                >
                  <FiCopy className="icon" />
                  <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                </button>
                </div>
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

                    <textarea
                      className="caption-textarea"
                      value={currentCaption}
                      onChange={handleCaptionChange}
                      placeholder="Your caption will appear here for editing..."
                      rows={8}
                    />
                  </div>

                  <div className="social-actions">
                    <h3 className="section-title">Share to Social Media</h3>
                    {isLoadingStatus && <p>Loading connection status...</p>} 
                    {!isLoadingStatus && (
                        <div className="social-buttons">
                        {/* Instagram Button - Removed !isInstagramConnected from disabled */}
                        <button 
                            className="social-button instagram"
                            onClick={handlePostToInstagram}
                            disabled={isPosting || selectedImages.length === 0} // Only disable if posting or no images selected
                        >
                            <FaInstagram className="icon" />
                            <div className="button-content">
                            <span className="button-title">Post to Instagram</span>
                            <span className="button-desc">Share your property listing</span>
                            </div>
                        </button>
                        {/* Facebook Button - Removed !isFacebookConnected from disabled */}
                        <button 
                            className="social-button facebook"
                            onClick={handlePostToFacebook}
                            disabled={isPosting || selectedImages.length === 0} // Only disable if posting or no images selected
                        >
                            <FaFacebookSquare className="icon" />
                            <div className="button-content">
                            <span className="button-title">Share on Facebook</span>
                            <span className="button-desc">Post to your business page</span>
                            </div>
                        </button>
                        </div>
                    )}
                    {/* Keep the tip encouraging connection */}
                    {!isLoadingStatus && (!isFacebookConnected || !isInstagramConnected) && (
                        <p className="connect-tip">
                            Connect your accounts in <a href="/dashboard/settings" target="_blank" rel="noopener noreferrer">Settings</a> to enable posting.
                        </p>
                    )}
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
          display: flex;
          flex-direction: column;
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
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
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
        }
        
        .instagram-frame {
          width: 100%;
          background: white;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .instagram-frame.story-frame {
          aspect-ratio: 9/16;
          max-width: 400px;
          margin: 0 auto;
          background: black;
          position: relative;
          border: none;
        }
        
        .story-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
        }
        
        .story-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .story-main-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .instagram-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #dbdbdb;
        }
        
        .profile-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .profile-picture {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #dbdbdb;
        }
        
        .profile-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .more-options {
          font-weight: bold;
          color: #262626;
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
        
        .instagram-actions {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border-top: 1px solid #dbdbdb;
        }
        
        .action-icons {
          display: flex;
          gap: 16px;
          font-size: 22px;
        }
        
        .bookmark {
          font-size: 22px;
        }
        
        .no-image {
          width: 100%;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          color: #666;
          font-style: italic;
          border-radius: 8px;
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
        }
        
        .thumbnails-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
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
        
        .action-button:hover,
        .download-all-button:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }
        
        .action-button:active,
        .download-all-button:active {
          transform: translateY(1px);
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }
        
        .action-button:disabled,
        .download-all-button:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
          border-color: #999;
        }
        
        .icon {
          font-size: 1.1rem;
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
        
        .caption-action.regenerate {
          background: #e2e8f0;
        }
        
        .caption-action.regenerate:hover {
          background: #cbd5e1;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }
        
        .caption-action.regenerate:active {
          transform: translateY(1px);
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }
        
        .caption-action:disabled {
          background: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
          box-shadow: none;
          border-color: #999;
        }
        
        .caption-action .icon.spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .caption-options {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        
        .caption-option-btn {
          padding: 0.5rem 1rem;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
          color: #4a5568;
          transition: all 0.2s ease;
        }
        
        .caption-option-btn.active {
          color: #4CAF50;
          border-color: #4CAF50;
          background: rgba(76, 175, 80, 0.05);
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

        .caption-title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .regenerate-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .regenerate-button:hover {
          background: #e5e7eb;
          color: #1f2937;
        }

        .regenerate-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .regenerate-button .icon {
          font-size: 1rem;
        }

        .regenerate-button .icon.spinning {
          animation: spin 1s linear infinite;
        }

        .share-section {
          background: white;
          border-radius: 10px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
          margin-top: 1rem;
        }

        .share-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .share-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          color: white;
          transition: all 0.2s ease;
        }
        
        .share-button.instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .share-button.facebook {
          background: #1877f2;
        }

        .share-button:hover {
          transform: translateY(-2px);
          filter: brightness(110%);
        }

        .share-button .icon {
          font-size: 1.25rem;
        }
        
        .share-note {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #666;
          border-left: 3px solid #62d76b;
        }
        
        @media (max-width: 768px) {
          .content-container {
            max-height: none;
            overflow: visible;
          }
          
          .images-layout {
            flex-direction: column;
          }
          
          .thumbnails-section {
            width: 100%;
            position: static;
            max-height: none;
          }
          
          .thumbnails {
            grid-template-columns: repeat(4, 1fr);
            gap: 0.75rem;
          }
          
          .thumbnails-wrapper {
            overflow: visible;
          }

          .social-layout {
            flex-direction: column;
          }

          .social-images-container {
            width: 100%;
            height: 400px; /* Fixed height on mobile */
          }

          .social-thumbnails {
            grid-template-columns: repeat(2, 1fr);
          }

          .social-right-panel {
            overflow-y: auto; /* Allow scrolling on mobile */
          }

          .selected-images-row {
            grid-template-columns: repeat(4, 1fr);
          }

          .selected-image-item {
            width: 80px;
            height: 80px;
          }
        }
        
        @media (max-width: 480px) {
          .tabs {
            gap: 1rem;
            padding: 0 0.25rem;
          }
          
          .tab {
            padding: 0.75rem 0.25rem;
            font-size: 0.9rem;
            min-width: 70px;
          }
          
          .thumbnails {
            grid-template-columns: repeat(3, 1fr);
          }
          
          .share-buttons {
            flex-direction: column;
          }
          
          .share-button {
            width: 100%;
          }

          .selected-images-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .save-button {
          background-color: #4caf50;
          color: white;
          margin-right: 8px;
        }
        
        .save-button:hover {
          background-color: #45a049;
        }
        
        .save-button.saved {
          background-color: #2e7d32;
        }

        .connect-tip {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #666;
          border-left: 3px solid #62d76b;
        }
      `}</style>
    </Modal>
  );
} 