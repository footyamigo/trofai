import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import PropertyURLForm from '../../components/Forms/PropertyURLForm';
import ResultsContainer from '../../components/Results/ResultsContainer';
import ResultsModal from '../../components/Results/ResultsModal';
import HistoryList from '../../components/Dashboard/HistoryList';
import Card from '../../components/UI/Card';
import ErrorDisplay from '../../components/UI/ErrorDisplay';
import ProgressIndicator from '../../components/UI/ProgressIndicator';
import LoadingModal from '../../components/UI/LoadingModal';
import TemplateSelector from '../../components/UI/TemplateSelector';
import ListingTypeSelector from '../../components/UI/ListingTypeSelector';
import Head from 'next/head';
import Sidebar from '../../components/Layout/Sidebar';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import MobileMenu from '../../components/Layout/MobileMenu';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { FiTrash2 } from 'react-icons/fi';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user, loading, error: authError } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [loadingUrl, setLoadingUrl] = useState('');
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedListingType, setSelectedListingType] = useState(null);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [captionOptions, setCaptionOptions] = useState(null);
  const [initializeAttempts, setInitializeAttempts] = useState(0);
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [visibleProperties, setVisibleProperties] = useState(5); // Number of properties to show initially
  const [isDeletingProperty, setIsDeletingProperty] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [isContentFreshlyGenerated, setIsContentFreshlyGenerated] = useState(false);
  const [templateSelectionError, setTemplateSelectionError] = useState(null);
  
  const pollIntervalRef = useRef(null);

  const [history, setHistory] = useState([]);

  // --> START ADDITION: Function to handle loaded sets and set default <--
  const handleSetsLoaded = (loadedSets) => {
    console.log('Template sets loaded in dashboard:', loadedSets);
    // Find the first user-specific template set (doesn't match standard name)
    const firstUserSet = loadedSets.find(set => !/^Template Set \d+$/i.test(set.name));
    
    if (firstUserSet) {
      console.log('Found user set, setting as default:', firstUserSet.id);
      setSelectedTemplate(firstUserSet.id);
    } else {
      console.log('No user sets found, keeping default selection null.');
      // Ensure it remains null if no user sets are found and nothing was previously selected
      // If selectedTemplate already had a value (e.g., user manually selected one before load finished),
      // we probably don't want to override it here. So, only set to null if it was already null.
      // However, since it starts as null, this check might be redundant.
      // Let's keep it simple: only set if a user set is found.
    }
  };
  // <-- END ADDITION -->

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to sign-in page');
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Safety timeout to recover from initialization issues
  useEffect(() => {
    console.log('Dashboard mounted, auth state:', { user: !!user, loading, authError });
    
    // If we're still loading after 5 seconds, try to force a refresh
    if (loading && initializeAttempts < 2) {
      const timeoutId = setTimeout(() => {
        console.log('Dashboard still loading after timeout, attempt:', initializeAttempts + 1);
        setInitializeAttempts(prev => prev + 1);
        
        if (initializeAttempts >= 1) {
          console.log('Multiple loading timeouts, redirecting to sign-in page');
          router.replace('/auth/signin');
        }
      }, 5000); // Reduced from 15 seconds to 5 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, user, authError, initializeAttempts, router]);

  useEffect(() => {
    const pollStatus = async () => {
      if (!currentUid || !currentType) return;

      console.log(`Polling status for UID: ${currentUid}, Type: ${currentType}`);
      try {
        // Simple direct API call with project API key - no more complexity
        const response = await fetch(`/api/direct-collection?uid=${currentUid}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to fetch status (${response.status})`);
        }

        console.log('Poll Response:', data);

        // This mapping is approximate since we don't have direct step info from the API
        // We can infer it from the status and other attributes
        if (data.progress && data.progress > 0) {
          // Move to image generation step
          setProgressStep(2);
        }
        
        if (data.status === 'completed') {
          setProgressStep(3);

          // Show the results modal immediately
          const finalCaption = editedCaption || generatedCaption;
          setResults({
            bannerbear: data,
            caption: finalCaption || "Caption generated earlier",
            captionOptions: captionOptions
          });
          setIsModalOpen(true);
          setShowLoadingModal(false);
          setIsContentFreshlyGenerated(true);

          // Trigger confetti!
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.6 }
            });
          } catch (error) {
            console.error('Confetti failed:', error);
          }

          // Move the rest to the background
          (async () => {
            // Add the new property to the existing properties list
            const newProperty = {
              ...data,
              caption: finalCaption,
              captionOptions: captionOptions
            };
            setProperties(prevProperties => [newProperty, ...prevProperties]);
            setIsLoading(false);
            setCurrentUid(null);
            setCurrentType(null);
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            // Any other DB or analytics updates can go here
          })();
        } else if (data.status === 'failed') {
          console.error('Processing failed:', data);
          setShowLoadingModal(false);
          setError({ message: 'Image/Collection generation failed.', details: JSON.stringify(data) });
          setIsLoading(false);
          setCurrentUid(null);
          setCurrentType(null);
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        } else {
          console.log('Status still pending...');
        }
      } catch (err) {
        console.error('Polling error:', err);
        setShowLoadingModal(false);
        setError({ message: 'Error checking status.', details: err.message });
        setIsLoading(false);
        setCurrentUid(null);
        setCurrentType(null);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    if (currentUid && isLoading && !pollIntervalRef.current) {
      pollStatus(); 
      pollIntervalRef.current = setInterval(pollStatus, 5000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        console.log('Polling interval cleared.');
      }
    };
  }, [currentUid, currentType, isLoading, results?.metadata, selectedTemplate, editedCaption, generatedCaption, captionOptions]);

  const handleSubmit = async (url) => {
    // Check if template is selected FIRST
    if (!selectedTemplate) {
      console.log('Validation failed: No template selected.');
      setTemplateSelectionError('Please select a template set first.');
      return; 
    }
    
    // Check if listing type is selected
    if (!selectedListingType) {
      console.log('Validation failed: No listing type selected.');
      setTemplateSelectionError('Please select a listing type.');
      return;
    }
    
    console.log('Validation passed. Proceeding with submission for URL:', url, 'Template:', selectedTemplate, 'Listing Type:', selectedListingType);
    
    // Clear previous results and errors (including the specific template error) ONLY if validation passes
    setResults(null);
    setError(null);
    setTemplateSelectionError(null);
    
    // Stop any previous polling ONLY if validation passes
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
      
    // Reset state and show loading modal ONLY if validation passes
    setCurrentUid(null);
    setCurrentType(null);
    setIsLoading(true); 
    setProgressStep(0); // Start with the first step - scraping
    setLoadingUrl(url);
    setShowLoadingModal(true);
    setGeneratedCaption("");
    setEditedCaption("");
    
    let initialCaption = "Generating caption...";

    try {      
      let responseData;
      try {
        // First step - scraping URL
        setProgressStep(0);
        
        // Get session from localStorage
        const session = localStorage.getItem('session');
        if (!session) {
          throw new Error('No session found. Please sign in again.');
        }
        
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session}`
          },
          body: JSON.stringify({ 
            url,
            templateId: selectedTemplate,
            listing_type: selectedListingType,
            isAgentFlow: true
          })
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        console.log('Initial API Response:', responseData);
        
        if (!response.ok) {
          console.error('API Error:', responseData);
          throw new Error(responseData.error || responseData.message || responseData.details || 'Failed to process URL');
        }
        
        // Second step - analyzing property data
        setProgressStep(1);
        
        // Add newly created property to properties list with complete information
        if (responseData.data && responseData.data.propertyId) {
          const newProperty = {
            propertyId: responseData.data.propertyId,
            id: responseData.data.propertyId,
            address: responseData.data.property.address || "New Property",
            price: responseData.data.property.price || "",
            bedrooms: responseData.data.property.bedrooms || "",
            bathrooms: responseData.data.property.bathrooms || "",
            createdAt: new Date().toISOString(), // Ensure we have a valid date
            images: responseData.data.bannerbear?.images || [],
            bannerbear: responseData.data.bannerbear || {}
          };
          
          console.log('Adding new property to display:', newProperty);
          
          // Add to properties state immediately for UI display
          setProperties(prevProperties => {
            // Check if this property already exists (by propertyId)
            const exists = prevProperties.some(p => 
              (p.propertyId === newProperty.propertyId) || (p.id === newProperty.propertyId)
            );
            
            if (exists) {
              // Replace the existing property
              return prevProperties.map(p => 
                (p.propertyId === newProperty.propertyId || p.id === newProperty.propertyId) 
                  ? newProperty 
                  : p
              );
            } else {
              // Add as a new property
              return [newProperty, ...prevProperties];
            }
          });
        }
      } catch (jsonError) {
        if (jsonError.name === 'SyntaxError' && jsonError.message.includes('JSON')) {
          console.error('JSON Parse Error:', jsonError);
          throw new Error('Error parsing JSON response from server. The Rightmove scraper may be encountering issues.');
        }
        throw jsonError;
      }

      if (!responseData || !responseData.data || !responseData.data.bannerbear || !responseData.data.bannerbear.uid) {
        console.error('Missing uid or expected structure in API response', responseData);
        throw new Error('Invalid API response format from /api/process');
      }
      
      initialCaption = responseData.data.caption || "Caption generation pending...";
      setGeneratedCaption(initialCaption);
      
      // Set caption options if available
      if (responseData.data.captionOptions) {
        setCaptionOptions(responseData.data.captionOptions);
      } else {
        setCaptionOptions(null);
      }

      setCurrentUid(responseData.data.bannerbear.uid);
      setCurrentType(responseData.data.bannerbear.type || 'collection');
      
      setResults({
        bannerbear: {
           uid: responseData.data.bannerbear.uid,
           status: 'pending',
           type: responseData.data.bannerbear.type || 'collection' 
        },
        caption: initialCaption,
        captionOptions: responseData.data.captionOptions,
        templateId: selectedTemplate
      });

      // Third step - generating images
      setProgressStep(2);
      
      // At this point, we've started generating content
      setIsContentFreshlyGenerated(true);

    } catch (error) {
      console.error('Error processing URL:', error);
      setShowLoadingModal(false);
      setError({
        message: error.message || 'An unexpected error occurred during initial processing',
        details: error.stack || '',
        code: error.code
      });
      setIsLoading(false);
      setCurrentUid(null);
      setCurrentType(null);
      setIsContentFreshlyGenerated(false); // Reset the flag if there's an error
    }
  };

  const handleViewHistoryItem = async (property) => {
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No session found');
      }

      // Show loading state or message
      setIsLoading(true);
      setError(null);

      // Use propertyId or id to fetch the content
      const propertyId = property.propertyId || property.id;
      if (!propertyId) {
        throw new Error('Property ID is missing');
      }

      console.log('Viewing property with ID:', propertyId);

      // Fetch the property content using propertyId instead of id
      const response = await fetch(`/api/properties/content?propertyId=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${session}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching property:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to fetch property content');
      }

      const { data } = await response.json();
      
      if (!data) {
        throw new Error('Property data not found');
      }
      
      console.log('Received property data:', data);
      
      // Check for caption from all possible sources
      const captionText = data.caption || 
                         data.propertyData?.caption || 
                         property.caption || 
                         (data.propertyData?.raw?.caption) ||
                         '';
      
      console.log('Caption found:', captionText);
      
      // Set the flag to indicate this is not freshly generated content
      setIsContentFreshlyGenerated(false);
      
      // Set the results in the format expected by the ResultsModal
      setResults({
        propertyId: propertyId,
        bannerbear: {
          status: data.status || 'completed',
          images: data.images || [],
          image_urls: data.image_urls || {},
          zip_url: data.zip_url,
          uid: data.bannerbear?.uid
        },
        caption: captionText,
        captionOptions: data.captionOptions || {},
        propertyData: {
          property: {
            ...data.propertyData?.property,
            address: data.propertyData?.property?.address || property.address || '',
            price: data.propertyData?.property?.price || property.price || '',
            bedrooms: data.propertyData?.property?.bedrooms || property.bedrooms || '',
            bathrooms: data.propertyData?.property?.bathrooms || property.bathrooms || ''
          }
        }
      });
      
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error viewing property:', error);
      setError({
        message: 'Failed to load property content',
        details: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsContentFreshlyGenerated(false);
  };
  
  const closeLoadingModal = () => {
    // We might want to prevent closing the loading modal while processing
    if (!isLoading) {
      setShowLoadingModal(false);
    }
  };
  
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setTemplateSelectionError(null);
  };
  
  const handleCaptionEdit = (caption) => {
    setEditedCaption(caption);
  };

  // Fetch properties when component mounts and user is authenticated
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Don't try to fetch if user isn't authenticated yet
        if (!user) {
          console.log('User not authenticated, skipping property fetch');
          setIsLoadingProperties(false);
          return;
        }

        const session = localStorage.getItem('session');
        if (!session) {
          console.error('No session found');
          setIsLoadingProperties(false);
          return;
        }

        console.log('Fetching properties for user:', user.username);

        const response = await fetch('/api/properties/list', {
          headers: {
            'Authorization': `Bearer ${session}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        console.log(`Fetched ${data.properties.length} properties for user`);
        setProperties(data.properties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    if (!loading) {
    fetchProperties();
    }
  }, [user, loading]);

  // Update the handleDeleteProperty function 
  const handleDeleteProperty = async (propertyId, e) => {
    // Stop event propagation to prevent triggering row click
    if (e) {
      e.stopPropagation();
    }
    
    // Store the property ID and show the confirmation modal
    setPropertyToDelete(propertyId);
    setShowDeleteConfirmation(true);
  };
  
  // Add the handleSelectProperty function to manage property selection
  const handleSelectProperty = (propertyId, isSelected) => {
    if (isSelected) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  // Add function to handle selecting all visible properties
  const handleSelectAllProperties = (isSelected) => {
    if (isSelected) {
      const visiblePropertyIds = properties
        .slice(0, visibleProperties)
        .map(p => p.propertyId || p.id)
        .filter(Boolean);
      setSelectedProperties(visiblePropertyIds);
    } else {
      setSelectedProperties([]);
    }
  };

  // Add function to handle bulk delete
  const handleBulkDelete = () => {
    if (selectedProperties.length === 0) return;
    
    setIsBulkDelete(true);
    setShowDeleteConfirmation(true);
  };

  // Update the confirmDeleteProperty function to handle bulk deletion
  const confirmDeleteProperty = async () => {
    // If it's a bulk delete, use selectedProperties array; otherwise, use propertyToDelete
    const propertiesToDelete = isBulkDelete ? selectedProperties : [propertyToDelete];
    if (propertiesToDelete.length === 0) return;
    
    setIsDeletingProperty(true);
    
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No session found');
      }
      
      // Log the request we're about to make
      console.log(`Sending delete request for properties:`, propertiesToDelete);
      
      // Perform deletion for each property sequentially
      const results = [];
      for (const propertyId of propertiesToDelete) {
        try {
          const response = await fetch(`/api/properties/delete?propertyId=${propertyId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session}`
            }
          });
          
          const responseData = await response.json();
          results.push({ 
            propertyId, 
            success: response.ok, 
            data: responseData 
          });
          
          console.log(`Delete response for ${propertyId}:`, responseData);
        } catch (error) {
          results.push({ 
            propertyId, 
            success: false, 
            error: error.message 
          });
          console.error(`Error deleting property ${propertyId}:`, error);
        }
      }
      
      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      // Remove successfully deleted properties from the state
      const deletedIds = results.filter(r => r.success).map(r => r.propertyId);
      setProperties(prevProperties => 
        prevProperties.filter(p => 
          !deletedIds.includes(p.propertyId) && !deletedIds.includes(p.id)
        )
      );
      
      // Show appropriate message based on results
      if (failureCount > 0) {
        setError({
          message: `Deleted ${successCount} properties, but failed to delete ${failureCount} properties`,
          details: results.filter(r => !r.success).map(r => `Property ${r.propertyId}: ${r.error || 'Unknown error'}`).join('\n'),
          code: 'BULK_DELETE_PARTIAL'
        });
      }
      
      // Reset all delete-related state
      setShowDeleteConfirmation(false);
      setPropertyToDelete(null);
      setSelectedProperties([]);
      setIsBulkDelete(false);
      
    } catch (error) {
      console.error('Error in bulk delete operation:', error);
      setError({
        message: 'Failed to delete properties',
        details: error.message,
        code: 'BULK_DELETE_ERROR'
      });
    } finally {
      setIsDeletingProperty(false);
    }
  };

  // Update the cancelDeleteProperty function to also reset bulk delete state
  const cancelDeleteProperty = () => {
    setShowDeleteConfirmation(false);
    setPropertyToDelete(null);
    setIsBulkDelete(false);
  };

  // Update the loadMoreProperties function in renderHistory to show all properties
  const renderHistory = () => {
    if (isLoadingProperties) {
      return <div className="text-center py-4">Loading property history...</div>;
    }

    if (properties.length === 0) {
      return (
        <div className="history-section">
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h3>No properties yet</h3>
            <p>Convert your first property listing to see it here.</p>
          </div>
          <style jsx>{`
            .history-section {
              margin-top: 2rem;
              padding: 2rem;
              background: white;
              border-radius: 12px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .empty-state {
              text-align: center;
              padding: 4rem 1rem;
              background: #f8fafc;
              border-radius: 12px;
              border: 2px dashed #e2e8f0;
            }
            .empty-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
              color: #9ca3af;
            }
            h3 {
              margin: 0 0 0.5rem 0;
              font-size: 1.25rem;
              font-weight: 600;
              color: #334155;
            }
            p {
              margin: 0;
              color: #64748b;
            }
          `}</style>
        </div>
      );
    }

    // Get only the visible properties
    const propertiesToShow = properties.slice(0, visibleProperties);
    const hasMoreProperties = properties.length > visibleProperties;

    const loadMoreProperties = () => {
      // Load all properties instead of just 5 more
      setVisibleProperties(properties.length);
    };

    // Check if all visible properties are selected
    const allVisibleSelected = propertiesToShow.every(property => {
      const propertyId = property.propertyId || property.id;
      return propertyId && selectedProperties.includes(propertyId);
    });

    return (
      <div className="history-section">
        <div className="history-header">
        <h2 className="history-title">History</h2>
          
          {selectedProperties.length > 0 && (
              <button
              className={`bulk-delete-button ${isDeletingProperty ? 'loading' : ''}`} 
              onClick={handleBulkDelete}
              disabled={isDeletingProperty}
            >
              {isDeletingProperty ? (
                <>
                  <span className="delete-spinner"></span>
                  Deleting...
                </>
              ) : (
                <>Delete Selected ({selectedProperties.length})</>
              )}
            </button>
          )}
        </div>
        
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={propertiesToShow.length > 0 && allVisibleSelected}
                      onChange={(e) => handleSelectAllProperties(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                  </label>
                </th>
                <th>Property</th>
                <th>Price</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {propertiesToShow.map((property) => {
                // Format date safely
                let formattedDate = "Invalid Date";
                try {
                  const date = property.createdAt ? new Date(property.createdAt) : new Date();
                  if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString();
                  }
                } catch (e) {
                  console.error("Date formatting error:", e);
                }
                
                // Ensure we have a valid property ID
                const propertyId = property.propertyId || property.id;
                
                // Skip any properties without an ID
                if (!propertyId) {
                  console.error("Property missing ID:", property);
                  return null;
                }
                
                // Check if this property is selected
                const isSelected = selectedProperties.includes(propertyId);
                
                return (
                  <tr key={propertyId} className={`history-row ${isSelected ? 'selected' : ''}`}>
                    <td className="checkbox-cell">
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => handleSelectProperty(propertyId, e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td className="property-cell">
                      <span className="property-title">{property.address || "Property"}</span>
                    </td>
                    <td className="price-cell">
                      <span className="property-price">{property.price || ""}</span>
                    </td>
                    <td className="date-cell">
                      <span className="property-date">{formattedDate}</span>
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          onClick={(e) => {
                            // Add visual feedback when clicked
                            const button = e.currentTarget;
                            button.classList.add('clicked');
                            // Remove the class after the animation completes
                            setTimeout(() => {
                              if (button && button.classList) {
                                button.classList.remove('clicked');
                              }
                            }, 300);
                            handleViewHistoryItem({...property, propertyId});
                          }}
                className="view-button"
              >
                View
              </button>
                        <button
                          onClick={(e) => handleDeleteProperty(propertyId, e)}
                          className={`delete-button ${isDeletingProperty ? 'loading' : ''}`}
                          title={isDeletingProperty ? "Deletion in progress..." : "Delete property"}
                          disabled={isDeletingProperty}
                        >
                          {isDeletingProperty && propertyToDelete === propertyId ? (
                            <span className="loading-spinner"></span>
                          ) : (
                            <FiTrash2 />
                          )}
              </button>
            </div>
                    </td>
                  </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
          
          {hasMoreProperties && (
            <div className="load-more-container">
              <button 
                className="load-more-button"
                onClick={loadMoreProperties}
              >
                Load More
              </button>
            </div>
          )}
        </div>
        <style jsx>{`
          .history-section {
            margin-top: 2rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .history-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
          }
          
          .bulk-delete-button {
            padding: 0.5rem 1rem;
            background: #fff5f5;
            color: #e53e3e;
            border: 2px solid #e53e3e;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .bulk-delete-button:hover {
            background: #fed7d7;
          }
          
          .bulk-delete-button.loading {
            background: #fed7d7;
            opacity: 0.9;
            cursor: wait;
          }
          
          .delete-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(229, 62, 62, 0.3);
            border-radius: 50%;
            border-top-color: #e53e3e;
            animation: spin 1s linear infinite;
          }
          
          .history-table-container {
            overflow-x: auto;
          }

          .history-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
          }

          .history-table th {
            text-align: left;
            padding: 1rem;
            font-weight: 600;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
          }

          .history-table td {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          
          .checkbox-cell {
            width: 40px;
            text-align: center;
          }
          
          .checkbox-container {
            display: block;
            position: relative;
            padding-left: 25px;
            cursor: pointer;
            user-select: none;
            height: 20px;
            width: 20px;
            margin: 0 auto;
          }
          
          .checkbox-container input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
          }
          
          .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 20px;
            width: 20px;
            background-color: #eee;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          .checkbox-container:hover input ~ .checkmark {
            background-color: #ccc;
          }
          
          .checkbox-container input:checked ~ .checkmark {
            background-color: #62d76b;
            border-color: #62d76b;
          }
          
          .checkmark:after {
            content: "";
            position: absolute;
            display: none;
          }
          
          .checkbox-container input:checked ~ .checkmark:after {
            display: block;
          }
          
          .checkbox-container .checkmark:after {
            left: 7px;
            top: 3px;
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }

          .history-row {
            transition: background-color 0.15s ease;
          }

          .history-row:hover {
            background-color: #f7fafc;
          }
          
          .history-row.selected {
            background-color: #f0fff4;
          }
          
          .history-row.selected:hover {
            background-color: #e6ffed;
          }

          .property-title {
            font-weight: 600;
            color: #1a1a1a;
            display: block;
          }

          .property-price {
            color: #2d3748;
            font-weight: 500;
          }

          .property-date {
            color: #718096;
            font-size: 0.9rem;
          }

          .action-cell {
            width: 160px;
            text-align: center;
          }

          .action-buttons {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            align-items: center;
          }

          .view-button {
            padding: 0.5rem 1rem;
            background: #62d76b;
            color: #1a1a1a;
            border: 2px solid #1a1a1a;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
            position: relative;
            overflow: hidden;
          }

          .view-button:hover {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }
          
          .view-button:active, .view-button.clicked {
            transform: translateY(2px);
            box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
            background: #4caf50;
          }
          
          .view-button.clicked::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 120%;
            height: 120%;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: ripple 0.3s ease-out;
          }
          
          .delete-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: transparent;
            color: #e53e3e;
            border: 2px solid #e53e3e;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
            overflow: hidden;
          }
          
          .delete-button:hover {
            background: #fff5f5;
            transform: translateY(-1px);
          }
          
          .delete-button:active {
            background: #fed7d7;
            transform: translateY(1px);
          }
          
          .delete-button.loading {
            background: #fee2e2;
            cursor: wait;
            opacity: 0.7;
          }
          
          .delete-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          
          .delete-button:disabled:hover {
            background: transparent;
            transform: none;
          }
          
          .delete-button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background: rgba(229, 62, 62, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          
          .delete-button:active::after {
            animation: delete-ripple 0.3s ease-out;
          }
          
          @keyframes delete-ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
          
          .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(229, 62, 62, 0.3);
            border-radius: 50%;
            border-top-color: #e53e3e;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          
          .load-more-container {
            margin-top: 1.5rem;
            text-align: center;
          }
          
          .load-more-button {
            padding: 0.75rem 1.5rem;
            background: white;
            color: #1a1a1a;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          
          .load-more-button:hover {
            background: #f7fafc;
            border-color: #cbd5e0;
          }
          
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }

          @media (max-width: 768px) {
            .history-section {
              padding: 1rem;
            }
            
            .history-table th,
            .history-table td {
              padding: 0.75rem 0.5rem;
            }
            
            .action-cell {
              width: 100px;
            }
          }
        `}</style>
      </div>
    );
  };

  // Add function to handle listing type selection
  const handleListingTypeSelect = (typeId) => {
    setSelectedListingType(typeId);
  };

  // Check for errors at render time
  if (authError) {
    return (
      <div style={{ 
        padding: '2rem', 
        maxWidth: '600px', 
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2>Authentication Error</h2>
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.375rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p>{authError.message || 'There was a problem with authentication'}</p>
        </div>
        <button 
          onClick={() => router.push('/auth/signin')}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>Listing Designs That Get Results - Trofai</title>
          <meta name="description" content="Property image generator for social media" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <MobileMenu activePage="overview" />
        <Sidebar activePage="overview" />

        <div className="dashboard-container">
          <DashboardHeader />
          
          <main className="main">
            <div className="content">
              <div className="dashboard-header">
                <h1 className="title">Listing Designs That Get Results</h1>
                <p className="subtitle">Turn your property listings into scroll-stopping social media content in seconds.</p>
              </div>

              <Card>
                <TemplateSelector 
                  selectedTemplate={selectedTemplate} 
                  onSelect={handleTemplateSelect} 
                  onSetsLoaded={handleSetsLoaded}
                  apiEndpoint="/api/list-listing-templates"
                />
                
                <ListingTypeSelector
                  selectedType={selectedListingType}
                  onSelect={handleListingTypeSelect}
                />
                
                <PropertyURLForm 
                  onSubmit={handleSubmit} 
                  buttonText="Make it Happen"
                  placeholder="Paste a Rightmove, Zillow, or OnTheMarket property URL"
                />
                
                {templateSelectionError && (
                  <p className="template-error-message">{templateSelectionError}</p>
                )}
              </Card>

              {/* Loading modal for processing steps */}
              <LoadingModal
                isOpen={showLoadingModal}
                onClose={closeLoadingModal}
                url={loadingUrl}
                currentStepIndex={progressStep}
                caption={generatedCaption}
                captionOptions={captionOptions}
                onCaptionEdit={handleCaptionEdit}
              />

              {error && (
                <ErrorDisplay 
                  message={error.message} 
                  details={error.details} 
                  code={error.code}
                  onDismiss={() => setError(null)} 
                />
              )}

              {/* Display the results in the modal when completed */}
              <ResultsModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                results={results} 
              />
              
              {/* Only show the results summary for freshly generated content */}
              {results && !isModalOpen && isContentFreshlyGenerated && (
                <div className="results-summary" onClick={() => setIsModalOpen(true)}>
                  <h3>
                    {results.bannerbear?.status === 'completed' 
                      ? '✅ Generated content is ready!' 
                      : '⏳ Generation in progress...'}
                  </h3>
                  <button className="view-button success">View Results</button>
                </div>
              )}

              {renderHistory()}
            </div>
          </main>
        </div>

        {/* Update the delete confirmation modal to support bulk delete */}
        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onCancel={cancelDeleteProperty}
          onConfirm={confirmDeleteProperty}
          title={isBulkDelete ? "Delete Multiple Properties" : "Delete Property"}
          message={isBulkDelete 
            ? `Are you sure you want to delete ${selectedProperties.length} properties? This action cannot be undone.` 
            : "Are you sure you want to delete this property? This action cannot be undone."
          }
          isLoading={isDeletingProperty}
        />

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
            max-width: 1200px;
            margin: 0 auto;
          }

          .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
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
            margin: 1rem 0 1.5rem;
            color: #333;
          }
          
          .results-summary {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .results-summary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .results-summary h3 {
            margin: 0;
            font-size: 1.2rem;
          }
          
          .view-button {
            background: #62d76b;
            color: black;
            border: 2px solid black;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          }
          
          .view-button:hover {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            .dashboard-container {
              margin-left: 0;
              padding-top: 64px; /* Height of mobile header */
            }

            .main {
              padding: 1rem;
            }
            
            .title {
              font-size: 2.5rem;
            }
          }
        `}</style>

        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          }

          * {
            box-sizing: border-box;
          }

          .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            padding: 1.5rem;
          }

          .button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #276749;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .button:hover {
            background: #2f855a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(39, 103, 73, 0.2);
          }

          .button:active {
            transform: translateY(1px);
          }

          .button.secondary {
            background: transparent;
            border: 2px solid #276749;
            color: #276749;
          }

          .button.secondary:hover {
            background: rgba(39, 103, 73, 0.1);
          }

          input, textarea {
            padding: 0.75rem 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            width: 100%;
          }

          input:focus, textarea:focus {
            outline: none;
            border-color: #38a169;
            box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
          }

          .template-error-message {
            color: #c53030; /* Dark red color */
            font-size: 0.875rem;
            margin-top: 0.5rem; /* Space above the message */
            margin-left: 0.25rem; /* Align slightly with the input */
            text-align: left; 
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 