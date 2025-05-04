import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiShare2, FiChevronLeft, FiChevronRight, FiX, FiRefreshCw } from 'react-icons/fi'; // Removed FiSave
import { FaInstagram, FaFacebookSquare, FaLinkedin } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
// Removed useAuth as save property is not needed

// Renamed Component
export default function TestimonialResultsModal({ isOpen, onClose, results }) {
  // --- State Variables --- 
  const [activeTab, setActiveTab] = useState('images');
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  // REMOVED Caption editing/options state
  // const [selectedCaptionOption, setSelectedCaptionOption] = useState('main');
  // const [editedCaptions, setEditedCaptions] = useState({ main: '', alternative: '' });
  // REMOVED Property saving state
  // const [isSaving, setIsSaving] = useState(false);
  // const [isSaved, setIsSaved] = useState(false);
  // const { user } = useAuth();
  const thumbnailsRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  // REMOVED Caption regenerating state
  // const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedStoryImage, setSelectedStoryImage] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPosting, setIsPosting] = useState(false); 

  // Add state for the editable generated caption
  const [editedGeneratedCaption, setEditedGeneratedCaption] = useState('');
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false);
  const [captionError, setCaptionError] = useState(null);

  // Add LinkedIn state
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  // --- useEffects (Keep social status fetching, remove caption init based on options) ---
   useEffect(() => { // Fetch social status
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
        const response = await fetch('/api/social/status', { headers: { 'Authorization': `Bearer ${sessionToken}` } });
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
    if (isOpen) { fetchStatus(); }
    else { setIsLoadingStatus(false); setIsFacebookConnected(false); setIsInstagramConnected(false); setIsLinkedInConnected(false); }
    return () => { isMounted = false; };
  }, [isOpen]);

  useEffect(() => { // Reset selections on tab change
    setSelectedImages([]); 
    setSelectedStoryImage(null); 
  }, [activeTab]);

  // Initialize EDITED caption state when results change
  useEffect(() => {
    if (results) {
      setEditedGeneratedCaption(results.caption || ''); 
      setCaptionError(null);
      setSelectedImages([]);
      setSelectedStoryImage(null);
    }
  }, [results]);

  // Early return check
  if (!results || !results.bannerbear) return null;
  
  // Destructure results - simpler for testimonials
  const { bannerbear } = results; // Caption is the review text
  const originalReviewerName = results.propertyData?.property?.reviewer || '';
  const originalReviewText = results.propertyData?.property?.reviewText || results.caption || '';
  const currentCaption = editedGeneratedCaption; // Use the editable state

  // --- Functions --- 
  const formatTemplateName = (templateName) => {
     if (!templateName) return 'Design'; return templateName.replace(/^template_/, '').replace(/_image_url$/, '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  const processImages = () => {
       let images = [];
    const standardImages = [];
    const largeImages = [];
    if (bannerbear.images && bannerbear.images.length > 0) {
      bannerbear.images.forEach((img) => {
        const templateName = img.template || '';
        const height = parseInt(img.height) || 0;
        const imageData = { template: templateName, name: formatTemplateName(templateName), url: img.image_url, jpgUrl: img.image_url_jpg || img.image_url.replace(/\.png$/, '.jpg'), height: height };
        const isLargeImage = height >= 1900 || templateName.includes('1920') || templateName.includes('large') || templateName.includes('horizontal') || img.image_url.includes('1920');
        imageData.isStory = isLargeImage;
        if (isLargeImage) largeImages.push(imageData); else standardImages.push(imageData);
      });
      images = [...standardImages, ...largeImages];
    } 
    else if (bannerbear.image_urls && Object.keys(bannerbear.image_urls).length > 0) {
      const tempImages = Object.entries(bannerbear.image_urls)
        .filter(([key]) => !key.endsWith('_jpg'))
        .map(([key, url]) => {
          const templateName = key.replace('_image_url', '');
          const jpgKey = `${key}_jpg`;
          const jpgUrl = bannerbear.image_urls[jpgKey];
          return { template: templateName, name: formatTemplateName(templateName), url: url, jpgUrl: jpgUrl || url.replace(/\.png$/, '.jpg') };
        });
      tempImages.forEach(img => {
        const isLargeImage = img.template.includes('1920') || img.template.includes('large') || img.template.includes('horizontal') || img.url.includes('1920');
        img.isStory = isLargeImage;
        if (isLargeImage) largeImages.push(img); else standardImages.push(img);
      });
      images = [...standardImages, ...largeImages];
    }
    return images;
  };
  const images = processImages();
  const selectedImage = images[selectedImageIndex] || {};

  const downloadImage = async (url, filename) => {
       if (!url) return; setIsDownloading(true); try { const response = await fetch(url); const blob = await response.blob(); const objectUrl = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = objectUrl; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(objectUrl); } catch (err) { console.error('Failed to download image:', err); } finally { setIsDownloading(false); }
  };
  const downloadSelectedImage = () => {
    const filename = `testimonial-${selectedImage.name || 'image'}.png`;
    downloadImage(selectedImage.url, filename);
  };
  const downloadZip = () => { // Adapted for testimonials (might not have zip)
    if (bannerbear.zip_url) {
      downloadImage(bannerbear.zip_url, 'testimonial-designs.zip');
    }
  };
  const copyCaption = () => {
      navigator.clipboard.writeText(currentCaption); // Copy the potentially edited caption
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
  };
  const scrollThumbnails = (direction) => {
       if (thumbnailsRef.current) { const scrollAmount = direction === 'left' ? -300 : 300; thumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' }); }
  };
  const navigateStory = (direction) => {
       const storyImages = images.filter(image => image.isStory); if (storyImages.length === 0) return; if (direction === 'next') { setStoryIndex(prev => (prev + 1) % storyImages.length); } else { setStoryIndex(prev => (prev - 1 + storyImages.length) % storyImages.length); }
  };
  const toggleImageSelection = (image, index) => {
        if (activeTab === 'social') { setSelectedImages(prev => { const isSelected = prev.some(img => img.url === image.url); if (isSelected) { return prev.filter(img => img.url !== image.url); } else { if (prev.length >= 10) { toast.error('Maximum 10 images allowed for a post.'); return prev; } return [...prev, { ...image, originalIndex: index }]; } }); } else if (activeTab === 'story') { if (selectedStoryImage?.url === image.url) { setSelectedStoryImage(null); } else { const originalIndex = typeof index === 'number' ? index : images.findIndex(img => img.url === image.url); setSelectedStoryImage({ ...image, originalIndex }); } }
  };
  const removeSelectedImage = (imageUrl) => {
       setSelectedImages(prev => prev.filter(img => img.url !== imageUrl));
  };
  // REMOVED handleRegenerateCaption 
  // REMOVED handleSaveProperty
  const handlePostStoryToInstagram = async () => {
       if (!isInstagramConnected) { toast.error("Please connect your Instagram account in Settings first."); return; } if (!selectedStoryImage) { toast.error("Please select a story image to post."); return; } const sessionToken = localStorage.getItem('session'); if (!sessionToken) return; setIsPosting(true); toast.loading('Posting Story to Instagram...'); try { const response = await fetch('/api/social/post-instagram', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ caption: "", imageUrls: [selectedStoryImage.url], postType: 'story' }), }); const data = await response.json(); toast.dismiss(); if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post Story to Instagram.'); } toast.success(data.message || 'Successfully posted Story to Instagram!'); setSelectedStoryImage(null); } catch (error) { toast.dismiss(); console.error('Error posting Story to Instagram:', error); toast.error(error.message || 'Failed to post Story to Instagram.'); } finally { setIsPosting(false); }
  };
  const handlePostToInstagram = async () => {
       if (!isInstagramConnected) { toast.error("Please connect your Instagram account in Settings first."); return; } if (selectedImages.length === 0) { toast.error("Please select at least one image to post."); return; } const sessionToken = localStorage.getItem('session'); if (!sessionToken) { toast.error('Authentication error. Please log in again.'); return; } const imageUrlsToPost = selectedImages.map(img => img.url); setIsPosting(true); toast.loading('Posting to Instagram...'); try { const response = await fetch('/api/social/post-instagram', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ caption: currentCaption, imageUrls: imageUrlsToPost }), }); const data = await response.json(); toast.dismiss(); if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post to Instagram.'); } toast.success(data.message || 'Successfully posted to Instagram!'); } catch (error) { toast.dismiss(); console.error('Error posting to Instagram:', error); toast.error(error.message || 'Failed to post to Instagram.'); } finally { setIsPosting(false); }
  };
  const handlePostToFacebook = async () => {
       if (!isFacebookConnected) { toast.error("Please connect your Facebook account in Settings first."); return; } if (selectedImages.length === 0) { toast.error("Please select at least one image to post."); return; } const sessionToken = localStorage.getItem('session'); if (!sessionToken) { toast.error('Authentication error. Please log in again.'); return; } const imageUrlsToPost = selectedImages.map(img => img.url); setIsPosting(true); toast.loading('Posting to Facebook...'); try { const response = await fetch('/api/social/post-facebook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ caption: currentCaption, imageUrls: imageUrlsToPost }), }); const data = await response.json(); toast.dismiss(); if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post to Facebook.'); } toast.success(data.message || 'Successfully posted to Facebook!'); } catch (error) { toast.dismiss(); console.error('Error posting to Facebook:', error); toast.error(error.message || 'Failed to post to Facebook.'); } finally { setIsPosting(false); }
  };
  const handlePostStoryToFacebook = async () => {
       if (!isFacebookConnected) { toast.error("Please connect your Facebook account in Settings first."); return; } if (!selectedStoryImage) { toast.error("Please select a story image to post."); return; } const sessionToken = localStorage.getItem('session'); if (!sessionToken) return; setIsPosting(true); toast.loading('Posting Story to Facebook...'); try { const response = await fetch('/api/social/post-facebook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ caption: "", imageUrls: [selectedStoryImage.url], postType: 'story' }), }); const data = await response.json(); toast.dismiss(); if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post Story to Facebook.'); } toast.success(data.message || 'Successfully posted Story to Facebook!'); } catch (error) { toast.dismiss(); console.error('Error posting Story to Facebook:', error); toast.error(error.message || 'Failed to post Story to Facebook.'); } finally { setIsPosting(false); }
  };

  // Handler for editing the generated caption
  const handleCaptionChange = (e) => {
      setEditedGeneratedCaption(e.target.value);
  };

  // --- Added Regenerate Handler --- 
  const handleRegenerateCaption = async () => {
      setIsRegeneratingCaption(true);
      setCaptionError(null);
      try {
          const sessionToken = localStorage.getItem('session');
          if (!sessionToken) {
              toast.error('Authentication error.');
              setIsRegeneratingCaption(false);
              return;
          }

          const response = await fetch('/api/regenerate-testimonial-caption', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionToken}`
              },
              body: JSON.stringify({
                  reviewerName: originalReviewerName, // Pass original name
                  reviewText: originalReviewText, // Pass original text for context
                  currentCaption: editedGeneratedCaption // Pass current edited version
              }),
          });

          const data = await response.json();
          if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to regenerate caption');
          }

          setEditedGeneratedCaption(data.caption); // Update the state with the new caption
          toast.success('Caption regenerated!');

      } catch (error) {
          console.error("Failed to regenerate testimonial caption:", error);
          setCaptionError(error.message || 'Could not regenerate caption.');
          toast.error(error.message || 'Failed to regenerate caption.');
      } finally {
          setIsRegeneratingCaption(false);
      }
  };
  // --- End Regenerate Handler --- 

  // Add LinkedIn post handler
  const handlePostToLinkedIn = async () => {
    if (!isLinkedInConnected) {
      toast.error("Please connect your LinkedIn account in Settings first.");
      return;
    }
    if (selectedImages.length === 0) {
      toast.error("Please select at least one image to post.");
      return;
    }
    if (selectedImages.length > 9) {
      toast.error("LinkedIn posting supports up to 9 images.");
      return;
    }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    const imageUrlsToPost = selectedImages.map(img => img.url);
    setIsPosting(true);
    toast.loading('Posting to LinkedIn...');
    try {
      const response = await fetch('/api/social/post-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          caption: currentCaption,
          imageUrls: imageUrlsToPost
        }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to post to LinkedIn.');
      }
      toast.success(data.message || 'Successfully posted to LinkedIn!');
    } catch (error) {
      toast.dismiss();
      console.error('Error posting to LinkedIn:', error);
      toast.error(error.message || 'Failed to post to LinkedIn.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Your Generated Review Content" // Updated title
      size="xl" 
    >
      <div className="content-container">
        <div className="tabs">
          <button className={`tab ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>Images</button>
          <button className={`tab ${activeTab === 'caption' ? 'active' : ''}`} onClick={() => setActiveTab('caption')}>Generated Caption</button>
          <button className={`tab ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>Post to Feed</button>
          <button className={`tab ${activeTab === 'story' ? 'active' : ''}`} onClick={() => setActiveTab('story')}>Post to Story</button>
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
                              {/* Use a generic name for testimonial preview */}
                              <div className="profile-name">Your Profile</div>
                            </div>
                            <div className="more-options">•••</div>
                          </div>
                          <div className="instagram-image">
                            <img 
                              src={selectedImage.url} 
                              alt={selectedImage.name || 'Generated Image'} 
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
                              alt={selectedImage.name || 'Generated Story Image'} 
                              className="story-main-image" 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                ) : (
                  <div className="no-image">No images generated or available yet.</div>
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
                          onClick={downloadSelectedImage} // Use updated download handler
                          disabled={isDownloading}
                        >
                          <FiDownload className="icon" />
                          <span>Download PNG</span>
                        </button>
                      )}
                      {bannerbear.zip_url && (
                        <button 
                          className="download-all-button" 
                          onClick={downloadZip} // Use updated download handler
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
                <h3 className="section-title">Generated Social Post</h3>
                <div className="caption-actions">
                   <button 
                       className="caption-action regenerate" 
                       onClick={handleRegenerateCaption} 
                       disabled={isRegeneratingCaption}
                   >
                      <FiRefreshCw className={`icon ${isRegeneratingCaption ? 'spinning' : ''}`} />
                      <span>{isRegeneratingCaption ? 'Regenerating...' : 'Regenerate'}</span>
                   </button>
                  <button className="caption-action" onClick={copyCaption}>
                    <FiCopy className="icon" />
                    <span>{copiedCaption ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
              <div className="caption-content">
                {captionError && (
                    <div className="error-placeholder">Error: {captionError} <button onClick={handleRegenerateCaption}>Retry</button></div>
                )}
                <textarea
                  className="caption-textarea editable-caption"
                  value={currentCaption}
                  onChange={handleCaptionChange}
                  rows={10}
                  placeholder={captionError ? "Caption unavailable." : "Generated tip caption text..."}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'story' && (
             <div className="story-tab">
                {/* --- Copied/Adapted Story Tab Content from ResultsModal --- */}
                <div className="story-content">
                  <div className="story-layout">
                    <div className="stories-grid-container">
                      {(() => {
                        const storyImages = images.filter(image => image.isStory);
                        if (storyImages.length === 0) {
                          return <p className="no-content-message">No story-formatted designs available.</p>;
                        }
                        return (
                          <div className="stories-grid">
                            {storyImages.map((storyImage, idx) => (
                              <div 
                                key={idx} 
                                className={`story-item ${selectedStoryImage?.url === storyImage.url ? 'selected' : ''}`}
                                onClick={() => toggleImageSelection(storyImage, idx)} // Use existing handler
                              >
                                <div className="story-frame">
                                  <img src={storyImage.url} alt="Story Design" />
                                  {selectedStoryImage?.url === storyImage.url && (
                                    <div className="selected-badge">
                                      <span>Selected</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="story-actions-container">
                      <div className="story-actions">
                        <h3 className="section-title">Share Story to Social Media</h3>
                        {isLoadingStatus && <p>Loading connection status...</p>}
                        {!isLoadingStatus && (
                          <div className="social-buttons story-buttons">
                            <button 
                              className="social-button instagram"
                              onClick={handlePostStoryToInstagram}
                              disabled={!isInstagramConnected || isPosting || !selectedStoryImage}
                            >
                              <FaInstagram className="icon" />
                              <div className="button-content">
                                <span className="button-title">Post to Instagram Story</span>
                              </div>
                            </button>
                            <button 
                              className="social-button facebook"
                              onClick={handlePostStoryToFacebook}
                              disabled={!isFacebookConnected || isPosting || !selectedStoryImage}
                            >
                              <FaFacebookSquare className="icon" />
                              <div className="button-content">
                                <span className="button-title">Post to Facebook Story</span>
                              </div>
                            </button>
                          </div>
                        )}
                        {!isLoadingStatus && (!isFacebookConnected && !isInstagramConnected) && 
                          <p className="connection-tip">Connect social accounts in Settings to post stories.</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                {/* --- End Story Tab Content --- */}
            </div>
        )}
        {activeTab === 'social' && (
             <div className="social-tab testimonial-social-tab">
                <div className="social-content">
                  <div className="social-layout testimonial-layout">
                    <div className="social-images-container testimonial-images-container">
                      <h3 className="section-title">Select Image to Post</h3>
                      <div className="social-images testimonial-images-grid">
                        <div className="social-thumbnails testimonial-thumbnails">
                          {images
                            .filter(image => !image.isStory) 
                            .map((image, index) => (
                              <div 
                                key={index} 
                                className={`social-thumbnail testimonial-thumbnail ${selectedImages.some(img => img.url === image.url) ? 'active' : ''}`}
                                onClick={() => toggleImageSelection(image, index)} 
                              >
                                <img src={image.url} alt={image.name || `Design ${index + 1}`} />
                                {selectedImages.some(img => img.url === image.url) && (
                                  <div className="selected-indicator">✓</div>
                                )}
                              </div>
                          ))}
                          {images.filter(image => !image.isStory).length === 0 && (
                              <p className="no-content-message">No feed-formatted designs available.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="social-right-panel testimonial-right-panel">
                      <div className="social-caption">
                        <div className="caption-header">
                           <h3 className="section-title">Generated Caption (for Post)</h3> 
                           <button className="caption-action" onClick={copyCaption}>
                              <FiCopy className="icon" />
                              <span>{copiedCaption ? 'Copied!' : 'Copy Text'}</span>
                           </button>
                        </div>
                        <textarea
                           className="caption-textarea editable-caption"
                           value={currentCaption}
                           onChange={handleCaptionChange}
                           placeholder="Generated caption text..."
                           rows={8}
                        />
                      </div>

                      <div className="social-actions">
                        <h3 className="section-title">Share to Social Media</h3>
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
                                <span className="button-desc">Share selected images & text</span>
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
                                <span className="button-desc">Post selected images & text</span>
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
      
      <style jsx>{`
         /* Copy ALL original styles from ResultsModal.js here */ 
         /* (Ensure all necessary styles are included) */
        .content-container { max-height: 85vh; overflow-y: auto; padding: 0.5rem; position: relative; display: flex; flex-direction: column; }
        .tabs { display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 1.5rem; position: sticky; top: 0; background: white; z-index: 10; padding: 0 0.5rem; gap: 2rem; }
        .tab { padding: 0.75rem 0.5rem; background: none; border: none; font-size: 0.95rem; font-weight: 600; color: #94a3b8; cursor: pointer; position: relative; transition: all 0.2s ease; min-width: 80px; text-align: center; }
        .tab:hover { color: #64748b; }
        .tab.active { color: #62d76b; }
        .tab::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: transparent; transition: all 0.2s ease; }
        .tab.active::after { background: #62d76b; }
        .section-title { font-size: 1rem; font-weight: 600; color: #2d3748; margin: 0; }
        .images-tab { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .images-layout { display: flex; gap: 1rem; align-items: stretch; height: 100%; max-width: 1200px; margin: 0 auto; }
        .main-image-container { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; background: transparent; padding: 0; }
        .instagram-frame { width: 100%; background: white; border: 1px solid #dbdbdb; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
        .instagram-frame.story-frame { aspect-ratio: 9/16; width: auto; height: 100%; max-height: 75vh; margin: 0 auto; background: black; position: relative; border: none; }
        .story-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: black; overflow: hidden; }
        .story-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .story-main-image { width: 100%; height: 100%; object-fit: contain; }
        .instagram-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #dbdbdb; }
        .profile-info { display: flex; align-items: center; gap: 10px; }
        .profile-picture { width: 32px; height: 32px; border-radius: 50%; background: #dbdbdb; }
        .profile-name { font-weight: 600; font-size: 14px; }
        .more-options { font-weight: bold; color: #262626; }
        .instagram-image { width: 100%; background: #000; display: flex; align-items: center; justify-content: center; }
        .main-image { width: 100%; height: auto; object-fit: contain; max-height: 470px; }
        .instagram-actions { display: flex; justify-content: space-between; padding: 12px; border-top: 1px solid #dbdbdb; }
        .action-icons { display: flex; gap: 16px; font-size: 22px; }
        .bookmark { font-size: 22px; }
        .no-image { width: 100%; height: 250px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #666; font-style: italic; border-radius: 8px; }
        .thumbnails-section { width: 380px; flex-shrink: 0; background: white; border-radius: 10px; padding: 0.75rem; border: 1px solid #edf2f7; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); height: fit-content; max-height: 85vh; display: flex; flex-direction: column; position: sticky; top: 3rem; }
        .thumbnails-header { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; }
        .download-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .action-button, .download-all-button { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #62d76b; color: black; border: 2px solid black; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); white-space: nowrap; flex: 1; min-width: 0; }
        .action-button:hover, .download-all-button:hover { background: #56c15f; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .action-button:active, .download-all-button:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .action-button:disabled, .download-all-button:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .icon { font-size: 1.1rem; }
        .thumbnails-wrapper { overflow-y: auto; padding-right: 4px; }
        .thumbnails { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; padding-bottom: 0.5rem; }
        .thumbnail { width: 100%; cursor: pointer; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08); transition: transform 0.2s, box-shadow 0.2s; background: white; aspect-ratio: 1; }
        .thumbnail-image { width: 100%; height: 100%; overflow: hidden; }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .thumbnail:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .thumbnail:hover img { transform: scale(1.05); }
        .thumbnail.active { box-shadow: 0 0 0 2px #62d76b, 0 4px 8px rgba(0, 0, 0, 0.1); }
        .caption-tab { display: flex; flex-direction: column; gap: 1.25rem; }
        .caption-container { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; }
        .caption-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .caption-actions { display: flex; gap: 0.5rem; }
        .caption-action { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #62d76b; color: black; border: 2px solid black; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); white-space: nowrap; }
        .caption-action:hover { background: #56c15f; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .caption-action:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .caption-action .icon.spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .caption-textarea { width: 100%; min-height: 240px; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 0.95rem; line-height: 1.6; color: #4a5568; resize: vertical; background-color: #f8fafc; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; }
        .caption-textarea:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15); }
         /* --- Social Tab Styles --- */
        .social-tab { padding: 1rem; height: calc(85vh - 100px); /* Adjusted height */ overflow-y: hidden; }
        .social-content { height: 100%; }
        .social-layout { display: flex; gap: 1.5rem; height: 100%; }
        .social-images-container { width: 45%; display: flex; flex-direction: column; gap: 1rem; height: 100%; }
        .social-images { flex-grow: 1; background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; overflow-y: auto; min-height: 150px; /* Ensure it has some min height */ }
        .social-images::-webkit-scrollbar { width: 8px; }
        .social-images::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .social-images::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .social-images::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .social-thumbnails { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); /* Responsive columns */ gap: 1rem; }
        .social-right-panel { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; height: 100%; overflow-y: hidden; }
        .social-caption { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; display: flex; flex-direction: column; }
        .social-caption .caption-textarea { flex-grow: 1; min-height: 150px; }
        .social-actions { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; margin-top: auto; /* Push to bottom */ }
        .social-buttons { display: flex; gap: 1rem; margin-top: 1rem; }
        .social-button { flex: 1; display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1rem; /* Adjusted padding */ border-radius: 10px; text-decoration: none; color: white; transition: all 0.2s ease; border: none; cursor: pointer; }
        .social-button.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .social-button.facebook { background: #1877f2; }
        .social-button.linkedin { background: #0A66C2; }
        .social-button:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(110%); }
        .social-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .social-button .icon { font-size: 1.25rem; }
        .button-content { display: flex; flex-direction: column; text-align: left; }
        .button-title { font-weight: 600; font-size: 0.9rem; /* Adjusted font size */ }
        .button-desc { font-size: 0.75rem; opacity: 0.9; }
        .connect-tip { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666; border-left: 3px solid #62d76b; }
        .social-thumbnail { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
        .social-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .social-thumbnail:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .social-thumbnail.active { border-color: #62d76b; box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2); }
        .selected-indicator { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #62d76b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .selected-images { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; margin-top: 1rem; /* Added margin */ }
        .subsection-title { font-size: 0.9rem; font-weight: 600; color: #2d3748; margin: 0 0 1rem 0; }
        .selected-images-row { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; }
        .selected-images-row::-webkit-scrollbar { height: 6px; }
        .selected-images-row::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .selected-images-row::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .selected-images-row::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .selected-image-item { position: relative; width: 80px; /* Slightly smaller */ height: 80px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 1px solid #edf2f7; }
        .selected-image-item img { width: 100%; height: 100%; object-fit: cover; }
        .remove-image { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #e53e3e; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; }
        .remove-image:hover { background: white; transform: scale(1.1); }
         /* --- Story Tab Styles --- */
         .story-tab { display: flex; flex-direction: column; padding: 0; }
         .story-content { padding: 1rem 0; }
         .story-layout { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
         .stories-grid-container { width: 100%; padding: 1.5rem 0; display: flex; justify-content: center; }
         .stories-grid { display: flex; gap: 1.5rem; justify-content: center; width: 100%; max-width: 1000px; overflow-x: auto; padding-bottom: 1rem; }
         .story-item { cursor: pointer; transition: all 0.2s ease; position: relative; flex-shrink: 0; }
         .story-frame { position: relative; width: 180px; height: 320px; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12); transition: all 0.2s ease; border: 3px solid transparent; }
         .story-item:hover .story-frame { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
         .story-frame img { width: 100%; height: 100%; object-fit: cover; }
         .story-item.selected .story-frame { border-color: #62d76b; }
         .selected-badge { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(98, 215, 107, 0.9); color: white; border-radius: 20px; padding: 4px 12px; font-weight: 600; font-size: 0.8rem; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2); }
         .story-actions-container { width: 100%; max-width: 450px; margin-top: 1rem; }
         .story-actions { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); text-align: center; border: 1px solid #edf2f7; }
         .social-buttons.story-buttons { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; width: 100%; }
         .story-actions .social-button { width: 100%; display: flex; align-items: center; padding: 0.8rem 1.5rem; border-radius: 10px; justify-content: center; }
         .story-actions .social-button .button-title { font-size: 1rem; font-weight: 600; }
         .story-actions .social-button.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
         .story-actions .social-button.facebook { background: #1877f2; }
         .no-content-message { width: 100%; text-align: center; padding: 2rem; color: #666; }
         @media (max-width: 768px) { /* Mobile adjustments */ }
         @media (max-width: 480px) { /* Smaller mobile adjustments */ }
         /* --- Adjusted Social Tab Styles for Testimonial --- */
         .social-tab.testimonial-social-tab { 
             padding: 1rem;
             height: auto; /* Let content define height */ 
             overflow-y: visible; /* Remove forced scroll */
         }
         .social-layout.testimonial-layout {
            display: flex;
            gap: 2rem; /* Increased gap */
            height: auto;
            flex-direction: row; /* Default row layout */
         }
         .social-images-container.testimonial-images-container {
            width: 30%; /* Further reduced width */
            height: auto; 
            display: flex; 
            flex-direction: column;
            gap: 1rem;
         }
         .social-images.testimonial-images-grid {
            flex-grow: 0; /* Don't grow to fill */
            overflow-y: visible; /* No scroll needed */
            padding: 0; /* Remove padding */
            background: none; border: none; box-shadow: none; /* Remove card look */
         }
         .social-thumbnails.testimonial-thumbnails {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Reduced min size */
            gap: 1rem;
         }
         .social-thumbnail.testimonial-thumbnail {
             aspect-ratio: auto; /* Let image define aspect ratio */ 
             border-radius: 8px;
             border: 2px solid #e2e8f0;
             transition: all 0.2s ease;
         }
         .social-thumbnail.testimonial-thumbnail:hover {
             border-color: #62d76b;
             transform: translateY(-3px);
             box-shadow: 0 6px 12px rgba(0,0,0,0.1);
         }
         .social-thumbnail.testimonial-thumbnail.active {
             border-color: #62d76b;
             box-shadow: 0 0 0 3px rgba(98, 215, 107, 0.3);
         }
         .social-thumbnail.testimonial-thumbnail .selected-indicator {
             /* Keep existing indicator styles */
         }
         .social-right-panel.testimonial-right-panel {
             flex: 1; 
             max-width: 70%; /* Adjusted max-width */
             height: auto;
             overflow-y: visible;
             display: flex;
             flex-direction: column;
             gap: 0.75rem; /* Reduced gap */
         }
         .social-right-panel.testimonial-right-panel .social-caption,
         .social-right-panel.testimonial-right-panel .social-actions {
             /* Keep original card styles */
              background: white;
              border-radius: 10px;
              padding: 1rem; 
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
              border: 1px solid #edf2f7;
         }
         .social-right-panel.testimonial-right-panel .social-actions {
             margin-top: auto; /* Push actions to bottom */
         }
         
         /* --- Media Queries for Testimonial Layout --- */
         @media (max-width: 992px) { /* Adjust breakpoint if needed */
            .social-layout.testimonial-layout {
                flex-direction: column;
            }
            .social-images-container.testimonial-images-container {
                width: 100%;
            }
            .social-right-panel.testimonial-right-panel {
                max-width: 100%;
                width: 100%;
            }
         }
         @media (max-width: 768px) { /* Mobile adjustments */ }
         @media (max-width: 480px) { /* Smaller mobile adjustments */ }

         /* Ensure editable text area has appropriate background */
         .caption-textarea.editable-caption {
             background-color: #ffffff; /* White background */
             color: #1f2937; /* Darker text */
         }
         .caption-textarea.editable-caption:focus {
             outline: none;
             border-color: #62d76b;
             box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
         }
         /* Copied Regenerate button style */
        .caption-action.regenerate { background: #e2e8f0; }
        .caption-action.regenerate:hover { background: #cbd5e1; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action.regenerate:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .caption-action:disabled { background: #ccc !important; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999 !important; }
        .caption-action .icon.spinning { animation: spin 1s linear infinite; }
      `}</style>
    </Modal>
  );
} 