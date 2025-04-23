import React, { useState, useEffect, useCallback } from 'react';
// import Layout from '../components/Layout/Layout'; // REMOVED
import Sidebar from '../components/Layout/Sidebar'; // ADDED
import MobileMenu from '../components/Layout/MobileMenu'; // ADDED
import Head from 'next/head'; // ADDED
import ProtectedRoute from '../src/components/ProtectedRoute'; // ADDED
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Button from '../components/UI/Button';
import { FiGrid } from 'react-icons/fi';
import Link from 'next/link';
import Modal from '../components/UI/Modal';
import { FiPlayCircle } from 'react-icons/fi';

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
    <p style={{ color: '#555', fontWeight: '500', marginTop: '1rem' }}>Loading your templates...</p>
  </div>
);

// No longer paginated, so PAGE_LIMIT is not needed here

// This page displays all templates, similar to the gallery but without selection/duplication
function MyTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUid, setEditingUid] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Fetch user-specific templates once
  const fetchMyTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    let sessionToken;
    // Get session token from localStorage
    if (typeof window !== 'undefined') {
        sessionToken = localStorage.getItem('session'); 
    } else {
        console.error('Cannot access localStorage outside browser');
        setError("Not authenticated");
        setIsLoading(false);
        setTemplates([]);
        return;
    }

    if (!sessionToken) {
        setError("Not authenticated");
        setIsLoading(false);
        setTemplates([]);
        return;
    }

    try {
      const apiUrl = '/api/my-templates'; // Use the new endpoint
      const response = await fetch(apiUrl, {
         headers: {
             'Authorization': `Bearer ${sessionToken}`,
         }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Endpoint returns { templates: [...] }

      // --> START ADDITION: Process names for display <--
      const baseNameMap = new Map();
      let nextBaseId = 1;
      
      const processedTemplates = data.templates.map(template => {
        let displayName = template.name; // Default to original name
        
        // Regex to capture prefix, base name (like Template47), and suffix (like _Story3)
        const match = template.name?.match(/^([a-zA-Z0-9_-]+)_([a-zA-Z0-9]+)((?:_design|_story)\d+)$/i);
        
        if (match) {
          const userPrefix = match[1]; // e.g., presidentialideasgmailcom
          const originalBaseName = match[2]; // e.g., Template47
          const suffix = match[3]; // e.g., _Story3
          
          // Use a combination of prefix and original base name to uniquely identify the source set
          const sourceSetKey = `${userPrefix}_${originalBaseName}`;
          
          let baseId;
          if (baseNameMap.has(sourceSetKey)) {
            baseId = baseNameMap.get(sourceSetKey);
          } else {
            baseId = nextBaseId++;
            baseNameMap.set(sourceSetKey, baseId);
          }
          displayName = `My Template ${baseId}${suffix}`;
        } else {
          // If the name doesn't match the expected duplicated pattern, log it but keep original name
          console.warn(`Template name "${template.name}" did not match expected user-duplicated pattern.`);
        }

        return { ...template, display_name: displayName };
      });
      
      setTemplates(processedTemplates); // Set the processed templates
      // <-- END ADDITION -->

    } catch (err) {
      console.error("Error fetching my templates:", err);
      setError(err.message);
      setTemplates([]); // Clear templates on error
    } finally {
      setIsLoading(false);
    }
  }, []); 

  // Initial load effect
  useEffect(() => {
    fetchMyTemplates();
  }, [fetchMyTemplates]); // Run once on mount

  // --- Edit Handler ---
  const handleEditTemplate = async (templateUid) => {
    setEditingUid(templateUid); // Indicate loading state for this specific button
    const toastId = toast.loading('Preparing editor...');

    let sessionToken;
    if (typeof window !== 'undefined') {
        sessionToken = localStorage.getItem('session'); 
    } else {
        toast.error('Authentication error - Cannot verify session.', { id: toastId });
        setEditingUid(null);
        return;
    }
    if (!sessionToken) {
        toast.error('Authentication error - Please sign in again.', { id: toastId });
        setEditingUid(null);
        return;
    }

    try {
        const response = await fetch('/api/sessions/create', { // Call the new API route
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ templateUid }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create edit session');
        }

        if (result.session_editor_url) {
            toast.success('Redirecting to editor...', { id: toastId });
            window.open(result.session_editor_url, '_blank'); // Open in new tab
        } else {
            throw new Error('Editor URL not received from server.');
        }

    } catch (err) {
        console.error("Error creating edit session:", err);
        toast.error(`Failed to open editor: ${err.message}`, { id: toastId });
    } finally {
        setEditingUid(null); // Reset loading state for the button
    }
  };

  // --- Render Logic (Simplified) ---
  let pageContent;
  if (isLoading) {
    pageContent = <LoadingView />;
  } else if (error) {
    pageContent = <div>Error loading your templates: {error}</div>;
  } else if (templates.length === 0) {
    pageContent = (
      <div style={{
        textAlign: 'center',
        padding: '4rem 1rem',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        marginTop: '2rem',
        maxWidth: '1200px', // Center this block too
        margin: '2rem auto 0 auto' // Center this block too
      }}>
        <FiGrid style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>
          No Saved Templates
        </h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          You haven't duplicated any templates from the gallery yet.
        </p>
        <Link href="/templates" passHref>
          <Button as="a">
            Go to Template Gallery
          </Button>
        </Link>
      </div>
    );
  } else {
    pageContent = (
      <div style={{
        maxWidth: '1200px', // Center grid
        margin: '0 auto' // Center grid
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem', // Use consistent gap
          alignItems: 'stretch' // Stretch items
        }}>
          {/* Removed index and ref from map, key uses only uid */}
          {templates.map((template) => (
            <div
              key={template.uid}
              style={{
                  border: '1px solid #ccc', 
                  borderRadius: '8px', // Added border radius
                  padding: '1rem', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
            >
              <div> {/* Wrapper for image and name */}
                {template.preview_url ? (
                  <div style={{ 
                    aspectRatio: '1 / 1', 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden', 
                    marginBottom: '0.75rem' 
                  }}>
                    <img
                      src={template.preview_url}
                      alt={`Preview of ${template.display_name || template.name}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        display: 'block' 
                      }}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div style={{ height: '100%', width: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No Preview
                  </div>
                )}
                <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 300 }}>
                  {template.display_name}
                </div>
              </div>
              {/* Edit Button */}
              <Button
                 onClick={() => handleEditTemplate(template.uid)}
                 disabled={editingUid === template.uid} // Disable only the clicked button
                 isLoading={editingUid === template.uid} // Show loading only on the clicked button
                 variant="secondary" // Use secondary style if available
                 size="small" // Use smaller size if available
                 style={{ marginTop: 'auto' }} // Ensure button is at the bottom
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
        {/* Removed pagination loading/error indicators */} 
      </div>
    );
  }

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>My Templates - Trofai</title>
          <meta name="description" content="View and manage your saved templates."/>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <MobileMenu activePage="my-templates" />
        <Sidebar activePage="my-templates" />
        <div className="dashboard-container">
          <DashboardHeader /> 
          <main className="main">
            <div className="content">
              {/* Page Title Section */} 
              <div className="dashboard-header"> 
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <h1 className="title">
                    My Templates
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
                  View and manage your saved templates.
                </p>
              </div>

              {/* Main Content */} 
              {pageContent}
            </div>
          </main>
        </div>

        {/* Modal */} 
        <Modal 
          isOpen={isVideoModalOpen} 
          onClose={closeVideoModal} 
          title="How to Manage Your Templates"
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
                title="My Templates Tutorial"
              ></iframe>
            </div>
          </div>
        </Modal>
        
        {/* Copied Styles */} 
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          }
          .dashboard-container {
            margin-left: 240px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main {
            flex: 1;
            padding: 2rem;
          }
          .content {
            /* Content itself doesn't need max-width, applied to wrappers inside */
          }
          .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-top: 1rem;
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

export default MyTemplatesPage; 