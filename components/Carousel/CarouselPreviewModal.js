import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiShare2, FiChevronLeft, FiChevronRight, FiX, FiRefreshCw, FiSave } from 'react-icons/fi';
import { FaInstagram, FaFacebookSquare, FaLinkedin } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../src/context/AuthContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Changed component name and props
export default function CarouselPreviewModal({ isOpen, onClose, carouselData }) { 
  const [activeTab, setActiveTab] = useState('images');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  // For carousel, we might only have one main caption per slide, or a global one.
  // Let's simplify for now, assuming a single caption is passed or derived.
  const [editedCaption, setEditedCaption] = useState(''); 
  const { user } = useAuth(); 
  const thumbnailsRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]); // For multi-select in post to feed
  const [selectedStoryImage, setSelectedStoryImage] = useState(null); // For post to story
  
  // Social connection states (can remain similar)
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Fetch social connection status (can remain similar)
  useEffect(() => {
    let isMounted = true; 
    const fetchStatus = async () => {
      if (!isMounted || isLoadingStatus) return;
      setIsLoadingStatus(true);
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        if (isMounted) {
          setIsFacebookConnected(false);
          setIsInstagramConnected(false);
          setIsLinkedInConnected(false);
          setIsLoadingStatus(false);
        }
        return;
      }
      try {
        const response = await fetch('/api/social/status', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!isMounted) return; 
        const data = await response.json();
        if (data.success && data.connections) {
          setIsFacebookConnected(data.connections.facebook || false);
          setIsInstagramConnected(data.connections.instagram || false);
          setIsLinkedInConnected(data.connections.linkedin || false);
        } else {
           setIsFacebookConnected(false);
           setIsInstagramConnected(false);
           setIsLinkedInConnected(false);
        }
      } catch (error) {
         if (!isMounted) return; 
         setIsFacebookConnected(false);
         setIsInstagramConnected(false);
         setIsLinkedInConnected(false);
      } finally {
         if (isMounted) {
            setIsLoadingStatus(false);
         }
      }
    };
    if (isOpen) {
      fetchStatus();
    } else {
      setIsLoadingStatus(false);
      setIsFacebookConnected(false); 
      setIsInstagramConnected(false);
      setIsLinkedInConnected(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Initialize/Update when carouselData changes
  useEffect(() => {
    if (carouselData && carouselData.slides && carouselData.slides.length > 0) {
      // Prioritize carouselData.caption, then carouselData.globalCaption, then empty string
      const initialCaption = carouselData.caption || carouselData.globalCaption || '';
      setEditedCaption(initialCaption);
      setSelectedImages([]);
      setSelectedStoryImage(null);
      setSelectedImageIndex(0);
    } else {
      setEditedCaption('');
      setSelectedImages([]);
      setSelectedStoryImage(null);
    }
  }, [carouselData]);

  // Reset selections when tab changes (remains useful)
  useEffect(() => {
    setSelectedImages([]); 
    setSelectedStoryImage(null); 
  }, [activeTab]);

  // Conditional rendering if no data
  if (!carouselData || !carouselData.slides || carouselData.slides.length === 0) { 
    return null; 
  }
  
  // USE carouselData.slides for display if available, otherwise fallback to client-side imageUrl from carouselData.slides
  const imagesToDisplay = carouselData.slides
    .filter(slide => !!slide.s3ImageUrl) // Only show slides with S3 URLs
    .map((slide, index) => ({
      id: slide.id ?? index,
      url: slide.s3ImageUrl, // Always use S3 URL
      name: slide.heading || `Slide ${index + 1}`,
      isStory: slide.isStoryFormat || false,
      caption: slide.paragraph || slide.caption || '',
      s3ImageUrl: slide.s3ImageUrl,
      ...slide
    }));

  const selectedSlideData = imagesToDisplay[selectedImageIndex] || {};
  const currentSlideCaption = selectedSlideData.caption || editedCaption; // Prioritize slide-specific caption

  // Handle image download (can be reused, adjust filename)
  const downloadImage = async (url, filename) => {
    if (!url) return;
    setIsDownloading(true);
    try {
      // If the URL is for /api/export-slide, it needs to be fetched.
      // If it were a Data URL (client-side), direct assignment to link.href is fine.
      if (url.startsWith('data:')) { // Client-side Data URL
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else { // Server-side URL, needs to be fetched to get the blob
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(objectUrl);
      }
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.error('Failed to download image.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle zip download - Now implemented for carousels
  const downloadAllSlidesAsZip = async () => {
    if (!imagesToDisplay || imagesToDisplay.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < imagesToDisplay.length; i++) {
        const img = imagesToDisplay[i];
        // Convert dataURL to Blob
        const response = await fetch(img.url);
        const blob = await response.blob();
        zip.file(`slide-${i + 1}.png`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'carousel-slides.zip');
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      toast.error('Failed to create ZIP.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle caption copy (reusable)
  const copyCaptionToClipboard = () => {
    navigator.clipboard.writeText(currentSlideCaption); // Use current slide's caption
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };
  
  // Handle caption editing (for the global or currently displayed slide's caption)
  const handleCaptionChange = (e) => {
    // This needs to be thought out: are we editing a global caption or per-slide?
    // For now, let's assume it edits a general caption for the post.
    setEditedCaption(e.target.value); 
  };

  // Thumbnail scrolling (reusable)
  const scrollThumbnails = (direction) => {
    if (thumbnailsRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Toggle image selection for feed/story (reusable logic, data source changes)
  const toggleImageSelection = (image, index) => {
    if (activeTab === 'social') { // Post to Feed
      setSelectedImages(prev => {
        const isSelected = prev.some(img => img.url === image.url);
        if (isSelected) {
          return prev.filter(img => img.url !== image.url);
        } else {
          if (prev.length >= 10) { // Instagram limit
              toast.error('Maximum 10 images for a carousel post.');
              return prev;
          }
          return [...prev, { ...image, originalIndex: index }];
        }
      });
    } else if (activeTab === 'story') { // Post to Story
      if (selectedStoryImage?.url === image.url) {
        setSelectedStoryImage(null); 
      } else {
        setSelectedStoryImage({ ...image, originalIndex: index });
      }
    }
  };
  
  const removeSelectedImage = (imageUrl) => {
    setSelectedImages(prev => prev.filter(img => img.url !== imageUrl));
  };

  // Regenerate caption - This might not apply directly or needs different context for carousels
  const handleRegenerateCarouselCaption = async () => {
    toast.info('Caption regeneration for carousels needs custom logic.');
    // Needs context from carouselData (e.g., theme, main points)
  };

  // Save Carousel - This would be new functionality
  const handleSaveCarousel = async () => {
    if (!user) {
      toast.error('Please sign in to save this carousel');
      return;
    }
    // Logic to save carouselData (images, captions, settings)
    toast.info('Save carousel functionality to be implemented.');
  };
  
  // --- Social Posting Handlers (can be largely reused, but ensure context is right) ---
  // Make sure `currentCaption` or `editedCaption` is used appropriately.
  const handlePostStoryToInstagram = async () => {
    if (!isInstagramConnected) { toast.error("Connect Instagram in Settings."); return; }
    if (!selectedStoryImage) { toast.error("Select a story image."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting Story to Instagram...');
    try {
      const response = await fetch('/api/social/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: "", imageUrls: [selectedStoryImage.url], postType: 'story' }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post Story');
      toast.success(data.message || 'Posted Story to Instagram!');
      setSelectedStoryImage(null);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };
  
  const handlePostToInstagram = async () => {
    if (!isInstagramConnected) { toast.error("Connect Instagram in Settings."); return; }
    if (selectedImages.length === 0) { toast.error("Select images to post."); return; }
    
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }

    // IMPORTANT CHANGE: Re-map to get the latest S3 URLs
    const imageUrlsToPost = selectedImages.map(selectedImg => {
      const originalSlide = carouselData.slides[selectedImg.originalIndex]; 
      
      if (originalSlide && originalSlide.s3ImageUrl) {
        return originalSlide.s3ImageUrl;
      }
      console.warn(`S3 URL not found for slide index ${selectedImg.originalIndex}. Falling back to selectedImg.url: ${selectedImg.url}`);
      return selectedImg.url; // This might still be a data URL
    });

    // Check if any URLs are still data URLs
    if (imageUrlsToPost.some(url => url && url.startsWith('data:'))) {
        toast.error("Some images do not have a valid S3 URL required for posting. Please ensure all slides are fully processed.");
        console.error("Attempting to post with data URLs:", imageUrlsToPost.filter(url => url && url.startsWith('data:')));
        return;
    }
    
    // Optional: Check if the number of valid URLs matches the number of selected images
    // This is implicitly handled if data URLs cause an early return, 
    // but can be an explicit check if filtering out data URLs was done before this point.
    // For now, the above check for data: URLs is the primary guard.

    console.log("Final URLs for Instagram API:", imageUrlsToPost); // For debugging

    setIsPosting(true);
    toast.loading('Posting to Instagram...');
    try {
      const response = await fetch('/api/social/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: editedCaption, imageUrls: imageUrlsToPost }), // Using editedCaption
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post');
      toast.success(data.message || 'Posted to Instagram!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostToFacebook = async () => {
    if (!isFacebookConnected) { toast.error("Connect Facebook in Settings."); return; }
    if (selectedImages.length === 0) { toast.error("Select images to post."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    const imageUrlsToPost = selectedImages.map(img => img.url);
    setIsPosting(true);
    toast.loading('Posting to Facebook...');
    try {
      const response = await fetch('/api/social/post-facebook', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: editedCaption, imageUrls: imageUrlsToPost }), // Using editedCaption
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post');
      toast.success(data.message || 'Posted to Facebook!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsPosting(false); 
    }
  };

  const handlePostStoryToFacebook = async () => {
    if (!isFacebookConnected) { toast.error("Connect Facebook in Settings."); return; }
    if (!selectedStoryImage) { toast.error("Select a story image."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting Story to Facebook...');
    try {
      const response = await fetch('/api/social/post-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: "", imageUrls: [selectedStoryImage.url], postType: 'story' }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post Story');
      toast.success(data.message || 'Posted Story to Facebook!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostToLinkedIn = async () => {
    if (!isLinkedInConnected) { toast.error("Connect LinkedIn in Settings."); return; }
    if (selectedImages.length === 0) { toast.error("Select image(s) to post."); return; }
    if (selectedImages.length > 9) { toast.error("LinkedIn supports up to 9 images."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    const imageUrlsToPost = selectedImages.map(img => img.url);
    setIsPosting(true);
    toast.loading('Posting to LinkedIn...');
    try {
      const response = await fetch('/api/social/post-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: editedCaption, imageUrls: imageUrlsToPost }), // Using editedCaption
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to post');
      toast.success(data.message || 'Posted to LinkedIn!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };
  
  const modalTitle = "Carousel Preview & Share"; // Updated Modal Title
  const captionTabTitle = "Carousel Caption"; // Updated Caption Tab Title

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle} // Use updated title
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
            {captionTabTitle}
          </button>
          <button 
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Post to Feed
          </button>
        </div>
        
        {activeTab === 'images' && (
          <div className="images-tab">
            <div className="images-layout">
            <div className="main-image-container">
              {selectedSlideData.url ? (
                <img 
                  src={selectedSlideData.url} 
                  alt={selectedSlideData.name || (selectedSlideData.isStory ? 'Carousel Story Slide' : 'Carousel Slide')} 
                  className={selectedSlideData.isStory ? 'story-main-image' : 'main-image'} 
                  style={{ // Add styles to constrain image size within its container
                    maxWidth: '100%', 
                    maxHeight: '65vh', // Reduced max height
                    objectFit: 'contain',
                    borderRadius: selectedSlideData.isStory ? '0px' : '8px' // Keep border radius for non-story
                  }}
                />
              ) : (
                <div className="no-image">No image selected or available.</div>
              )}
            </div>
            
              {imagesToDisplay.length > 0 && (
                <div className="thumbnails-section">
                  <div className="thumbnails-header">
                    <h3 className="section-title">All Slides</h3>
                    <div className="download-actions">
                      {selectedSlideData && selectedSlideData.url && (
                        <button 
                          className="action-button"
                          onClick={() => {
                            // Download the image directly from selectedSlideData.url (which should be a dataUrl)
                            downloadImage(
                              selectedSlideData.url,
                              `${selectedSlideData.name || 'carousel-slide'}.png`
                            );
                          }}
                          disabled={isDownloading}
                        >
                          <FiDownload className="icon" />
                          <span>Download Slide (PNG)</span>
                        </button>
                      )}
                      {/* Placeholder for Download All ZIP for carousel */}
                      <button 
                        className="download-all-button" 
                        onClick={downloadAllSlidesAsZip} // Updated handler
                        disabled={isDownloading || imagesToDisplay.length === 0}
                      >
                        <FiDownload className="icon" />
                        <span>Download All (ZIP)</span>
                      </button>
                    </div>
                  </div>
                  <div className="thumbnails-wrapper">
                    <div className="thumbnails" ref={thumbnailsRef}>
                      {imagesToDisplay.map((image, index) => (
                        <div 
                          key={index} 
                          className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <div className="thumbnail-image">
                            <img src={image.url} alt={image.name || `Slide ${index + 1}`} />
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
                <h3 className="section-title">{captionTabTitle}</h3>
                <div className="caption-actions">
                  {/* Regenerate and save might be different for carousels */}
                  {/* <button className="caption-action regenerate" onClick={handleRegenerateCarouselCaption} disabled={isRegenerating}> ... </button> */}
                  <button 
                    className="caption-action" 
                    onClick={copyCaptionToClipboard} // Use updated handler
                  >
                    <FiCopy className="icon" />
                    <span>{copiedCaption ? 'Copied!' : 'Copy Caption'}</span>
                  </button>
                </div>
              </div>
              
              {/* Caption options might not be needed or structured differently for carousels */}
              {/* For now, a single text area for the main/global caption */}
              <div className="caption-content">
                <textarea
                  className="caption-textarea"
                  value={editedCaption} // Bound to the general edited caption
                  onChange={handleCaptionChange}
                  rows={12}
                  placeholder="Enter your carousel caption here..."
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
                  <h3 className="section-title">Select Slides to Post</h3>
                  <div className="social-images">
                    <div className="social-thumbnails">
                      {/* Filter for non-story images for feed posts */}
                      {imagesToDisplay
                        .filter(image => !image.isStory)
                        .map((image, index) => (
                          <div 
                            key={index} 
                            className={`social-thumbnail ${selectedImages.some(img => img.url === image.url) ? 'active' : ''}`}
                            onClick={() => toggleImageSelection(image, index)} // toggleImageSelection will manage selectedImages
                          >
                            <img src={image.url} alt={image.name || `Slide ${index + 1}`} />
                            {selectedImages.some(img => img.url === image.url) && (
                              <div className="selected-indicator">✓</div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="selected-images">
                      <h4 className="subsection-title">Selected Slides for Feed ({selectedImages.length}/10)</h4>
                      <div className="selected-images-row">
                        {selectedImages.map((image, idx) => (
                          <div key={idx} className="selected-image-item">
                            <img src={image.url} alt={image.name || `Selected ${idx + 1}`} />
                            <button className="remove-image" onClick={(e) => { e.stopPropagation(); removeSelectedImage(image.url); }}>
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
                      <h3 className="section-title">Your Carousel Caption</h3>
                      <button className="caption-action" onClick={copyCaptionToClipboard}>
                        <FiCopy className="icon" />
                        <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <textarea
                      className="caption-textarea"
                      value={editedCaption} // General caption for the post
                      onChange={handleCaptionChange}
                      placeholder="Write your caption for the carousel post..."
                      rows={8}
                    />
                  </div>

                  <div className="social-actions">
                    <h3 className="section-title">Share Carousel to Social Media</h3>
                    {isLoadingStatus && <p>Loading connection status...</p>} 
                    {!isLoadingStatus && (
                        <div className="social-buttons">
                          <button 
                            className="social-button instagram"
                            onClick={handlePostToInstagram}
                            disabled={isPosting || selectedImages.length === 0 || !isInstagramConnected}
                          >
                            <FaInstagram className="icon" />
                            <div className="button-content">
                              <span className="button-title">Post to Instagram</span>
                              <span className="button-desc">Share as carousel (up to 10 slides)</span>
                            </div>
                          </button>
                          <button 
                            className="social-button facebook"
                            onClick={handlePostToFacebook}
                            disabled={isPosting || selectedImages.length === 0 || !isFacebookConnected}
                          >
                            <FaFacebookSquare className="icon" />
                            <div className="button-content">
                              <span className="button-title">Share on Facebook</span>
                              <span className="button-desc">Post as multi-image post</span>
                            </div>
                          </button>
                          <button 
                            className="social-button linkedin"
                            onClick={handlePostToLinkedIn}
                            disabled={isPosting || selectedImages.length < 1 || selectedImages.length > 9 || !isLinkedInConnected}
                          >
                            <FaLinkedin className="icon" />
                            <div className="button-content">
                              <span className="button-title">Share on LinkedIn</span>
                              <span className="button-desc">Post up to 9 images to your profile</span>
                            </div>
                          </button>
                        </div>
                    )}
                    {!isLoadingStatus && (!isFacebookConnected || !isInstagramConnected || !isLinkedInConnected) && (
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
      
      {/* Styles can be largely reused, minor adjustments might be needed based on data structure */}
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
          align-items: stretch;
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
          justify-content: flex-start;
          background: transparent;
          padding: 0;
        }
        
        .instagram-frame {
          width: 100%;
          background: white;
          border: 1px solid #dbdbdb;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .instagram-frame.story-frame {
          aspect-ratio: 9/16;
          width: auto;
          height: 100%;
          max-height: 75vh;
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
          overflow: hidden;
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
          padding-top: 0.25rem;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }
        
        .thumbnail {
          width: 100%;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
          background: white;
          aspect-ratio: 4 / 5;
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
          max-height: 320px;
          overflow-y: auto;
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        .social-button {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-decoration: none;
          color: white;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .social-button.instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .social-button.facebook {
          background: #1877f2;
        }

        .social-button.linkedin {
          background: #0A66C2;
        }

        .social-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .social-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .social-button .icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .button-content {
          display: flex;
          flex-direction: column;
          text-align: left;
          flex-grow: 1;
        }
        
        .button-title {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        
        .button-desc {
          font-size: 0.85rem;
          opacity: 0.9;
        }
        
        .connect-tip {
          margin-top: 1.5rem;
          padding: 1rem 1.25rem;
          background: #f8f9fa;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #666;
          border-left: 4px solid #62d76b;
          line-height: 1.5;
        }
        
        .connect-tip a {
          color: #62d76b;
          text-decoration: none;
          font-weight: 500;
        }
        
        .connect-tip a:hover {
          text-decoration: underline;
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

        .social-buttons.single-button { 
            justify-content: center; 
         }
         .no-content-message {
            width: 100%;
            text-align: center;
            padding: 2rem;
            color: #666;
         }

         /* Cleaned up Story styles */
         .story-tab {
           display: none;
         }
         
         .story-content {
           padding: 1rem 0;
         }
         
         .story-layout {
           display: flex;
           flex-direction: column;
           align-items: center;
           gap: 2rem;
         }
         
         .stories-grid-container {
           width: 100%;
           padding: 1.5rem 0;
           display: flex;
           justify-content: center;
         }
         
         .stories-grid {
           display: flex;
           gap: 1.5rem;
           justify-content: center;
           width: 100%;
           max-width: 1000px;
         }
         
         .story-item {
           cursor: pointer;
           transition: all 0.2s ease;
           position: relative;
         }
         
         .story-item.selected:after {
           content: '';
           position: absolute;
           top: -8px;
           left: -8px;
           right: -8px;
           bottom: -8px;
           border: 3px solid #62d76b;
           border-radius: 20px;
           pointer-events: none;
         }
         
         .story-frame {
           position: relative;
           width: 180px;
           height: 320px; /* 9:16 ratio */
           border-radius: 14px;
           overflow: hidden;
           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
           transition: all 0.2s ease;
         }
         
         .story-item:hover .story-frame {
           transform: translateY(-5px);
           box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
         }
         
         .story-frame img {
           width: 100%;
           height: 100%;
           object-fit: cover;
         }
         
         .selected-badge {
           position: absolute;
           bottom: 16px;
           left: 50%;
           transform: translateX(-50%);
           background: rgba(24, 119, 242, 0.9);
           color: white;
           border-radius: 20px;
           padding: 6px 16px;
           font-weight: 600;
           font-size: 0.9rem;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
         }
         
         .story-actions-container {
           width: 100%;
           max-width: 450px;
           margin-top: 1rem;
         }
         
         .story-actions {
           background: white;
           border-radius: 12px;
           padding: 1.5rem;
           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
           text-align: center;
         }
         
         .social-buttons.single-button {
           margin-top: 1rem;
         }
         
         /* Remove the old selected-story-display since we now show selection state directly in the carousel */
         .selected-story-display {
           display: none;
         }

         /* Updated story button styling */
         .social-buttons.story-buttons {
           display: flex;
           flex-direction: column;
           gap: 1rem;
           margin-top: 1rem;
           width: 100%;
         }
         
         .story-actions .social-button {
           width: 100%;
           display: flex;
           align-items: center;
           padding: 0.8rem 1.5rem;
           border-radius: 10px;
           justify-content: center;
         }
         
         .story-actions .social-button .button-title {
           font-size: 1rem;
           font-weight: 600;
         }
         
         .story-actions .social-button.instagram {
           background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
         }
         
         .story-actions .social-button.facebook {
           background: #1877f2;
         }
         
         .story-item.selected .story-frame {
           border: 3px solid #62d76b;
           transform: translateY(-5px);
         }
         
         .story-item.selected:after {
           content: '';
           position: absolute;
           top: -6px;
           left: -6px;
           right: -6px;
           bottom: -6px;
           border: 2px solid #62d76b;
           border-radius: 16px;
           pointer-events: none;
         }
      `}</style>
    </Modal>
  );
} 