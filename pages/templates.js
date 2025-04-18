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

  const observer = useRef();

  const fetchTemplates = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/templates?page=${page}&limit=${PAGE_LIMIT}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (page === 1) {
          setTemplates(data.templates);
      } else {
          setTemplates(prevTemplates => [...prevTemplates, ...data.templates]);
      }
      
      setHasMore(data.hasMore);
      setCurrentPage(page);

    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(err.message);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    setInitialLoading(true);
    setTemplates([]);
    setSelectedTemplates(new Map());
    setAllowedSetNumber(null);
    setCurrentPage(1);
    setHasMore(true);
    fetchTemplates(1);
  }, [fetchTemplates]);

  const lastTemplateElementRef = useCallback(node => {
    if (loading || initialLoading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchTemplates(currentPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, currentPage, fetchTemplates, initialLoading]);

  const handleSelectTemplate = (template) => {
    const currentSetNumber = getTemplateSetNumber(template.name);
    
    if (currentSetNumber === null && !selectedTemplates.has(template.uid)) {
        toast.error("This template doesn't seem to belong to a standard set.");
        return;
    }

    if (!allowedSetNumber || currentSetNumber === allowedSetNumber) {
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
            setAllowedSetNumber(currentSetNumber);
          }
        }
        return newSelected;
      });
    } else {
      toast.error(`Please select templates only from Set ${allowedSetNumber}.`);
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
    pageContent = <div>Loading initial templates...</div>;
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
              const templateSetNumber = getTemplateSetNumber(template.name);
              const isDisabled = allowedSetNumber !== null && templateSetNumber !== allowedSetNumber;
              return (
                <div
                  ref={isLastElement ? lastTemplateElementRef : null}
                  key={`${template.uid}-${index}`}
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
                      {template.preview_url ? (
                        <img
                          src={template.preview_url}
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
                <div>Loading initial templates...</div>
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
                        const templateSetNumber = getTemplateSetNumber(template.name);
                        const isDisabled = allowedSetNumber !== null && templateSetNumber !== allowedSetNumber;
                        return (
                          <div
                            ref={isLastElement ? lastTemplateElementRef : null}
                            key={`${template.uid}-${index}`}
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
                                {template.preview_url ? (
                                  <img
                                    src={template.preview_url}
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
        `}</style>
      </div>
    </ProtectedRoute>
  );
}

export default TemplateGalleryPage; 