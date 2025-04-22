import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiX, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { FaInstagram, FaFacebookSquare } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TipResultsModal({ isOpen, onClose, results, selectedTip }) {
  const [activeTab, setActiveTab] = useState('images');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const thumbnailsRef = useRef(null);
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [caption, setCaption] = useState('');
  const [isCaptionLoading, setIsCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('images');
      setIsDownloading(false);
      setCopiedCaption(false);
      setSelectedImageIndex(0);
      setIsFacebookConnected(false);
      setIsInstagramConnected(false);
      setIsLoadingStatus(false);
      setIsPosting(false);
      setCaption('');
      setIsCaptionLoading(false);
      setCaptionError(null);
    } else {
      setCaption(results?.caption || '');
      if (!results?.caption) {
          console.warn("TipResultsModal: results object did not contain a caption.");
      }
      setIsCaptionLoading(false);
      setCaptionError(null);
    }
  }, [isOpen, results]);

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
        } else {
          setIsFacebookConnected(false);
          setIsInstagramConnected(false);
        }
      } catch (error) {
        if (!isMounted) return;
        setIsFacebookConnected(false);
        setIsInstagramConnected(false);
      } finally {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      }
    };
    if (isOpen) { fetchStatus(); }
    else { setIsLoadingStatus(false); setIsFacebookConnected(false); setIsInstagramConnected(false); }
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!results || !results.bannerbear) return null;

  const { bannerbear } = results;
  const currentCaption = caption;

  const formatTemplateName = (templateName) => {
    if (!templateName) return 'Tip Design'; 
    return templateName.replace(/^template_/, '').replace(/_image_url$/, '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  const processImages = () => {
    let images = [];
    const standardImages = [];
    const largeImages = [];

    if (bannerbear.images && bannerbear.images.length > 0) {
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
        const isLargeImage = height >= 1900 || templateName.includes('1920') || templateName.includes('large') || templateName.includes('story');
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
            const isLargeImage = img.template.includes('1920') || img.template.includes('large') || img.template.includes('story');
            img.isStory = isLargeImage;
            if (isLargeImage) largeImages.push(img); else standardImages.push(img);
        });
        images = [...standardImages, ...largeImages];
    }

    return images;
  };
  const images = processImages();
  const selectedImage = images[selectedImageIndex] || {};
  const imageUrl = selectedImage.url;

  const downloadImage = async (url, filename) => {
    if (!url) return;
    setIsDownloading(true);
    toast.loading('Preparing download...');
    try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.dismiss();
      toast.success('Download started!');
    } catch (err) {
      console.error('Failed to download image:', err);
      toast.dismiss();
      toast.error(`Download failed: ${err.message}. Please try saving the image directly.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadSelectedImage = () => {
    const filename = `tip-${selectedImage.name || 'design'}-${Date.now()}.png`;
    downloadImage(selectedImage.url, filename);
  };

  const downloadZip = () => {
    if (bannerbear.zip_url) {
      downloadImage(bannerbear.zip_url, 'tip-designs.zip');
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(currentCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const isFeedImageSelected = !!imageUrl;
  const isStoryImageSelected = !!imageUrl && selectedImage.isStory;

  const handlePostStoryToInstagram = async () => {
    if (!isInstagramConnected) { toast.error("Connect Instagram first."); return; }
    if (!selectedImage.url || !selectedImage.isStory) { toast.error("Select a story-formatted design."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting Story to Instagram...');
    try {
      const response = await fetch('/api/social/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: "", imageUrls: [selectedImage.url], postType: 'story' }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post Story.'); }
      toast.success(data.message || 'Posted Story!');
    } catch (error) {
      toast.dismiss(); console.error('Error:', error); toast.error(error.message || 'Failed to post Story.');
    } finally { setIsPosting(false); }
  };

  const handlePostToInstagram = async () => {
    if (!isInstagramConnected) { toast.error("Connect Instagram first."); return; }
    if (!selectedImage.url || selectedImage.isStory) { toast.error("Select a feed-formatted design."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting to Instagram...');
    try {
      const response = await fetch('/api/social/post-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: currentCaption, imageUrls: [selectedImage.url] }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post.'); }
      toast.success(data.message || 'Posted!');
    } catch (error) {
      toast.dismiss(); console.error('Error:', error); toast.error(error.message || 'Failed to post.');
    } finally { setIsPosting(false); }
  };

  const handlePostToFacebook = async () => {
    if (!isFacebookConnected) { toast.error("Connect Facebook first."); return; }
    if (!selectedImage.url || selectedImage.isStory) { toast.error("Select a feed-formatted design."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting to Facebook...');
    try {
      const response = await fetch('/api/social/post-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: currentCaption, imageUrls: [selectedImage.url] }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post.'); }
      toast.success(data.message || 'Posted!');
    } catch (error) {
      toast.dismiss(); console.error('Error:', error); toast.error(error.message || 'Failed to post.');
    } finally { setIsPosting(false); }
  };

  const handlePostStoryToFacebook = async () => {
    if (!isFacebookConnected) { toast.error("Connect Facebook first."); return; }
    if (!selectedImage.url || !selectedImage.isStory) { toast.error("Select a story-formatted design."); return; }
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) { toast.error('Auth error.'); return; }
    setIsPosting(true);
    toast.loading('Posting Story to Facebook...');
    try {
      const response = await fetch('/api/social/post-facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify({ caption: "", imageUrls: [selectedImage.url], postType: 'story' }),
      });
      const data = await response.json();
      toast.dismiss();
      if (!response.ok || !data.success) { throw new Error(data.message || 'Failed to post Story.'); }
      toast.success(data.message || 'Posted Story!');
    } catch (error) {
      toast.dismiss(); console.error('Error:', error); toast.error(error.message || 'Failed to post Story.');
    } finally { setIsPosting(false); }
  };

  const handleCaptionChange = (e) => {
    setCaption(e.target.value);
  };

  const handleRegenerateCaption = async () => {
    if (!selectedTip?.advice_heading) return;

    setIsCaptionLoading(true);
    setCaptionError(null);
    console.log("Regenerating tip caption for:", selectedTip.advice_heading);

    try {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        throw new Error('Authentication session not found.');
      }

      const response = await fetch('/api/tips/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          advice_heading: selectedTip.advice_heading,
          advice: selectedTip.advice,
          isRegeneration: true,
          currentCaption: currentCaption
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to regenerate caption.');
      }

      setCaption(data.caption || '');
      toast.success('Caption regenerated!');

    } catch (error) {
      console.error("Error regenerating tip caption:", error);
      setCaptionError(error.message || 'Could not regenerate caption.');
    } finally {
      setIsCaptionLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Generated Tip Design"
      size="xl"
    >
      <div className="content-container">
        <div className="tabs">
          <button className={`tab ${activeTab === 'images' ? 'active' : ''}`} onClick={() => setActiveTab('images')}>Images</button>
          <button className={`tab ${activeTab === 'caption' ? 'active' : ''}`} onClick={() => setActiveTab('caption')}>Caption</button>
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
                                <div className="profile-name">Your Profile</div>
                                </div>
                                <div className="more-options">•••</div>
                            </div>
                            <div className="instagram-image">
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.name || 'Generated Tip Image'}
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
                                    alt={selectedImage.name || 'Generated Story Tip Image'} 
                                    className="story-main-image" 
                                />
                            </div>
                         </div>
                     )}
                  </div>
                ) : (
                  <div className="no-image">No images generated.</div>
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
                          onClick={downloadSelectedImage}
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
                  <div className="thumbnails-wrapper" ref={thumbnailsRef}>
                    <div className="thumbnails">
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
                      disabled={isCaptionLoading}
                  >
                     <FiRefreshCw className={`icon ${isCaptionLoading ? 'spinning' : ''}`} />
                     <span>{isCaptionLoading ? 'Generating...' : 'Regenerate'}</span>
                  </button>
                  <button className="caption-action" onClick={copyCaption} disabled={!currentCaption || !!captionError}>
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
                  readOnly={!!captionError}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'story' && (
          <div className="story-tab">
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
                            className={`story-item ${selectedImage.url === storyImage.url ? 'selected' : ''}`}
                            onClick={() => {
                                const originalIndex = images.findIndex(img => img.url === storyImage.url);
                                if (originalIndex !== -1) {
                                    setSelectedImageIndex(originalIndex);
                                }
                             }}
                          >
                            <div className="story-frame">
                              <img src={storyImage.url} alt="Tip Story Design" />
                              {selectedImage.url === storyImage.url && (
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
                          disabled={!isInstagramConnected || isPosting || !selectedImage.isStory}
                        >
                          <FaInstagram className="icon" />
                          <div className="button-content">
                            <span className="button-title">Post to Instagram Story</span>
                          </div>
                        </button>
                        <button
                          className="social-button facebook"
                          onClick={handlePostStoryToFacebook}
                          disabled={!isFacebookConnected || isPosting || !selectedImage.isStory}
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
          </div>
        )}
        {activeTab === 'social' && (
          <div className="social-tab testimonial-social-tab">
            <div className="social-content">
              <div className="social-layout testimonial-layout">
                <div className="social-images-container testimonial-images-container">
                  <h3 className="section-title">Select Image to Post</h3>
                  <div className="social-images testimonial-images-grid">
                     {(() => {
                        const feedImages = images.filter(image => !image.isStory);
                        if (feedImages.length === 0) {
                         return <p className="no-content-message">No feed-formatted designs available.</p>;
                        }
                        return (
                            <div className="social-thumbnails testimonial-thumbnails">
                                {feedImages.map((feedImage, idx) => (
                                    <div 
                                        key={idx}
                                        className={`social-thumbnail testimonial-thumbnail ${selectedImage.url === feedImage.url ? 'active' : ''}`}
                                        onClick={() => {
                                            const originalIndex = images.findIndex(img => img.url === feedImage.url);
                                            if (originalIndex !== -1) {
                                                setSelectedImageIndex(originalIndex);
                                            }
                                        }}
                                    >
                                        <img src={feedImage.url} alt="Tip Design" />
                                        {selectedImage.url === feedImage.url && (
                                            <div className="selected-indicator">✓</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                     })()}
                  </div>
                </div>

                <div className="social-right-panel testimonial-right-panel">
                  <div className="social-caption">
                    <div className="caption-header">
                      <h3 className="section-title">Caption (for Post)</h3>
                      <button className="caption-action" onClick={copyCaption} disabled={isCaptionLoading || !!captionError}>
                        <FiCopy className="icon" />
                        <span>{copiedCaption ? 'Copied!' : 'Copy Text'}</span>
                      </button>
                    </div>
                    {isCaptionLoading && <div className="loading-placeholder small">Loading...</div>}
                    {captionError && <div className="error-placeholder small">Error loading caption.</div>}
                    <textarea
                       className="caption-textarea editable-caption"
                       value={currentCaption}
                       onChange={handleCaptionChange}
                       placeholder={captionError ? "Caption unavailable." : "Generated tip caption text..."}
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
                          disabled={isPosting || selectedImage.isStory || !selectedImage.url}
                        >
                          <FaInstagram className="icon" />
                          <div className="button-content">
                            <span className="button-title">Post to Instagram</span>
                            <span className="button-desc">Share selected image & text</span>
                          </div>
                        </button>
                        <button
                          className="social-button facebook"
                          onClick={handlePostToFacebook}
                          disabled={isPosting || selectedImage.isStory || !selectedImage.url}
                        >
                          <FaFacebookSquare className="icon" />
                          <div className="button-content">
                            <span className="button-title">Share on Facebook</span>
                            <span className="button-desc">Post selected image & text</span>
                          </div>
          </button>
                      </div>
                    )}
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
        .caption-action:disabled { background: #ccc !important; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999 !important; }
        .caption-action .icon.spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .caption-textarea { width: 100%; min-height: 240px; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 0.95rem; line-height: 1.6; color: #4a5568; resize: vertical; background-color: #f8fafc; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; }
        .caption-textarea:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15); }
         .social-tab { padding: 1rem; height: calc(85vh - 100px); overflow-y: hidden; }
        .social-content { height: 100%; }
        .social-layout { display: flex; gap: 1.5rem; height: 100%; }
        .social-images-container { width: 45%; display: flex; flex-direction: column; gap: 1rem; height: 100%; }
        .social-images { flex-grow: 1; background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; overflow-y: auto; min-height: 150px; }
        .social-images::-webkit-scrollbar { width: 8px; }
        .social-images::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .social-images::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .social-images::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .social-thumbnails { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; }
        .social-right-panel { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; height: 100%; overflow-y: hidden; }
        .social-caption { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; display: flex; flex-direction: column; }
        .social-caption .caption-textarea { flex-grow: 1; min-height: 150px; }
        .social-actions { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; margin-top: auto; }
        .social-buttons { display: flex; gap: 1rem; margin-top: 1rem; }
        .social-button { flex: 1; display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1rem; border-radius: 10px; text-decoration: none; color: white; transition: all 0.2s ease; border: none; cursor: pointer; }
        .social-button.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .social-button.facebook { background: #1877f2; }
        .social-button:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(110%); }
        .social-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .social-button .icon { font-size: 1.25rem; }
        .button-content { display: flex; flex-direction: column; text-align: left; }
        .button-title { font-weight: 600; font-size: 0.9rem; }
        .button-desc { font-size: 0.75rem; opacity: 0.9; }
        .connect-tip { margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666; border-left: 3px solid #62d76b; }
        .social-thumbnail { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; }
        .social-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
        .social-thumbnail:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        .social-thumbnail.active { border-color: #62d76b; box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2); }
        .selected-indicator { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #62d76b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .selected-images { background: white; border-radius: 10px; padding: 1rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; margin-top: 1rem; }
        .subsection-title { font-size: 0.9rem; font-weight: 600; color: #2d3748; margin: 0 0 1rem 0; }
        .selected-images-row { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; }
        .selected-images-row::-webkit-scrollbar { height: 6px; }
        .selected-images-row::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .selected-images-row::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 3px; }
        .selected-images-row::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        .selected-image-item { position: relative; width: 80px; height: 80px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 1px solid #edf2f7; }
        .selected-image-item img { width: 100%; height: 100%; object-fit: cover; }
        .remove-image { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #e53e3e; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.2s ease; }
        .remove-image:hover { background: white; transform: scale(1.1); }
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
         @media (max-width: 768px) { }
         @media (max-width: 480px) { }
         .social-tab.testimonial-social-tab { 
             padding: 1rem;
             height: auto;
             overflow-y: visible;
         }
         .social-layout.testimonial-layout {
            display: flex;
            gap: 2rem;
            height: auto;
            flex-direction: row;
         }
         .social-images-container.testimonial-images-container {
            width: 30%;
            height: auto; 
          display: flex;
          flex-direction: column;
            gap: 1rem;
         }
         .social-images.testimonial-images-grid {
            flex-grow: 0;
            overflow-y: visible;
            padding: 0;
            background: none; border: none; box-shadow: none;
         }
         .social-thumbnails.testimonial-thumbnails {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
         }
         .social-thumbnail.testimonial-thumbnail {
             aspect-ratio: auto;
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
             position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; background: #62d76b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
         .social-right-panel.testimonial-right-panel {
             flex: 1; 
             max-width: 70%;
             height: auto;
             overflow-y: visible;
          display: flex;
             flex-direction: column;
             gap: 0.75rem;
         }
         .social-right-panel.testimonial-right-panel .social-caption,
         .social-right-panel.testimonial-right-panel .social-actions {
             background: white;
             border-radius: 10px;
             padding: 1rem; 
             box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
             border: 1px solid #edf2f7;
         }
         .social-right-panel.testimonial-right-panel .social-actions {
             margin-top: auto;
         }
         
         @media (max-width: 992px) {
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
         @media (max-width: 768px) { }
         @media (max-width: 480px) { }

         .caption-textarea.editable-caption {
             background-color: #ffffff;
             color: #1f2937;
         }
         .caption-textarea.editable-caption:focus {
             outline: none;
             border-color: #62d76b;
             box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
        }

        /* Add separate style for the regenerate button */
        .caption-action.regenerate {
          background: #f1f5f9; /* Light gray background */
          color: #374151; /* Dark gray text */ 
          border-color: #94a3b8; /* Medium gray border */
        }
        .caption-action.regenerate:hover {
          background: #e2e8f0; /* Slightly darker on hover */
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
        }
        .caption-action.regenerate:active {
          background: #cbd5e1; /* Even darker on active */
        }
        .caption-action.regenerate:disabled {
          background: #e5e7eb !important; /* Light gray when disabled */
          border-color: #d1d5db !important; /* Lighter border when disabled */
          color: #9ca3af; /* Lighter text when disabled */
        }
      `}</style>
    </Modal>
  );
} 