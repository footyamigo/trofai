import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout/Layout';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import { toast } from 'react-hot-toast';
import Button from '../components/UI/Button';
import { FiGrid } from 'react-icons/fi';
import Link from 'next/link';
import Modal from '../components/UI/Modal';
import { FiPlayCircle } from 'react-icons/fi';

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

      setTemplates(data.templates); // Set the templates directly

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
    pageContent = <div>Loading your templates...</div>;
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
        marginTop: '2rem'
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
      <>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Removed index and ref from map, key uses only uid */}
          {templates.map((template) => (
            <div
              key={template.uid}
              style={{
                  border: '1px solid #ccc', 
                  padding: '1rem', 
                  textAlign: 'center',
                  display: 'flex', // Use flexbox for layout
                  flexDirection: 'column', // Stack items vertically
                  justifyContent: 'space-between' // Push button to bottom
                }}
            >
              <div> {/* Wrapper for image and name */}
                {template.preview_url ? (
                  <img
                    src={template.preview_url}
                    alt={`Preview of ${template.name}`}
                    style={{ maxWidth: '100%', height: 'auto', marginBottom: '0.5rem' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ height: '150px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    No Preview
                  </div>
                )}
                <div style={{ marginBottom: '0.75rem' }}>{template.name}</div>
              </div>
              {/* Edit Button */}
              <Button
                 onClick={() => handleEditTemplate(template.uid)}
                 disabled={editingUid === template.uid} // Disable only the clicked button
                 isLoading={editingUid === template.uid} // Show loading only on the clicked button
                 variant="secondary" // Use secondary style if available
                 size="small" // Use smaller size if available
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
        {/* Removed pagination loading/error indicators */} 
      </>
    );
  }

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  return (
    <Layout activePage="my-templates"> 
      <DashboardHeader /> 
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <h1 style={{ margin: 0, lineHeight: 1.15, fontSize: '3.5rem', fontWeight: 900, color: '#111' }}>
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
          <p style={{ marginTop: '1rem', marginBottom: 0, lineHeight: 1.5, fontSize: '1.2rem', color: '#333' }}>
            View and manage your saved templates.
          </p>
        </div>
        {pageContent}
      </div>

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

    </Layout>
  );
}

export default MyTemplatesPage; 