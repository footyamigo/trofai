import React, { useState, useEffect, useRef, useCallback } from 'react';
// import Layout from '../components/Layout/Layout'; // REMOVED Layout Import
import Sidebar from '../components/Layout/Sidebar'; // ADDED Sidebar import
import MobileMenu from '../components/Layout/MobileMenu'; // ADDED MobileMenu import
import Head from 'next/head'; // ADDED Head import
import ProtectedRoute from '../src/components/ProtectedRoute'; // ADDED ProtectedRoute import
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { FiPlayCircle } from 'react-icons/fi';

const PAGE_LIMIT = 25;

// Loading spinner component to avoid duplication
const LoadingView = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '3rem 1rem'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #62d76b',
      animation: 'spinAnimation 1s ease infinite'
    }}></div>
    <p style={{ color: '#555', fontWeight: '500', marginTop: '1rem' }}>Loading templates...</p>
  </div>
);

const TEMPLATE_NUMBER_REGEX = /^Template(\d+)_/i;

function getTemplateSetNumber(name) {
  if (!name) return null;
  const match = name.match(TEMPLATE_NUMBER_REGEX);
  return match ? match[1] : null;
}

function TemplateGalleryPage() {
  const [templates, setTemplates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState(() => new Map()); 
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [allowedSetNumber, setAllowedSetNumber] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'listing' | 'quote' | 'testimonial'

  const observer = useRef();

  // Helper to flatten sets into templates
  const flattenSetsToTemplates = (sets) => {
    return sets.flatMap(set =>
      (set.templates || set.templates || set.previews || set.previews) // fallback for different API shapes
        ? (set.templates || set.previews).map(t => ({
            ...t,
            setName: set.display_name || set.name || '',
            setId: set.id || '',
          }))
        : []
    );
  };

  // Sort function to ensure Story templates appear at the end of each SET
  const sortTemplates = (templates) => {
    // First group templates by setId
    const templatesBySet = templates.reduce((groups, template) => {
      const setId = template.setId || '';
      if (!groups[setId]) {
        groups[setId] = [];
      }
      groups[setId].push(template);
      return groups;
    }, {});
    
    // Sort each set internally (designs first, Story last)
    Object.keys(templatesBySet).forEach(setId => {
      templatesBySet[setId].sort((a, b) => {
        const aName = a.name || '';
        const bName = b.name || '';
        
        const aIsStory = aName.includes('Story') || aName.includes('story');
        const bIsStory = bName.includes('Story') || bName.includes('story');
        
        // Story templates at the end within each set
        if (aIsStory && !bIsStory) return 1;
        if (!aIsStory && bIsStory) return -1;
        
        // If both are of the same type, sort alphanumerically
        return aName.localeCompare(bName);
      });
    });
    
    // Flatten the grouped templates back into a single array
    return Object.values(templatesBySet).flat();
  };

  // Fetch templates based on filterType
  const fetchTemplatesByType = useCallback(async (type) => {
    setLoading(true);
    setError(null);
    let endpoints = [];
    if (type === 'all') {
      endpoints = [
        '/api/list-listing-templates',
        '/api/list-quote-templates',
        '/api/list-testimonial-templates',
      ];
    } else if (type === 'listing') {
      endpoints = ['/api/list-listing-templates'];
    } else if (type === 'quote') {
      endpoints = ['/api/list-quote-templates'];
    } else if (type === 'testimonial') {
      endpoints = ['/api/list-testimonial-templates'];
    }
    try {
      const results = await Promise.all(
        endpoints.map(endpoint => fetch(endpoint).then(res => res.json()))
      );
      // Each result is { success, sets: [...] }
      const allSets = results.flatMap(r => (r && r.success && Array.isArray(r.sets)) ? r.sets : []);
      // Flatten sets to previews (not templates)
      const allTemplates = allSets.flatMap(set =>
        (set.previews || []).map(preview => ({
          ...preview,
          setName: set.display_name || set.name || '',
          setId: set.id || '',
        }))
      );
      // Sort templates to ensure Story templates appear at the end
      const sortedTemplates = sortTemplates(allTemplates);
      setTemplates(sortedTemplates);
      setHasMore(false); // No infinite scroll for filtered sets
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to load templates.');
      setTemplates([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  // Fetch on mount and when filter changes
  useEffect(() => {
    setInitialLoading(true);
    setTemplates([]);
    setSelectedTemplates(new Map());
    setAllowedSetNumber(null);
    setCurrentPage(1);
    setHasMore(false);
    fetchTemplatesByType(filterType);
  }, [fetchTemplatesByType, filterType]);

  const handleSelectTemplate = (template) => {
    // Set ID could be in template data now since we store setId in each template
    const setId = template.setId;
    
    if (!allowedSetNumber || template.setId === allowedSetNumber) {
      setSelectedTemplates(prevSelected => {
        const newSelected = new Map(prevSelected);
        
        if (newSelected.has(template.uid)) {
          newSelected.delete(template.uid);
          if (newSelected.size === 0) {
            setAllowedSetNumber(null);
          }
        } else {
          newSelected.set(template.uid, template.name);
          if (prevSelected.size === 0) {
            setAllowedSetNumber(setId);
          }
        }
        return newSelected;
      });
    } else {
      toast.error(`Please select templates only from set "${allowedSetNumber}"`);
    }
  };

  const handleDuplicateSelected = async () => {
    if (selectedTemplates.size === 0) {
      toast.error('Please select at least one template to duplicate.');
      return;
    }

    let sessionToken;
    if (typeof window !== 'undefined') { 
      sessionToken = localStorage.getItem('session');
    } else {
      console.error('Cannot access localStorage outside browser');
      toast.error('Authentication error - Cannot verify session.');
      return;
    }

    if (!sessionToken) {
        toast.error("Authentication error - Please sign in again.");
        return;
    }

    setIsDuplicating(true);
    const templatesToDuplicate = Array.from(selectedTemplates.entries()).map(([uid, name]) => ({ uid, name }));
    const toastId = toast.loading(`Duplicating & renaming ${templatesToDuplicate.length} template(s)...`);

    try {
      const response = await fetch('/api/templates/duplicate-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ templatesToDuplicate: templatesToDuplicate }), 
      });

      const result = await response.json();

      if (response.status === 401) {
          throw new Error(result.message || 'Unauthorized - Invalid session');
      }
      if (!response.ok) {
        throw new Error(result.message || 'Duplication/rename request failed');
      }
      
      const successCount = result.results?.filter(r => r.success).length || 0;
      const failureCount = templatesToDuplicate.length - successCount;
      
      if (failureCount > 0) {
        toast.error(`Processed ${templatesToDuplicate.length}: ${successCount} succeeded, ${failureCount} failed. Check console.`, { id: toastId });
         console.error("Duplication/Rename failures:", result.results?.filter(r => !r.success));
      } else {
         toast.success(`Successfully duplicated & renamed ${successCount} template(s)!`, { id: toastId });
      }

      setSelectedTemplates(new Map());
      setAllowedSetNumber(null);

    } catch (err) {
      console.error("Error duplicating/renaming templates:", err);
      toast.error(`Operation failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDuplicating(false);
    }
  };

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  let pageContent;
  if (initialLoading) {
    pageContent = <LoadingView />;
  } else if (error && templates.length === 0) {
    pageContent = <div>Error loading templates: {error}</div>;
  } else if (templates.length === 0 && !hasMore) {
    pageContent = <div>No templates found.</div>;
  } else {
    pageContent = (
      <>
        <div className="dashboard-header"> {/* Changed from inline style */} 
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              <h1 className="title"> {/* Added className */} 
                Template Gallery
              </h1>
              <FiPlayCircle 
                onClick={openVideoModal}
                style={{ 
                  fontSize: '1.5rem',
                  color: '#62d76b',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#56c15f'}
                onMouseOut={(e) => e.currentTarget.style.color = '#62d76b'}
                title="Watch How-To Video"
              />
          </div>
          <div style={{ margin: '1.5rem 0 0.5rem 0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {['all', 'listing', 'quote', 'testimonial'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '20px',
                  border: filterType === type ? '2px solid #62d76b' : '1px solid #ccc',
                  background: filterType === type ? '#e6fbe9' : '#fff',
                  color: filterType === type ? '#1a7f37' : '#333',
                  fontWeight: filterType === type ? 700 : 400,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxShadow: filterType === type ? '0 2px 8px rgba(98,215,107,0.08)' : 'none',
                }}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + ' Templates'}
              </button>
            ))}
          </div>
          <p className="subtitle"> {/* Added className */} 
            Select templates from the same set to duplicate them.
          </p>
        </div>
        
        {selectedTemplates.size > 0 && (
          <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto 1.5rem auto', // Center and add bottom margin
              textAlign: 'right' 
            }}>
            <Button
              onClick={handleDuplicateSelected}
              disabled={isDuplicating}
              isLoading={isDuplicating}
            >
              Duplicate Selected ({selectedTemplates.size})
            </Button>
          </div>
        )}
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}>
            {templates.map((template, index) => {
              const isLastElement = templates.length === index + 1;
              const isSelected = selectedTemplates.has(template.uid);
              // Determine if this template should be disabled based on setId
              const isDisabled = allowedSetNumber !== null && template.setId !== allowedSetNumber;
              return (
                <div
                  ref={isLastElement ? observer.current : null}
                  key={`${template.uid || template.name || index}`}
                  style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    border: isSelected ? '2px solid #62d76b' : '2px solid #ccc',
                    boxShadow: isSelected ? '0 0 0 2px rgba(98, 215, 107, 0.2)' : 'none',
                    borderRadius: '8px',
                    padding: '1rem', 
                    textAlign: 'center', 
                    position: 'relative',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1, 
                    transition: 'all 0.2s ease'
                  }}
                  onClick={isDisabled ? undefined : () => handleSelectTemplate(template)}
                >
                  <div style={{ position: 'relative', flexGrow: 1 }}> 
                    {isSelected && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          background: '#62d76b',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          zIndex: 2
                        }}
                      >
                        ✓
                      </div>
                    )}
                    <div style={{ 
                      aspectRatio: '1 / 1', 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden', 
                      marginBottom: '0.75rem'
                    }}>
                      {template.url ? (
                        <img
                          src={template.url}
                          alt={`Preview of ${template.name}`}
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ height: '100%', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No Preview
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '300', flexShrink: 0 }}> 
                    {template.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div> 
        {loading && !initialLoading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading more templates...</div>}
        {error && !initialLoading && <div style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>Error loading more: {error}</div>}
      </>
    );
  }

  // Replaced Layout component with structure from caption.js
  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>Template Gallery - Trofai</title>
          <meta name="description" content="Browse and duplicate design templates."/>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <MobileMenu activePage="templates" />
        <Sidebar activePage="templates" />
        <div className="dashboard-container">
          <DashboardHeader /> {/* REMOVED Props */} 
          <main className="main">
            <div className="content">
              {/* Moved pageContent rendering inside content div */} 
              {initialLoading ? (
                <LoadingView />
              ) : error && templates.length === 0 ? (
                <div>Error loading templates: {error}</div>
              ) : templates.length === 0 && !hasMore ? (
                <div>No templates found.</div>
              ) : (
                <>
                  {/* Title and Subtitle block */} 
                  <div className="dashboard-header"> 
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <h1 className="title">
                        Template Gallery
                      </h1>
                      <FiPlayCircle 
                        onClick={openVideoModal}
                        style={{ 
                          fontSize: '1.5rem',
                          color: '#62d76b',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#56c15f'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#62d76b'}
                        title="Watch How-To Video"
                      />
                    </div>
                    <div style={{ margin: '1.5rem 0 0.5rem 0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                      {['all', 'listing', 'quote', 'testimonial'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            border: filterType === type ? '2px solid #62d76b' : '1px solid #ccc',
                            background: filterType === type ? '#e6fbe9' : '#fff',
                            color: filterType === type ? '#1a7f37' : '#333',
                            fontWeight: filterType === type ? 700 : 400,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none',
                            boxShadow: filterType === type ? '0 2px 8px rgba(98,215,107,0.08)' : 'none',
                          }}
                        >
                          {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + ' Templates'}
                        </button>
                      ))}
                    </div>
                    <p className="subtitle">
                      Select templates from the same set to duplicate them.
                    </p>
                  </div>
                  
                  {/* Button and Grid */} 
                  {selectedTemplates.size > 0 && (
                    <div style={{ 
                        maxWidth: '1200px', 
                        margin: '0 auto 1.5rem auto',
                        textAlign: 'right' 
                      }}>
                      <Button
                        onClick={handleDuplicateSelected}
                        disabled={isDuplicating}
                        isLoading={isDuplicating}
                      >
                        Duplicate Selected ({selectedTemplates.size})
                      </Button>
                    </div>
                  )}
                  
                  <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: '1.5rem',
                      alignItems: 'stretch'
                    }}>
                      {templates.map((template, index) => {
                        const isLastElement = templates.length === index + 1;
                        const isSelected = selectedTemplates.has(template.uid);
                        // Use the same isDisabled logic as above, based on setId
                        const isDisabled = allowedSetNumber !== null && template.setId !== allowedSetNumber;
                        return (
                          <div
                            ref={isLastElement ? observer.current : null}
                            key={`${template.uid || template.name || index}`}
                            style={{
                              display: 'flex', 
                              flexDirection: 'column', 
                              border: isSelected ? '2px solid #62d76b' : '2px solid #ccc',
                              boxShadow: isSelected ? '0 0 0 2px rgba(98, 215, 107, 0.2)' : 'none',
                              borderRadius: '8px',
                              padding: '1rem', 
                              textAlign: 'center', 
                              position: 'relative',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.5 : 1, 
                              transition: 'all 0.2s ease'
                            }}
                            onClick={isDisabled ? undefined : () => handleSelectTemplate(template)}
                          >
                            <div style={{ position: 'relative', flexGrow: 1 }}> 
                              {isSelected && (
                                <div 
                                  style={{ 
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    width: '24px',
                                    height: '24px',
                                    background: '#62d76b',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    zIndex: 2
                                  }}
                                >
                                  ✓
                                </div>
                              )}
                              <div style={{ 
                                aspectRatio: '1 / 1', 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                overflow: 'hidden', 
                                marginBottom: '0.75rem'
                              }}>
                                {template.url ? (
                                  <img
                                    src={template.url}
                                    alt={`Preview of ${template.name}`}
                                    style={{ 
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'contain',
                                      display: 'block'
                                    }}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div style={{ height: '100%', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    No Preview
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '300', flexShrink: 0 }}> 
                              {template.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div> 
                  {loading && !initialLoading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading more templates...</div>}
                  {error && !initialLoading && <div style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>Error loading more: {error}</div>}
                </>
              )}
            </div>
          </main>
        </div>
        <Modal 
          isOpen={isVideoModalOpen} 
          onClose={closeVideoModal} 
          title="How to Use the Template Gallery"
        >
          <div style={{ 
            padding: 0,
            margin: '-1.5rem',
            overflow: 'hidden',
            borderRadius: '0 0 12px 12px'
          }}>
            <div style={{ 
              position: 'relative', 
              paddingBottom: '56.25%',
              height: 0, 
              overflow: 'hidden', 
              maxWidth: '100%', 
              background: '#000'
            }}>
              <iframe 
                src="https://player.vimeo.com/video/1068879779?autoplay=1&title=0&byline=0&portrait=0" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
                title="Template Gallery Tutorial"
              ></iframe>
            </div>
          </div>
        </Modal>
        {/* Added Styles mimicking Layout.js and caption.js */} 
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          }
          .dashboard-container {
            margin-left: 240px; /* Same as Layout */
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main {
            flex: 1;
            padding: 2rem;
          }
          .content {
            /* Removed max-width and margin: auto from here */
          }
          .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-top: 1rem; /* Add padding if needed */
          }
          .title {
            margin: 0;
            line-height: 1.15;
            font-size: 3.5rem;
            font-weight: 900;
            color: #111;
          }
          .subtitle {
            line-height: 1.5;
            font-size: 1.2rem;
            margin: 1rem 0 0;
            color: #333;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .dashboard-container {
              margin-left: 0;
            }
            .main {
              padding: 1rem;
            }
            .title {
              font-size: 2.5rem;
            }
            .subtitle {
              font-size: 1rem;
            }
          }
          
          /* Global animation for spinner */
          @keyframes spinAnimation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}

export default TemplateGalleryPage; 