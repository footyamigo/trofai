import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  const [templateSets, setTemplateSets] = useState([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [errorLoadingSets, setErrorLoadingSets] = useState(null);
  
  const [startIndex, setStartIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  useEffect(() => {
    const fetchSets = async () => {
      setIsLoadingSets(true);
      setErrorLoadingSets(null);
      try {
        const response = await fetch('/api/bannerbear/template-sets');
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch template sets');
        }
        setTemplateSets(data.sets || []);
      } catch (error) {
        console.error("Error fetching template sets:", error);
        setErrorLoadingSets(error.message || 'Could not load template sets.');
        setTemplateSets([]);
      } finally {
        setIsLoadingSets(false);
      }
    };

    fetchSets();
  }, []);

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
    return selected ? selected.name : 'Select a Template Set';
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
        <h3 className="selector-title">
          Template: <span className="selected-template">{getSelectedTemplateName()}</span>
        </h3>
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
      
      <div className="templates-grid">
        {isLoadingSets && (
          <div className="loading-state">Loading Template Sets...</div>
        )}
        {errorLoadingSets && (
          <div className="error-state">Error: {errorLoadingSets}</div>
        )}
        {!isLoadingSets && !errorLoadingSets && templateSets.length === 0 && (
          <div className="empty-state">No template sets found in your Bannerbear account.</div>
        )}
        {!isLoadingSets && !errorLoadingSets && templateSets.slice(startIndex, startIndex + 4).map((template) => (
          <div 
            key={template.id} 
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelect(template.id)} 
          >
            <div className="template-header">
              <h4 className="template-name">{template.name}</h4>
              {selectedTemplate === template.id && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
            <p className="template-description">{template.description}</p>
            
            <div className="template-previews-container"> 
               <div className="template-previews">
                  {template.previews?.length > 0 ? (
                    template.previews.map((preview, index) => (
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
        }
        
        .loading-state, .error-state, .empty-state {
          width: 100%;
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }
        
        .error-state {
          color: #e53e3e;
          background-color: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 6px;
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

        @media (max-width: 768px) {
          /* Keep mobile adjustments if needed */
        }
      `}</style>
    </div>
  );
} 