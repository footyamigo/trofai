import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Template sets configuration with S3 folder paths
const TEMPLATE_SETS = [
  { 
    id: '5AaLxyr4P8xrP8bDRG', 
    name: 'Template Set 1', 
    description: 'Modern property designs with clean layouts',
    s3Folder: 'templateset1'
  },
  { 
    id: 'YpJ2mlgYDnozMXLjnb', 
    name: 'Template Set 2', 
    description: 'Luxury real estate templates with elegant styling',
    s3Folder: 'templateset2'
  },
  { 
    id: 'Rwonb0W3MAyzKOEeD7', 
    name: 'Template Set 3', 
    description: 'Minimalist designs focusing on property features',
    s3Folder: 'templateset3'
  },
  { 
    id: 'OD9lQEWnbnpWjkeb5L', 
    name: 'Template Set 4', 
    description: 'Bold and colorful templates for unique properties',
    s3Folder: 'templateset4'
  },
  { 
    id: '3ZBOQlgdPnVg9VJmp0', 
    name: 'Template Set 5', 
    description: 'Professional templates ideal for premium listings',
    s3Folder: 'templateset5'
  }
];

// Fallback preview images if S3 images fail to load
const FALLBACK_PREVIEWS = {
  '5AaLxyr4P8xrP8bDRG': [
    'https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Template+1+Design+1',
    'https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Template+1+Design+2',
    'https://via.placeholder.com/300x200/FF5722/FFFFFF?text=Template+1+Design+3',
  ],
  'YpJ2mlgYDnozMXLjnb': [
    'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Template+2+Design+1', 
    'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Template+2+Design+2',
    'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Template+2+Design+3',
  ],
  'Rwonb0W3MAyzKOEeD7': [
    'https://via.placeholder.com/300x200/3F51B5/FFFFFF?text=Template+3+Design+1',
    'https://via.placeholder.com/300x200/3F51B5/FFFFFF?text=Template+3+Design+2',
    'https://via.placeholder.com/300x200/3F51B5/FFFFFF?text=Template+3+Design+3',
  ],
  'OD9lQEWnbnpWjkeb5L': [
    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Template+4+Design+1',
    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Template+4+Design+2',
    'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Template+4+Design+3',
  ],
  '3ZBOQlgdPnVg9VJmp0': [
    'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Template+5+Design+1',
    'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Template+5+Design+2',
    'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Template+5+Design+3',
  ]
};

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [templatePreviews, setTemplatePreviews] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [startIndex, setStartIndex] = useState(0);
  
  // Add cache initialization for template previews
  useEffect(() => {
    // Try to load cached template previews from localStorage on initial render
    try {
      const cachedPreviews = localStorage.getItem('templatePreviews');
      if (cachedPreviews) {
        const parsed = JSON.parse(cachedPreviews);
        console.log('Loaded cached template previews from localStorage:', parsed);
        setTemplatePreviews(parsed);
      }
    } catch (error) {
      console.error('Error loading cached template previews:', error);
    }
  }, []);

  // Update the fetchS3Previews function to store results in localStorage
  const fetchS3Previews = useCallback(async (templateId) => {
    if (templatePreviews[templateId]?.length > 0) {
      console.log('Already have previews for', templateId, templatePreviews[templateId]);
      return;
    }
    
    // Mark this template as loading
    setIsLoading(prev => ({ ...prev, [templateId]: true }));
    
    try {
      // Find the template set data
      const templateSet = TEMPLATE_SETS.find(t => t.id === templateId);
      
      if (!templateSet) {
        throw new Error('Template set not found');
      }
      
      console.log(`Fetching previews for ${templateSet.name} from folder: ${templateSet.s3Folder}`);
      
      // Call the API to get template previews
      const apiUrl = `/api/s3-template-previews?folderName=${templateSet.s3Folder}`;
      console.log('Calling API:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch S3 template previews: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.templates && data.templates.length > 0) {
        // Format previews from API response
        const previews = data.templates.map(template => ({
          url: template.url,
          name: template.name,
          filename: template.filename
        }));
        
        console.log('Formatted previews:', previews);
        
        // Update state with the previews
        setTemplatePreviews(prev => {
          const newState = {
            ...prev,
            [templateId]: previews
          };
          
          // Save the updated template previews to localStorage
          try {
            localStorage.setItem('templatePreviews', JSON.stringify(newState));
            console.log('Cached template previews to localStorage');
          } catch (error) {
            console.error('Error caching template previews:', error);
          }
          
          console.log('New template previews state:', newState);
          return newState;
        });
      } else {
        console.log('No templates found in API response');
        throw new Error('No templates found');
      }
      
    } catch (error) {
      console.error('Error fetching S3 preview images:', error);
      
      // Use fallbacks on error
      setTemplatePreviews(prev => {
        const fallbacks = FALLBACK_PREVIEWS[templateId]?.map((url, index) => ({
          url,
          name: `Design ${index + 1}`,
          filename: `fallback_${index + 1}.png`
        })) || [];
        
        const newState = {
          ...prev,
          [templateId]: fallbacks
        };
        
        // Also cache fallbacks in localStorage
        try {
          localStorage.setItem('templatePreviews', JSON.stringify(newState));
        } catch (error) {
          console.error('Error caching fallback previews:', error);
        }
        
        console.log('Using fallback previews:', fallbacks);
        return newState;
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [templateId]: false }));
    }
  }, [templatePreviews]);

  // Update keyboard navigation to work with dynamically loaded images
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage || !currentTemplateId) return;
      
      const currentPreviews = templatePreviews[currentTemplateId] || [];
      if (currentPreviews.length === 0) return;
      
      // Handle left and right arrow keys
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
    
    // Add event listener when the modal is open
    if (previewImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImage, currentImageIndex, currentTemplateId, templatePreviews]);
  
  // Update useEffect dependencies
  useEffect(() => {
    if (isExpanded) {
      // Load previews for all template sets when expanded
      TEMPLATE_SETS.forEach(template => {
        if (!templatePreviews[template.id] || templatePreviews[template.id].length === 0) {
          fetchS3Previews(template.id);
        }
      });
    }
  }, [isExpanded, templatePreviews, fetchS3Previews]);
  
  const getSelectedTemplateName = () => {
    const selected = TEMPLATE_SETS.find(t => t.id === selectedTemplate);
    return selected ? selected.name : 'Template Set 1';
  };

  const PreviewModal = () => {
    if (!previewImage) return null;
    
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
          
          {templatePreviews[currentTemplateId]?.length > 1 && (
            <>
              <button 
                className="nav-button prev" 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentPreviews = templatePreviews[currentTemplateId] || [];
                  const prevIndex = (currentImageIndex - 1 + currentPreviews.length) % currentPreviews.length;
                  setCurrentImageIndex(prevIndex);
                  setPreviewImage(currentPreviews[prevIndex].url);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <button 
                className="nav-button next" 
                onClick={(e) => {
                  e.stopPropagation();
                  const currentPreviews = templatePreviews[currentTemplateId] || [];
                  const nextIndex = (currentImageIndex + 1) % currentPreviews.length;
                  setCurrentImageIndex(nextIndex);
                  setPreviewImage(currentPreviews[nextIndex].url);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
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
          .preview-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
          }
          
          .preview-modal {
            position: relative;
            padding: 20px;
            max-width: 80vw;
            max-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .preview-modal-image {
            max-width: 100%;
            max-height: calc(80vh - 40px);
            object-fit: contain;
            border-radius: 8px;
          }
          
          .close-preview {
            position: absolute;
            top: -40px;
            right: -40px;
            width: 32px;
            height: 32px;
            background: white;
            border: none;
            border-radius: 50%;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000000;
            transition: all 0.2s ease;
          }
          
          .close-preview:hover {
            background: #f5f5f5;
            transform: scale(1.1);
          }
          
          .preview-modal .nav-button {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          
          .preview-modal .nav-button:hover {
            background: #f5f5f5;
            transform: translateY(-50%) scale(1.1);
          }
          
          .preview-modal .nav-button.prev {
            left: -50px;
          }
          
          .preview-modal .nav-button.next {
            right: -50px;
          }

          @media (max-width: 768px) {
            .preview-modal {
              max-width: 95vw;
              padding: 15px;
            }
            
            .preview-modal .nav-button.prev {
              left: 10px;
            }
            
            .preview-modal .nav-button.next {
              right: 10px;
            }

            .close-preview {
              top: -45px;
              right: 0;
            }
          }
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
            disabled={startIndex === 0}
          >
            ←
          </button>
          <button 
            className="nav-button next" 
            onClick={() => setStartIndex(Math.min(TEMPLATE_SETS.length - 4, startIndex + 1))}
            disabled={startIndex >= TEMPLATE_SETS.length - 4}
          >
            →
          </button>
        </div>
      </div>
      
      <div className="templates-grid">
        {TEMPLATE_SETS.slice(startIndex, startIndex + 4).map((template) => (
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
              {isLoading[template.id] ? (
                <div className="preview-loading">Loading designs...</div>
              ) : (
                <div className="template-previews">
                  {templatePreviews[template.id]?.length > 0 ? (
                    templatePreviews[template.id].map((preview, index) => (
                      <div key={index} className="preview-item">
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
                            alt={`${template.name} ${preview.name}`} 
                            style={{ maxWidth: '100%', height: 'auto', border: '1px solid #eee' }}
                          />
                          <div className="zoom-indicator">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              <line x1="11" y1="8" x2="11" y2="14"></line>
                              <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-designs-message">
                      No designs available yet for this template set.
                    </div>
                  )}
                </div>
              )}
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
        
        .template-card {
          flex: 1;
          min-width: 0;
          padding: 1rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .template-card:hover {
          border-color: #62d76b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .template-card.selected {
          border-color: #62d76b;
          background: rgba(98, 215, 107, 0.1);
        }
        
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
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
        }
        
        .template-previews-container {
          margin-top: 0.8rem;
          padding-top: 0.8rem;
          border-top: 1px dashed #eaeaea;
        }
        
        .template-previews {
          display: flex;
          overflow-x: auto;
          gap: 1rem;
          padding: 0.5rem 0;
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
          min-width: 120px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .preview-thumbnail {
          border-radius: 4px;
          overflow: visible;
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
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .preview-name {
          display: none;
        }
        
        .preview-loading {
          text-align: center;
          font-size: 0.8rem;
          color: #666;
          padding: 1rem;
          width: 100%;
        }
        
        .template-card.selected .preview-button {
          background-color: #e8f7e9;
          color: #2e7d32;
          border-color: #2e7d32;
        }
        
        .no-designs-message {
          text-align: center;
          font-size: 0.8rem;
          color: #666;
          padding: 1rem;
          width: 100%;
        }
        
        .subdued {
          color: #999;
          font-size: 0.7rem;
        }
        
        .zoom-indicator {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 26px;
          height: 26px;
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
          position: static;
          transform: none;
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
        }
        
        .nav-button:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #d1d1d1;
        }
        
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .templates-grid {
            grid-template-columns: 1fr;
          }
          
          .template-previews {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
} 