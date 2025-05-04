import { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import { FiDownload, FiCopy, FiShare2, FiX, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { FaInstagram, FaFacebookSquare, FaLinkedin } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Simplified version for video results
export default function VideoResultsModal({ 
  isOpen, 
  onClose, 
  videoUrl, 
  caption = '', // Assuming caption is still relevant for video 
  captionOptions = {}, // Add captionOptions prop
  propertyData = null // Add propertyData prop
}) {
  const [activeTab, setActiveTab] = useState('video'); // Default to video tab
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption || '');
  const [selectedCaptionOption, setSelectedCaptionOption] = useState('main'); // Added for consistency, though only one caption for video now
  const [isRegenerating, setIsRegenerating] = useState(false); // Added
  const [isLoadingProperty, setIsLoadingProperty] = useState(true); // New loading state

  // Social States - Copied from ResultsModal
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false); 
  const [isPosting, setIsPosting] = useState(false); 

  // Add a debug log for propertyData
  useEffect(() => {
    try {
      console.log('VideoResultsModal propertyData (FULL):', JSON.stringify(propertyData, null, 2));
    } catch (e) {
      console.log('VideoResultsModal propertyData (FULL):', propertyData);
    }
    if (propertyData && (propertyData.address || (propertyData.property && propertyData.property.address))) {
      setIsLoadingProperty(false);
    } else {
      setIsLoadingProperty(true);
    }
  }, [propertyData]);

  // Determine if this is a property (for regenerate button)
  const isProperty = Boolean(propertyData && (propertyData.address || (propertyData.property && propertyData.property.address)));
  const hasAlternativeCaption = false; // Video usually has one main caption

  // Fetch social status effect - Copied and adapted from ResultsModal
  useEffect(() => {
    let isMounted = true; 
    const fetchStatus = async () => {
      if (!isMounted || isLoadingStatus) return; 
      setIsLoadingStatus(true);
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        console.log('VideoResultsModal: No session token, cannot fetch status.');
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
          console.error('VideoResultsModal: Failed to fetch social status:', data.message);
           setIsFacebookConnected(false);
           setIsInstagramConnected(false);
           setIsLinkedInConnected(false); 
        }
      } catch (error) {
         if (!isMounted) return; 
         console.error('VideoResultsModal: Error fetching social status:', error);
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
      setActiveTab('video'); // Reset tab when closing
    }
    return () => { isMounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Use the main caption passed in results, default to empty string
      const mainCaption = caption || ''; 
      setEditedCaption(mainCaption);
      setCopiedCaption(false);
      setSelectedCaptionOption('main'); // Default to main
    }
  }, [isOpen, caption]);

  // Handle caption copy
  const copyCaption = () => {
    navigator.clipboard.writeText(editedCaption);
    setCopiedCaption(true);
    toast.success('Caption copied to clipboard!');
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Handle caption editing
  const handleCaptionChange = (e) => {
    setEditedCaption(e.target.value);
  };

  // Handle video download (using fetch -> blob -> link)
  const downloadVideo = async () => {
    if (!videoUrl) return;
    toast.loading('Starting video download...');
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Failed to fetch video (${response.status})`);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = objectUrl;
      // Create a filename like property-video-timestamp.mp4
      const filename = `property-video-${Date.now()}.mp4`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(objectUrl);
      toast.dismiss();
      toast.success('Video download started!');
    } catch (err) {
      toast.dismiss();
      console.error('Failed to download video:', err);
      toast.error(`Failed to download video: ${err.message}`);
    } 
  };

  // Placeholder Regenerate Handler (Needs implementation or prop)
  const handleRegenerateCaption = async () => {
      // --- Start: Implementation based on ResultsModal --- 
      if (!isProperty) return; // Only regenerate for properties
      
      setIsRegenerating(true);
      try {
          // Prepare context (simplified for video modal - assumes no agent profile)
          const propertyContext = propertyData?.property || propertyData || {}; // Use propertyData directly if nested structure isn't present
          const agentContext = null; // No agent profile assumed here
          const isAgentFlow = false; // Assume not agent flow

          const detailsForPrompt = {
              address: propertyContext.address || 'N/A',
              price: propertyContext.price || 'N/A',
              bedrooms: propertyContext.bedrooms || 'N/A',
              bathrooms: propertyContext.bathrooms || 'N/A',
              keyFeatures: Array.isArray(propertyContext.keyFeatures) ? propertyContext.keyFeatures.join(', ') : (propertyContext.keyFeatures || 'N/A'),
              description: propertyContext.description || 'N/A',
              facts: propertyContext.facts || 'N/A',
              originalAgentName: '' // Not applicable here
          };

          const sessionToken = localStorage.getItem('session');
          if (!sessionToken) {
              toast.error('Authentication error. Please log in again.');
              setIsRegenerating(false);
              return;
          }

          const response = await fetch('/api/regenerate-caption', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionToken}`
              },
              body: JSON.stringify({
                  propertyDetails: detailsForPrompt,
                  agentProfile: agentContext, 
                  isAgentFlow: isAgentFlow,
                  currentCaption: editedCaption, // Send the currently edited caption
                  currentOption: 'main' // Only one option for video
              }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to regenerate caption');
          }

          const data = await response.json();
          
          // Update the single edited caption state
          setEditedCaption(data.caption);

          toast.success('Caption regenerated successfully!');
      } catch (error) {
          console.error('Failed to regenerate caption:', error);
          toast.error(error.message || 'Failed to regenerate caption. Please try again.');
      } finally {
          setIsRegenerating(false);
      }
      // --- End: Implementation --- 
  };

  // Placeholder Social Post Handlers
  const handlePostVideoToFeed = async (platform) => {
      toast.error(`Posting video to ${platform} feed not yet implemented.`);
      // Add API call logic here later
  };

  const handlePostVideoStory = async (platform) => {
      toast.error(`Posting video to ${platform} story not yet implemented.`);
      // Add API call logic here later
  };


  if (!isOpen) return null;

  // Show loading spinner if propertyData is not ready
  if (isLoadingProperty) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Your Generated Video Content">
        <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span>Loading property details...</span>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Your Generated Video Content" // Updated title
    >
      {/* Added container and tabs similar to ResultsModal */}
      <div className="content-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            Video
          </button>
          <button 
            className={`tab ${activeTab === 'caption' ? 'active' : ''}`}
            onClick={() => setActiveTab('caption')}
          >
            Caption
          </button>
          <button 
            className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Post to Feed
          </button>
          <button 
            className={`tab ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            Post to Story
          </button>
        </div>

        {/* Conditional Content Rendering */}
        
        {activeTab === 'video' && (
          <div className="video-tab">
            {/* New two-column layout for video tab */}
            <div className="video-tab-layout">
              {/* Left: Video Player */}
              <div className="video-player-container">
                  {/* Wrap video in Instagram Story Frame */}
                  <div className="instagram-frame story-frame">
                    {videoUrl ? (
                      <video 
                        src={videoUrl} 
                        controls 
                        preload="auto"
                        className="video-player"
                        key={videoUrl} // Add key to force re-render if URL changes
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="no-video-placeholder">Video generation failed or URL is missing.</div>
                    )}
                  </div> 
              </div>
              
              {/* Right: Caption Editor and Actions */}
              <div className="video-details-container">
                 {/* Reuse caption header and textarea */}
                 <div className="caption-header">
                    <h3 className="section-title">Caption</h3>
                    <button 
                      className={`caption-action ${copiedCaption ? 'copied' : ''}`}
                      onClick={copyCaption}
                      disabled={!editedCaption}
                    >
                      <FiCopy className="icon" />
                      <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                    </button>
                 </div>
                 <textarea
                    className="caption-textarea small"
                    value={editedCaption}
                    onChange={handleCaptionChange}
                    rows={10} // Adjust rows as needed for this layout
                    placeholder="Generated caption will appear here..."
                 />
                 
                 {/* Video Actions below caption */}
                 {videoUrl && (
                   <div className="video-actions">
                     <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
                       <button type="button" className="action-button download">
                         <FiDownload className="icon" /> Download Video
                       </button>
                     </a>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'caption' && (
          <div className="caption-tab">
            <div className="caption-container">
              <div className="caption-header">
                <h3 className="section-title">Caption</h3>
                <div className="caption-actions">
                  {isProperty && ( 
                  <button 
                    className="caption-action regenerate" 
                    onClick={handleRegenerateCaption}
                    disabled={isRegenerating}
                  >
                    <FiRefreshCw className={`icon ${isRegenerating ? 'spinning' : ''}`} />
                    <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                  )}
                  <button 
                    className={`caption-action ${copiedCaption ? 'copied' : ''}`}
                    onClick={copyCaption}
                    disabled={!editedCaption}
                  >
                    <FiCopy className="icon" />
                    <span>{copiedCaption ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              
              {/* Removed caption options buttons for video */}
              
              <div className="caption-content">
                <textarea
                  className="caption-textarea"
                  value={editedCaption}
                  onChange={handleCaptionChange}
                  rows={12} // Adjusted rows
                  placeholder="Generated caption will appear here..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
            <div className="social-tab"> 
                {/* Use two-column layout */}
                <div className="social-layout">
                    {/* Left: Video Preview */}
                    <div className="social-video-preview">
                        {/* <h3 className="section-title">Video Preview</h3> */}
                        {/* Apply the story frame here too */}
                        <div className="instagram-frame story-frame">
                          {videoUrl ? (
                              <video 
                              src={videoUrl} 
                              controls 
                              preload="metadata" /* Use metadata to load faster */
                              className="video-player feed-preview"
                              key={`feed-${videoUrl}`}
                              >
                              Your browser does not support the video tag.
                              </video>
                          ) : (
                              <div className="no-video-placeholder">Video not available.</div>
                          )}
                        </div>
                    </div>
                    {/* Right: Caption and Actions */}
                    <div className="social-right-panel"> 
                        <div className="social-caption">
                            <h3 className="section-title">Caption Preview</h3>
                            <div className="caption-preview">
                               {editedCaption || "(No caption available)"}
                            </div>
                        </div>
                        <div className="social-actions">
                            <h3 className="section-title">Share Video to Feed</h3>
                             {isLoadingStatus && <p>Loading connection status...</p>} 
                             {!isLoadingStatus && (
                                <div className="social-buttons">
                                    {/* Instagram Video Feed - Add this */}
                                    <button 
                                      className="social-button instagram"
                                      onClick={() => handlePostVideoToFeed('Instagram')}
                                      disabled={isPosting || !videoUrl || !isInstagramConnected}
                                    >
                                      <FaInstagram className="icon" />
                                      <div className="button-content">
                                        <span className="button-title">Share on Instagram</span>
                                        <span className="button-desc">Post video to your profile</span>
                                      </div>
                                    </button>
                                    {/* Facebook Video Feed - Placeholder */}
                                    <button 
                                      className="social-button facebook"
                                      onClick={() => handlePostVideoToFeed('Facebook')}
                                      disabled={isPosting || !videoUrl || !isFacebookConnected}
                                    >
                                      <FaFacebookSquare className="icon" />
                                      <div className="button-content">
                                        <span className="button-title">Share on Facebook</span>
                                        <span className="button-desc">Post video to your page</span>
                                      </div>
                                    </button>
                                     {/* LinkedIn Video Feed - Placeholder */}
                                    <button 
                                      className="social-button linkedin"
                                      onClick={() => handlePostVideoToFeed('LinkedIn')}
                                      disabled={isPosting || !videoUrl || !isLinkedInConnected}
                                    >
                                      <FaLinkedin className="icon" />
                                      <div className="button-content">
                                        <span className="button-title">Share on LinkedIn</span>
                                        <span className="button-desc">Post video to your profile</span>
                                      </div>
                                    </button>
                                    {/* Add other platforms supporting video feed posts */} 
                                </div>
                             )}
                             {!isLoadingStatus && (!isFacebookConnected || !isLinkedInConnected || !isInstagramConnected) && (
                                <p className="connect-tip">
                                    Connect accounts in Settings to enable posting.
                                </p>
                             )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'story' && (
            <div className="story-tab"> 
                {/* Use centered layout with framed preview */}
                <div className="story-layout">
                    {/* Framed Video Preview */}
                    <div className="story-video-preview-container">
                         <div className="instagram-frame story-frame">
                            {videoUrl ? (
                                <video 
                                src={videoUrl} 
                                controls 
                                preload="metadata"
                                className="video-player"
                                key={`story-${videoUrl}`}
                                >
                                Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="no-video-placeholder">Video not available.</div>
                            )}
                        </div>
                    </div>
                    {/* Actions Below */}
                    <div className="story-actions-container"> 
                        <div className="story-actions">
                            <h3 className="section-title">Share Video as Story</h3>
                            {isLoadingStatus && <p>Loading connection status...</p>}
                            {!isLoadingStatus && (
                               <div className="social-buttons story-buttons">
                                   {/* Instagram Story - Placeholder */} 
                                   <button 
                                   className="social-button instagram"
                                   onClick={() => handlePostVideoStory('Instagram')}
                                   disabled={isPosting || !videoUrl || !isInstagramConnected}
                                   >
                                   <FaInstagram className="icon" />
                                   <div className="button-content">
                                       <span className="button-title">Post to Instagram Story</span>
                                   </div>
                                   </button>
                                   {/* Facebook Story - Placeholder */} 
                                   <button 
                                   className="social-button facebook"
                                   onClick={() => handlePostVideoStory('Facebook')}
                                   disabled={isPosting || !videoUrl || !isFacebookConnected}
                                   >
                                   <FaFacebookSquare className="icon" />
                                   <div className="button-content">
                                       <span className="button-title">Post to Facebook Story</span>
                                   </div>
                                   </button>
                               </div>
                            )}
                            {!isLoadingStatus && (!isFacebookConnected && !isInstagramConnected) && 
                               <p className="connect-tip">Connect accounts in Settings to post stories.</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div> 
      
      {/* --- Re-used styles from ResultsModal --- */}
      <style jsx>{`
        /* Container and Tabs */
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
        .tab:hover { color: #64748b; }
        .tab.active { color: #62d76b; }
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
        .tab.active::after { background: #62d76b; }
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin: 0;
        }

        /* Video Tab Styles */
        .video-tab { padding: 1rem; }
        .video-tab-layout {
          display: flex;
          gap: 1rem;
        }
        .video-player-container {
          flex: 1;
          /* Centering is now handled by the frame/layout */
        }
        .video-player {
          width: 100%;
          height: 100%; /* Make video fill the frame height */
          border-radius: 6px; /* Keep slight rounding */
          background-color: #000;
          object-fit: contain; /* Ensure video fits within frame without stretching */
        }
        .no-video-placeholder {
          width: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9ecef;
          color: #6c757d;
          font-style: italic;
          border-radius: 6px;
        }
        .video-details-container {
          flex: 1;
          background: white;
          border-radius: 10px;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          max-height: 55vh;
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
        .caption-action { /* Re-used style */ 
            display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
            padding: 0.5rem 0.75rem; background: #62d76b; color: black; border: 2px solid black; 
            border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; 
            transition: all 0.2s ease; box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); 
        }
        .caption-action:hover { background: #56c15f; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .caption-action.copied span { color: #4CAF50; }
        .caption-action .icon { font-size: 1rem; }
        .caption-action.regenerate { background: #e2e8f0; }
        .caption-action.regenerate:hover { background: #cbd5e1; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action.regenerate:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .caption-action.regenerate:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .caption-action .icon.spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .caption-content { 
            margin-top: 0.75rem; 
            flex-grow: 1; /* Allow textarea to grow */
            overflow-y: auto; /* Add scroll if needed */
            min-height: 100px; /* Set a smaller min height */
        }
        .caption-textarea { 
            width: 100%; 
            height: 100%; /* Fill the growable content area */
            min-height: 100px; /* Match min height */
            padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; 
            font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #4a5568; resize: vertical; 
            background-color: #ffffff; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; 
        }
        /* Style for smaller text area in video tab layout */
        .video-tab .caption-textarea {
            height: auto; /* Override height: 100% */
            min-height: 150px; /* Example smaller height */
            max-height: 30vh; /* Prevent excessive height */
        }
        .caption-textarea:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15); }
        .video-actions {
            margin-top: 0.75rem;
            flex-shrink: 0;
            display: flex;
            gap: 0.75rem;
            justify-content: center;
        }
        .action-button { /* Re-used style */
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.6rem 1rem;
            background: #62d76b;
            color: black;
            border: 2px solid black;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
            text-decoration: none; 
        }
        .action-button:hover { background: #56c15f; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .action-button:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .action-button .icon { font-size: 1rem; }

        /* Caption Tab Styles (Re-used) - Ensure textarea height is correct here too */
        .caption-tab { padding: 1rem; }
        .caption-container { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; }
        .caption-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .caption-actions { display: flex; gap: 0.5rem; }
        .caption-action { /* Re-used style */ 
            display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
            padding: 0.5rem 0.75rem; background: #62d76b; color: black; border: 2px solid black; 
            border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; 
            transition: all 0.2s ease; box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); 
        }
        .caption-action:hover { background: #56c15f; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .caption-action.copied span { color: #4CAF50; }
        .caption-action .icon { font-size: 1rem; }
        .caption-action.regenerate { background: #e2e8f0; }
        .caption-action.regenerate:hover { background: #cbd5e1; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8); transform: translateY(-1px); }
        .caption-action.regenerate:active { transform: translateY(1px); box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8); }
        .caption-action.regenerate:disabled { background: #ccc; cursor: not-allowed; opacity: 0.7; transform: none; box-shadow: none; border-color: #999; }
        .caption-action .icon.spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .caption-content { margin-top: 0.75rem; }
        .caption-tab .caption-textarea { 
            width: 100%; min-height: 240px; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; 
            font-family: inherit; font-size: 0.95rem; line-height: 1.6; color: #4a5568; resize: vertical; 
            background-color: #ffffff; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05); transition: all 0.2s ease; 
        }
        .caption-tab .caption-textarea:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15); }

        /* Social Tab Styles (Re-used and adapted) */
        .social-tab { padding: 1rem; }
        .social-layout { display: flex; gap: 1.5rem; }
        .social-video-preview { flex: 1; }
        .social-right-panel { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }
        .social-caption { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; }
        .caption-preview { 
            margin-top: 0.75rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; 
            font-size: 0.9rem; color: #495057; max-height: 150px; overflow-y: auto; white-space: pre-wrap; 
        }
        .social-actions { background: white; border-radius: 10px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; }
        .social-buttons { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
        .social-button { /* Re-used style */
            flex: 1; display: flex; align-items: center; gap: 1.25rem; padding: 1rem 1.5rem; 
            border-radius: 12px; text-decoration: none; color: white; transition: all 0.2s ease; 
            border: none; cursor: pointer; background: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
        }
        .social-button.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .social-button.facebook { background: #1877f2; }
        .social-button.linkedin { background: #0A66C2; }
        .social-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .social-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .social-button .icon { font-size: 1.5rem; flex-shrink: 0; }
        .button-content { display: flex; flex-direction: column; text-align: left; flex-grow: 1; }
        .button-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; }
        .button-desc { font-size: 0.85rem; opacity: 0.9; }
        .connect-tip { margin-top: 1.5rem; padding: 1rem 1.25rem; background: #f8f9fa; border-radius: 10px; font-size: 0.9rem; color: #666; border-left: 4px solid #62d76b; line-height: 1.5; }
        .connect-tip a { color: #62d76b; text-decoration: none; font-weight: 500; }
        .connect-tip a:hover { text-decoration: underline; }

        /* Story Tab Styles (Re-used and adapted) */
        .story-tab { padding: 1rem; }
        .story-layout { display: flex; flex-direction: column; align-items: center; }
        .story-video-preview-container {
            width: 100%;
            max-width: 450px;
            margin-bottom: 1.5rem;
        }
        .story-actions-container { width: 100%; max-width: 450px; margin: 0 auto; } 
        .story-actions { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); text-align: center; }
        .social-buttons.story-buttons { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; width: 100%; }
        .story-actions .social-button { width: 100%; display: flex; align-items: center; padding: 0.8rem 1.5rem; border-radius: 10px; justify-content: center; }
        .story-actions .social-button .button-title { font-size: 1rem; font-weight: 600; }
        .story-actions .social-button.instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .story-actions .social-button.facebook { background: #1877f2; }

        /* Instagram Frame Styles */
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
          width: auto; /* Let height and aspect ratio determine width */
          height: auto; /* Let aspect ratio and width determine height */
          max-height: 55vh; /* Significantly reduce max height */
          max-width: 300px; /* Add a max width to control size */
          margin: 0 auto; /* Center frame */
          background: black;
          position: relative;
          border: none; /* Remove border for story frame */
          border-radius: 14px; /* Rounded corners like story */
        }

        /* Remove specific feed preview style as frame handles it now */
        /*
        .video-player.feed-preview {
            max-height: 400px; // Constrain height in feed preview 
            border: 1px solid #eee; // Add subtle border
        }
        */
      `}</style>
    </Modal>
  );
} 