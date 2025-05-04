import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AiFillStar } from 'react-icons/ai';

export default function TemplateSelector({ selectedTemplate, onSelect, onSetsLoaded, apiEndpoint = '/api/bannerbear/template-sets', outputType, onOutputTypeChange }) {
  const [templateSets, setTemplateSets] = useState([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [errorLoadingSets, setErrorLoadingSets] = useState(null);
  const [displayTemplateSets, setDisplayTemplateSets] = useState([]);
  
  const [startIndex, setStartIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  useEffect(() => {
    const fetchSets = async () => {
      setIsLoadingSets(true);
      setErrorLoadingSets(null);
      
      let headers = {};
      if (typeof window !== 'undefined') {
        const sessionToken = localStorage.getItem('session');
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        } else {
           console.warn('TemplateSelector: No session token found in localStorage.');
        }
      } else {
        console.warn('TemplateSelector: Cannot access localStorage outside browser.');
      }
      
      try {
        console.log(`TemplateSelector fetching from: ${apiEndpoint}`);
        const timestamp = new Date().getTime(); // Add a timestamp to prevent caching
        const response = await fetch(`${apiEndpoint}?t=${timestamp}`, { headers });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch template sets');
        }
        let sets = data.sets || [];
        // Separate user and platform sets
        const userSets = sets.filter(set => set.isUserOwned);
        const platformSets = sets.filter(set => !set.isUserOwned);
        // Rename user sets as 'My Template Set X'
        const renamedUserSets = userSets.map((set, idx) => ({
          ...set,
          display_name: `My Template Set ${idx + 1}`
        }));
        // Combine: user sets first, then platform sets
        sets = [...renamedUserSets, ...platformSets];
        setTemplateSets(sets);
        setDisplayTemplateSets(sets);
        
        if (onSetsLoaded) {
          onSetsLoaded(sets);
        }
      } catch (error) {
        console.error("Error fetching template sets:", error);
        setErrorLoadingSets(error.message || 'Could not load template sets.');
        setTemplateSets([]);
      } finally {
        setIsLoadingSets(false);
      }
    };

    fetchSets();
  }, [apiEndpoint]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage || !currentTemplateId) return;
      
      const currentSet = templateSets.find(set => set.id === currentTemplateId);
      const currentPreviews = currentSet?.previews || [];
      if (currentPreviews.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentImageIndex - 1 + currentPreviews.length) % currentPreviews.length;
        setCurrentImageIndex(prevIndex);
        setPreviewImage(currentPreviews[prevIndex].url);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentImageIndex + 1) % currentPreviews.length;
        setCurrentImageIndex(nextIndex);
        setPreviewImage(currentPreviews[nextIndex].url);
      } else if (e.key === 'Escape') {
        setPreviewImage(null);
      }
    };
    
    if (previewImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImage, currentImageIndex, currentTemplateId, templateSets]);

  const getSelectedTemplateName = () => {
    const selected = templateSets.find(t => t.id === selectedTemplate);
    return selected ? selected.display_name : 'Select a Template Set';
  };

  const PreviewModal = () => {
    if (!previewImage) return null;
    
    const currentSet = templateSets.find(set => set.id === currentTemplateId);
    const currentPreviews = currentSet?.previews || [];

    return createPortal(
      <div 
        className="preview-modal-overlay"
        onClick={() => setPreviewImage(null)}
      >
        <div 
          className="preview-modal"
          onClick={e => e.stopPropagation()}
        >
          <button className="close-preview" onClick={() => setPreviewImage(null)}>×</button>
          
          {currentPreviews.length > 1 && (
            <>
              <button 
                className="nav-button prev modal-nav" 
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIndex = (currentImageIndex - 1 + currentPreviews.length) % currentPreviews.length;
                  setCurrentImageIndex(prevIndex);
                  setPreviewImage(currentPreviews[prevIndex].url);
                }}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button 
                className="nav-button next modal-nav" 
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIndex = (currentImageIndex + 1) % currentPreviews.length;
                  setCurrentImageIndex(nextIndex);
                  setPreviewImage(currentPreviews[nextIndex].url);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </>
          )}
          
          <img 
            src={previewImage} 
            alt="Template Preview (Full Size)" 
            className="preview-modal-image"
          />
        </div>
        <style jsx global>{` 
          .preview-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:999999;}
          .preview-modal{position:relative;padding:20px;max-width:80vw;max-height:80vh;display:flex;align-items:center;justify-content:center;}
          .preview-modal-image{max-width:100%;max-height:calc(80vh - 40px);object-fit:contain;border-radius:8px;}
          .close-preview{position:absolute;top:-40px;right:-40px;width:32px;height:32px;background:white;border:none;border-radius:50%;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1000000;transition:all .2s ease;}
          .close-preview:hover{background:#f5f5f5;transform:scale(1.1);}
          .preview-modal .modal-nav{position:absolute;top:50%;transform:translateY(-50%);background:white;border:none;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:1000000;box-shadow:0 2px 8px rgba(0,0,0,.1);transition:all .2s ease;}
          .preview-modal .modal-nav:hover{background:#f5f5f5;transform:translateY(-50%) scale(1.1);}
          .preview-modal .modal-nav.prev{left:-50px;}
          .preview-modal .modal-nav.next{right:-50px;}
          @media (max-width:768px){.preview-modal{max-width:95vw;padding:15px;}.preview-modal .modal-nav.prev{left:10px;}.preview-modal .modal-nav.next{right:10px;}.close-preview{top:-45px;right:0;}}
        `}</style>
      </div>,
      document.body
    );
  };

  return (
    <div className="template-selector">
      <div className="selector-header">
        <div className="header-left">
          <h3 className="selector-title">
            Template: <span className="selected-template">{getSelectedTemplateName()}</span>
          </h3>
        </div>
        
        <div className="header-right">
          {outputType && onOutputTypeChange && (
            <div className="dropdown-wrapper">
              <div className="inline-output-selector template-selector-output">
                  <select 
                    id="output-type-image"
                    value={outputType}
                    onChange={onOutputTypeChange}
                    className="output-type-dropdown inline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <span className="dropdown-chevron">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 8L10 12L14 8" stroke="#7B8A97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
              </div>
            </div>
          )}
          <div className="navigation-controls">
            <button 
              className="nav-button prev" 
              onClick={() => setStartIndex(Math.max(0, startIndex - 1))}
              disabled={startIndex === 0 || isLoadingSets || templateSets.length <= 4}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button 
              className="nav-button next" 
              onClick={() => setStartIndex(Math.min(templateSets.length - 4, startIndex + 1))}
              disabled={startIndex >= templateSets.length - 4 || isLoadingSets || templateSets.length <= 4}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="templates-grid">
        {isLoadingSets && (
          <div className="loading-state">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            Loading Template Sets...
          </div>
        )}
        {errorLoadingSets && (
          <div className="error-state">Error: {errorLoadingSets}</div>
        )}
        {!isLoadingSets && !errorLoadingSets && templateSets.length === 0 && (
          <div className="empty-state">No template sets found in your Bannerbear account.</div>
        )}
        {!isLoadingSets && !errorLoadingSets && displayTemplateSets.slice(startIndex, startIndex + 4).map((template) => (
          <div 
            key={template.id} 
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelect(template.id)} 
          >
            {template.isUserOwned && (
              <div className="user-set-star-container">
                <AiFillStar style={{ color: '#FFD700', fontSize: '1.2rem' }} />
              </div>
            )}
            
            <div className="template-header">
              <h4 className="template-name">{template.display_name}</h4>
              {selectedTemplate === template.id && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
            <p className="template-description">{template.description}</p>
            
            <div className="template-previews-container"> 
               <div className="template-previews">
                  {template.previews?.length > 0 ? (
                    [...template.previews]
                      .sort((a, b) => {
                        // Helper function to categorize preview type
                        const getTemplateType = (preview) => {
                          // Pre-defined types:
                          // 0 = Feed/Post (square, highest priority)
                          // 1 = Design (medium priority)
                          // 2 = Story (lowest priority)
                          
                          const name = (preview.name || '').toLowerCase();
                          const uid = (preview.uid || '').toLowerCase();
                          
                          // Check for story indicators
                          if (name.includes('story') || 
                              name.includes('vertical') || 
                              name.includes('portrait') || 
                              uid.includes('story') || 
                              /_story\d+$/i.test(name)) {
                            return 2; // Story
                          }
                          
                          // Check for feed/post indicators
                          if (name.includes('feed') || 
                              name.includes('post') || 
                              name.includes('square') ||
                              uid.includes('feed') || 
                              uid.includes('post') ||
                              /_design\d+$/i.test(name) ||
                              /_feed\d+$/i.test(name) ||
                              /_post\d+$/i.test(name)) {
                            return 0; // Feed/Post
                          }
                          
                          // Default to design
                          return 1; // Design
                        };
                        
                        // Helper function to extract the numeric order from the name
                        const getTemplateOrder = (preview) => {
                          const name = (preview.name || '').toLowerCase();
                          const uid = (preview.uid || '').toLowerCase();
                          
                          // Try to extract number from design/story/feed pattern like _design1, _story2, etc.
                          const nameMatch = name.match(/_(design|story|post|feed)(\d+)$/i);
                          if (nameMatch && nameMatch[2]) {
                            return parseInt(nameMatch[2], 10);
                          }
                          
                          // Try to extract any number at the end of name
                          const numberMatch = name.match(/(\d+)$/);
                          if (numberMatch && numberMatch[1]) {
                            return parseInt(numberMatch[1], 10);
                          }
                          
                          // Try uid as fallback
                          const uidMatch = uid.match(/(\d+)$/);
                          if (uidMatch && uidMatch[1]) {
                            return parseInt(uidMatch[1], 10);
                          }
                          
                          // Fallback for items without numeric indicators
                          return 999; // Put unnumbered items last within their category
                        };
                        
                        const aType = getTemplateType(a);
                        const bType = getTemplateType(b);
                        
                        // Primary sort by type (feed/post first, story last)
                        if (aType !== bType) {
                          return aType - bType;
                        }
                        
                        // Secondary sort by numeric order within the same type
                        return getTemplateOrder(a) - getTemplateOrder(b);
                      })
                      .map((preview, index) => (
                      <div key={preview.uid || index} className="preview-item">
                        <div 
                          className="preview-thumbnail"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(preview.url);
                            setCurrentImageIndex(index);
                            setCurrentTemplateId(template.id);
                          }}
                        >
                          <img 
                            src={preview.url} 
                            alt={`${template.name} - ${preview.name}`}
                          />
                           <div className="zoom-indicator">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-designs-message">
                      No design previews available.
                    </div>
                  )}
                </div>
            </div>
          </div>
        ))}
      </div>

      <PreviewModal />

      <style jsx>{`
        .template-selector {
          margin-bottom: 1.5rem;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem; /* Space between dropdown and nav buttons */
        }
        
        .selector-title {
          font-size: 1rem;
          margin: 0;
          color: #333;
          font-weight: 600;
        }
        
        .selected-template {
          color: #62d76b;
          font-weight: 700;
        }
        
        .templates-grid {
          display: flex;
          align-items: stretch;
          gap: 1rem;
          padding: 1rem;
          position: relative;
          min-height: 150px;
        }
        
        .loading-state, .error-state, .empty-state {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }
        
        .loading-state {
          color: #62d76b;
        }
        
        .error-state {
          color: #e53e3e;
          background-color: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 6px;
          opacity: 1;
        }
        
        .template-card {
          flex: 1;
          min-width: 220px;
          max-width: 280px;
          padding: 1rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        
        .template-card:hover {
          border-color: #62d76b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .template-card.selected {
          border-color: #62d76b;
          background: rgba(98, 215, 107, 0.05);
        }
        
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-shrink: 0;
        }
        
        .template-name {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .selected-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #62d76b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.7rem;
        }
        
        .template-description {
          margin: 0;
          font-size: 0.8rem;
          color: #666;
          line-height: 1.4;
          margin-bottom: 0.8rem;
          flex-shrink: 0;
        }
        
        .template-previews-container { 
          margin-top: auto;
          padding-top: 0.8rem;
          border-top: 1px dashed #eaeaea;
        }
        .template-previews {
          display: flex;
          overflow-x: auto;
          gap: 0.75rem;
          padding: 0.5rem 0.25rem;
          scrollbar-width: thin;
          scrollbar-color: #62d76b #eaeaea;
        }
        .template-previews::-webkit-scrollbar {
          height: 6px;
        }
        .template-previews::-webkit-scrollbar-track {
          background: #eaeaea;
          border-radius: 10px;
        }
        .template-previews::-webkit-scrollbar-thumb {
          background-color: #62d76b;
          border-radius: 10px;
        }
        .preview-item {
          flex-shrink: 0;
        }
        .preview-thumbnail {
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid #eaeaea;
          width: 120px;
          height: 80px;
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          background-color: #f9f9f9;
          cursor: pointer;
        }
        .preview-thumbnail:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          border-color: #62d76b;
        }
        .preview-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .no-designs-message {
          text-align: center;
          font-size: 0.8rem;
          color: #666;
          padding: 1rem;
          width: 100%;
        }
        .zoom-indicator {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          opacity: 0;
          transition: opacity 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .preview-thumbnail:hover .zoom-indicator {
          opacity: 1;
        }

        .navigation-controls {
          display: flex;
          gap: 0.5rem;
        }
        .nav-button {
          background: white;
          border: 1px solid #eaeaea;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
        }
        .nav-button:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #d1d1d1;
          color: #333;
        }
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f9f9f9;
        }

        .loading-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-bottom: 0.75rem;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          background-color: #62d76b;
          border-radius: 50%;
          animation: pulse 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1.0);
          }
        }

        .user-set-star-container {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
        }
        
        .dropdown-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .inline-output-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .inline-output-selector label {
          font-weight: 500;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .output-type-dropdown.inline {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding: 0.5rem 2.2rem 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          font-size: 1rem;
          color: #222;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(60,60,60,0.03);
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
          min-width: 110px;
        }

        .output-type-dropdown.inline:focus {
          outline: none;
          border-color: #62d76b;
          box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.18);
        }
        
        .template-selector-output {
          /* Add specific adjustments if needed */
        }
        
        .dropdown-chevron {
          pointer-events: none;
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
        }
        .output-type-dropdown.inline::-ms-expand {
          display: none;
        }
        .output-type-dropdown.inline option {
          background: #fff;
          color: #222;
        }
        
        @media (max-width: 768px) {
          /* Keep mobile adjustments if needed */
        }
      `}</style>
    </div>
  );
} 