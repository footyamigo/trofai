import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout/Layout'; // Import the Layout component
import DashboardHeader from '../components/Dashboard/DashboardHeader'; // Import the DashboardHeader
import { toast } from 'react-hot-toast'; // Assuming you use react-hot-toast for notifications
import Button from '../components/UI/Button'; // --> ADDED: Import Button <--
import Modal from '../components/UI/Modal'; // --> START CHANGE: Import Modal <--
import { FiPlayCircle } from 'react-icons/fi'; // --> START CHANGE: Import Play Icon <--

const PAGE_LIMIT = 25; // Number of templates to load per page

// Regex to extract the leading number from template names like Template50_design1
const TEMPLATE_NUMBER_REGEX = /^Template(\d+)_/i;

function getTemplateSetNumber(name) {
  if (!name) return null;
  const match = name.match(TEMPLATE_NUMBER_REGEX);
  return match ? match[1] : null; // Return the captured number string, or null
}

function TemplateGalleryPage() { // Renamed component slightly for clarity as it's a page
  const [templates, setTemplates] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false); // Only true when loading *more* pages
  const [initialLoading, setInitialLoading] = useState(true); // True for the very first load
  const [error, setError] = useState(null);
  // *** Use a Map to store selected UID -> Name mapping ***
  const [selectedTemplates, setSelectedTemplates] = useState(() => new Map()); 
  const [isDuplicating, setIsDuplicating] = useState(false); // State for duplication loading
  const [allowedSetNumber, setAllowedSetNumber] = useState(null); // Track the selected set number
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false); // --> START CHANGE: Add Modal State <--

  const observer = useRef();

  // Function to fetch templates, now takes page number
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
      
      // *** FIX: Replace state if page is 1, otherwise append ***
      if (page === 1) {
          setTemplates(data.templates);
      } else {
          setTemplates(prevTemplates => [...prevTemplates, ...data.templates]);
      }
      // *** END FIX ***
      
      setHasMore(data.hasMore);
      setCurrentPage(page);

    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(err.message);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
      setInitialLoading(false); // Mark initial load as complete
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    setInitialLoading(true);
    setTemplates([]); // Clear existing templates on initial load
    setSelectedTemplates(new Map()); // Reset selection on initial load
    setAllowedSetNumber(null); // Reset allowed set on initial load
    setCurrentPage(1);
    setHasMore(true);
    fetchTemplates(1); // Fetch the first page
  }, [fetchTemplates]);

  // IntersectionObserver callback
  const lastTemplateElementRef = useCallback(node => {
    if (loading || initialLoading) return; // Don't trigger if already loading
    if (observer.current) observer.current.disconnect(); // Disconnect previous observer

    observer.current = new IntersectionObserver(entries => {
      // If the last element is visible and there are more templates to load
      if (entries[0].isIntersecting && hasMore) {
        fetchTemplates(currentPage + 1);
      }
    });

    if (node) observer.current.observe(node); // Observe the new last element
  }, [loading, hasMore, currentPage, fetchTemplates, initialLoading]);

  // --- Selection Logic (Enforce Same Set) ---
  const handleSelectTemplate = (template) => {
    const currentSetNumber = getTemplateSetNumber(template.name);
    
    // If trying to select a template that doesn't match the naming convention
    if (currentSetNumber === null && !selectedTemplates.has(template.uid)) {
        toast.error("This template doesn't seem to belong to a standard set.");
        return;
    }

    // If nothing is selected yet, or the clicked template is part of the allowed set
    if (!allowedSetNumber || currentSetNumber === allowedSetNumber) {
      setSelectedTemplates(prevSelected => {
        const newSelected = new Map(prevSelected);
        
        if (newSelected.has(template.uid)) {
          // Deselecting
          newSelected.delete(template.uid);
          // If it was the last one, reset allowed set number
          if (newSelected.size === 0) {
            setAllowedSetNumber(null);
          }
        } else {
          // Selecting
          newSelected.set(template.uid, template.name);
          // If this is the first selection, set the allowed number
          if (prevSelected.size === 0) {
            setAllowedSetNumber(currentSetNumber);
          }
        }
        return newSelected;
      });
    } else {
      // Trying to select from a different set
      toast.error(`Please select templates only from Set ${allowedSetNumber}.`);
    }
  };

  // --- Duplication Logic (Get data from Map) ---
  const handleDuplicateSelected = async () => {
    if (selectedTemplates.size === 0) {
      toast.error('Please select at least one template to duplicate.');
      return;
    }

    let sessionToken;
    // Check if running in browser before accessing localStorage
    if (typeof window !== 'undefined') { 
      sessionToken = localStorage.getItem('session');
    } else {
      // Handle case where code might run server-side initially (though unlikely for button click)
      console.error('Cannot access localStorage outside browser');
      toast.error('Authentication error - Cannot verify session.');
      return;
    }

    if (!sessionToken) {
        toast.error("Authentication error - Please sign in again.");
        return;
    }

    setIsDuplicating(true);
    // *** Create array directly from the selection Map ***
    const templatesToDuplicate = Array.from(selectedTemplates.entries()).map(([uid, name]) => ({ uid, name }));
    // *** Remove the check that caused the error ***
    // if (templatesToDuplicate.length !== selectedTemplates.size) { ... }

    const toastId = toast.loading(`Duplicating & renaming ${templatesToDuplicate.length} template(s)...`);

    try {
      const response = await fetch('/api/templates/duplicate-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        // Send the array of {uid, name} objects
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

      setSelectedTemplates(new Map()); // Clear selection Map
      setAllowedSetNumber(null); // Reset allowed set after duplication
      // TODO: Consider a refresh or update of the current view, or redirect to My Templates?

    } catch (err) {
      console.error("Error duplicating/renaming templates:", err);
      toast.error(`Operation failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDuplicating(false);
    }
  };

  // --> START CHANGE: Add Modal Open/Close Handlers <--
  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);
  // --> END CHANGE <--

  let pageContent;
  if (initialLoading) {
    pageContent = <div>Loading initial templates...</div>;
  } else if (error && templates.length === 0) {
    // Show error only if initial load failed and we have no templates
    pageContent = <div>Error loading templates: {error}</div>;
  } else if (templates.length === 0 && !hasMore) {
    pageContent = <div>No templates found.</div>;
  } else {
    pageContent = (
      <>
        <div style={{ marginBottom: '2rem' }}> 
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}> 
             {/* --> START CHANGE: Wrap title and add Icon <-- */}
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <h1 style={{ margin: 0, lineHeight: 1.15, fontSize: '3.5rem', fontWeight: 900, color: '#111' }}>
                  Template Gallery
                </h1>
                <FiPlayCircle 
                  onClick={openVideoModal}
                  style={{ 
                    fontSize: '1.5rem', // Even smaller size
                    color: '#62d76b', // Lighter theme green
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#56c15f'} // Lighter hover for theme green
                  onMouseOut={(e) => e.currentTarget.style.color = '#62d76b'} // Revert color
                  title="Watch How-To Video"
                />
              </div>
            {/* --> END CHANGE <-- */}
            <p style={{ marginTop: '1rem', marginBottom: 0, lineHeight: 1.5, fontSize: '1.2rem', color: '#333' }}>
              Select templates from the same set to duplicate them.
            </p>
          </div>
          {selectedTemplates.size > 0 && (
            <div style={{ textAlign: 'right' }}>
              <Button
                onClick={handleDuplicateSelected}
                disabled={isDuplicating}
                isLoading={isDuplicating}
              >
                Duplicate Selected ({selectedTemplates.size})
              </Button>
            </div>
          )}
        </div>
        {/* Basic grid styling */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem', // Increased gap slightly for better spacing with fixed height
          alignItems: 'stretch' // Change from 'center' to 'stretch'
        }}>
          {templates.map((template, index) => {
            const isLastElement = templates.length === index + 1;
            const isSelected = selectedTemplates.has(template.uid); // Check presence using Map.has
            // Determine if the template should be disabled
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
                {/* Container for Checkbox and the Square Image Area */}
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

                  {/* Square Image container: Apply aspect-ratio here */}
                  <div style={{ 
                    aspectRatio: '1 / 1', 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden', 
                    marginBottom: '0.75rem' // Add margin below square container
                  }}>
                    {template.preview_url ? (
                      <img
                        src={template.preview_url}
                        alt={`Preview of ${template.name}`}
                        style={{ 
                          width: '100%', // Fill square container width
                          height: '100%', // Fill square container height
                          objectFit: 'contain', // Fit entire image within square
                          display: 'block'
                        }}
                        loading="lazy"
                      />
                    ) : (
                      // Make placeholder fill the square container too
                      <div style={{ height: '100%', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        No Preview
                      </div>
                    )}
                  </div>
                </div>
                {/* Template Name */}
                <div style={{ fontSize: '0.85rem', fontWeight: '300', flexShrink: 0 }}> 
                  {template.name}
                </div>
              </div>
            );
          })}
        </div>
        {/* Loading indicator for subsequent pages */} 
        {loading && !initialLoading && <div style={{ textAlign: 'center', padding: '2rem' }}>Loading more templates...</div>}
        {/* Display error if loading more fails */} 
        {error && !initialLoading && <div style={{ textAlign: 'center', padding: '1rem', color: 'red' }}>Error loading more: {error}</div>}
      </>
    );
  }

  // Wrap the content in the Layout component and include the DashboardHeader
  return (
    <Layout activePage="templates"> {/* Pass activePage prop for sidebar highlighting */}
      <DashboardHeader title="Template Gallery" />
      {pageContent}

      {/* --> START CHANGE: Add Video Modal <-- */}
      <Modal 
        isOpen={isVideoModalOpen} 
        onClose={closeVideoModal} 
        title="How to Use the Template Gallery"
      >
        {/* --> START CHANGE: Add wrapper to override content padding/background <-- */}
        <div style={{ 
          padding: 0, // Override default padding
          margin: '-1.5rem', // Counteract modal-content padding
          overflow: 'hidden', // Ensure content fits
          borderRadius: '0 0 12px 12px' // Match bottom corners of modal container
        }}>
          {/* Responsive Iframe container */}
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0, 
            overflow: 'hidden', 
            maxWidth: '100%', 
            background: '#000' // Keep black background for video area
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
         {/* --> END CHANGE <-- */}
      </Modal>
      {/* --> END CHANGE <-- */}

    </Layout>
  );
}

export default TemplateGalleryPage; 