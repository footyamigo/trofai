import { useState, useEffect, useRef, useCallback } from 'react';
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
import { FiTrash2, FiPlayCircle } from 'react-icons/fi';
import ConfirmationModal from '../../components/UI/ConfirmationModal';
import confetti from 'canvas-confetti';
import Modal from '../../components/UI/Modal';
import VideoLoadingModal from '../../components/UI/VideoLoadingModal';
import VideoResultsModal from '../../components/Results/VideoResultsModal';

// Custom Hook for fetching video templates (optional but cleaner)
function useVideoTemplates() {
  const [videoTemplates, setVideoTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/shotstack/templates');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video templates');
      }
      const data = await response.json();
      setVideoTemplates(data.templates || []);
    } catch (err) {
      console.error("Error fetching video templates:", err);
      setError(err.message);
      setVideoTemplates([]); // Clear templates on error
    } finally {
      setIsLoading(false);
    }
  };

  return { videoTemplates, isLoading, error, fetchTemplates };
}

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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  // --- START VIDEO PREVIEW MODAL STATE --- 
  const [isVideoPreviewModalOpen, setIsVideoPreviewModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);
  // --- END VIDEO PREVIEW MODAL STATE --- 
  
  // --- NEW STATE --- 
  const [outputType, setOutputType] = useState('image'); // 'image' or 'video'
  const { 
    videoTemplates, 
    isLoading: isVideoTemplateLoading, 
    error: videoTemplateError, 
    fetchTemplates: fetchVideoTemplates 
  } = useVideoTemplates(); // Use the custom hook
  const [selectedVideoTemplateId, setSelectedVideoTemplateId] = useState(null);
  // --- END NEW STATE ---

  // --- START VIDEO PAGINATION STATE ---
  const [videoStartIndex, setVideoStartIndex] = useState(0);
  const VIDEO_TEMPLATES_PER_PAGE = 4; // Or adjust as needed
  // --- END VIDEO PAGINATION STATE ---
  
  const pollIntervalRef = useRef(null);

  const [history, setHistory] = useState([]);

  // --> START ADDITION: Function to handle loaded sets and set default <--
  const handleSetsLoaded = (loadedSets) => {
    console.log('Template sets loaded in dashboard:', loadedSets);
    // Set the first template set as default if none is selected
    if (loadedSets && loadedSets.length > 0 && !selectedTemplate) {
      console.log('Setting first template set as default:', loadedSets[0].id);
      setSelectedTemplate(loadedSets[0].id);
    }
  };
  // <-- END ADDITION -->

  // Define fetchProperties outside useEffect, wrapped in useCallback
  const fetchProperties = useCallback(async () => {
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
      setIsLoadingProperties(true); // Set loading true before fetch

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
  }, [user]); // Dependency: user (re-fetch if user changes)

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

  // --- NEW EFFECT --- Fetch video templates when output type changes to video
  useEffect(() => {
    if (outputType === 'video') {
      fetchVideoTemplates();
    }
  }, [outputType]); // Rerun when outputType changes
  // --- END NEW EFFECT ---

  // Fetch properties when component mounts and user is authenticated
  useEffect(() => {
    if (!loading && user) { // Check user exists before fetching
      fetchProperties();
    }
    // We removed fetchProperties definition from here
    // Add fetchProperties to dependency array if ESLint requires, 
    // but useCallback should handle it correctly.
  }, [user, loading, fetchProperties]); // Added fetchProperties dependency

  const handleSubmit = async (url) => {
    // Validation Check:
    let isSelectionValid = false;
    let specificError = null;
    if (outputType === 'image' && !selectedTemplate) {
      specificError = 'Please select an image template set first.';
    } else if (outputType === 'video' && !selectedVideoTemplateId) {
      specificError = 'Please select a video template first.';
    } else if (!selectedListingType) {
      specificError = 'Please select a listing type.';
    } else {
      isSelectionValid = true;
    }

    if (!isSelectionValid) {
      console.log('Validation failed:', specificError);
      setTemplateSelectionError(specificError);
      return;
    }
    
    console.log(
      `Validation passed. Proceeding with ${outputType} generation. URL:`, 
      url, 
      'Template:', 
      outputType === 'image' ? selectedTemplate : selectedVideoTemplateId, 
      'Listing Type:', 
      selectedListingType
    );
    
    // Reset state (remains the same)
    setResults(null);
    setError(null);
    setTemplateSelectionError(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setCurrentUid(null);
    setCurrentType(null);
    setIsLoading(true); 
    setProgressStep(0); // Start with scraping
    setLoadingUrl(url);
    setShowLoadingModal(true); // Show the appropriate loading modal based on outputType later
    setGeneratedCaption("");
    setEditedCaption("");
    setCaptionOptions(null);
    setIsContentFreshlyGenerated(false);

    try {
      // --- STEP 1: Scrape Data --- 
      setProgressStep(0); // Scraping step in modal
      console.log(`[handleSubmit] Calling /api/scrape for URL: ${url}`);
      
        const session = localStorage.getItem('session');
        if (!session) {
          throw new Error('No session found. Please sign in again.');
        }
        
      const scrapeResponse = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session}`
          },
          body: JSON.stringify({ url, listingType: selectedListingType })
      });

      const scrapeResult = await scrapeResponse.json();

      if (!scrapeResponse.ok || !scrapeResult.success) {
        console.error('[handleSubmit] Scraping API Error:', scrapeResult);
        throw new Error(scrapeResult.error || 'Failed to scrape property data.');
      }
      
      const scrapedData = scrapeResult.scrapedData;
      console.log('[handleSubmit] Scraping successful. Scraped data keys:', Object.keys(scrapedData || {}));

      // Store initial caption from scrape results
      const initialCaption = scrapedData.caption || "Caption generation pending...";
      setGeneratedCaption(initialCaption);
      if (scrapedData.captionOptions) {
        setCaptionOptions(scrapedData.captionOptions);
      }

      // --- STEP 2: Generate Content (Image or Video) --- 
      setProgressStep(1); // Move to the next step (data extraction / asset prep)
      
      if (outputType === 'image') {
        // --- Generate Image (Bannerbear) --- 
        console.log('[handleSubmit] Calling /api/process for Bannerbear generation.');
        setProgressStep(2); // Bannerbear: Generating Images step
        
        const processResponse = await fetch('/api/process', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session}`
          },
          body: JSON.stringify({ 
              scrapedData, 
              templateId: selectedTemplate, // Bannerbear Template Set UID
              listing_type: selectedListingType 
          })
        });

        const processResult = await processResponse.json();

        if (!processResponse.ok || !processResult.success) {
          console.error('[handleSubmit] Bannerbear Process API Error:', processResult);
          throw new Error(processResult.error || 'Failed to start image generation.');
        }
        
        console.log('[handleSubmit] Bannerbear generation initiated:', processResult.data);

        // --> ADDED: Refresh the history list immediately
        fetchProperties(); 

        // Set UID and Type for polling Bannerbear status
        setCurrentUid(processResult.data.bannerbear.uid);
        setCurrentType(processResult.data.bannerbear.type || 'collection');
        
        // Set initial results for modal display (pending status)
      setResults({
        bannerbear: {
             uid: processResult.data.bannerbear.uid,
           status: 'pending',
             type: processResult.data.bannerbear.type || 'collection' 
        },
        caption: initialCaption,
          captionOptions: scrapedData.captionOptions,
          templateId: selectedTemplate,
          propertyData: scrapedData // Pass full scraped data to results modal
        });
        // Note: Polling logic for Bannerbear is handled by the existing useEffect hook

      } else if (outputType === 'video') {
        // --- Generate Video (Shotstack) --- 
        console.log('[handleSubmit] Calling /api/shotstack/generate-video.');
        setProgressStep(2); // Shotstack: Generating Video step (adjust index if needed)

        const videoResponse = await fetch('/api/shotstack/generate-video', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session}` // Assuming this endpoint also needs auth
            },
            body: JSON.stringify({
                scrapedData, 
                listingType: selectedListingType, 
                templateId: selectedVideoTemplateId
            })
        });

        const videoResult = await videoResponse.json();

        if (!videoResponse.ok || !videoResult.success) {
            console.error('[handleSubmit] Shotstack Video API Error:', videoResult);
            throw new Error(videoResult.error || 'Failed to generate video.');
        }

        console.log('[handleSubmit] Video generation successful:', videoResult.videoUrl);
        setProgressStep(3); // Finalizing step
        
        // Normalize propertyData for VideoResultsModal
        const property = scrapedData.property || scrapedData.raw?.property || {};
        const propertyDataForModal = {
          ...scrapedData,
          property: {
            ...property,
            address: property.address || scrapedData.address || '',
            price: property.price || scrapedData.price || '',
            bedrooms: property.bedrooms || scrapedData.bedrooms || '',
            bathrooms: property.bathrooms || scrapedData.bathrooms || ''
          }
        };

        // Set results for the VideoResultsModal - Ensure all needed props are included
        setResults({
            type: 'video', // <-- Explicitly set type
            videoUrl: videoResult.videoUrl,
            caption: initialCaption, // Use caption from scrape
            captionOptions: scrapedData.captionOptions, // Pass options if available
            propertyData: propertyDataForModal // Use normalized propertyData
        });
        
        // --- ADDED: Refresh history list after successful video generation ---
        fetchProperties(); 

        // Video is generated synchronously (polling is done in the backend script)
        setIsLoading(false);
        setShowLoadingModal(false);
        setIsModalOpen(true); // Open the results modal immediately
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
      }

    } catch (error) {
      console.error(`[handleSubmit] Error during ${outputType} generation:`, error);
      setShowLoadingModal(false);
      setError({
        message: error.message || `An unexpected error occurred during ${outputType} generation`,
        details: error.stack || '',
        code: error.code
      });
      setIsLoading(false);
      setCurrentUid(null); // Ensure polling stops on error
      setCurrentType(null);
      setIsContentFreshlyGenerated(false);
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
      
      // Determine the result type and set state accordingly
      if (data.type === 'video' && data.videoUrl) {
          console.log('Setting results state for VIDEO type');
      setResults({
            type: 'video',
            propertyId: propertyId,
            videoUrl: data.videoUrl,
            caption: captionText,
            captionOptions: data.captionOptions || {},
            propertyData: {
              // Ensure property data is included for context (e.g., regenerate)
              ...(data.propertyData || {}), // Include the nested propertyData
              property: {
                ...(data.propertyData?.property || {}),
                // Add fallbacks from the history item itself if needed
                address: data.propertyData?.property?.address || property.address || '',
                price: data.propertyData?.property?.price || property.price || '',
                bedrooms: data.propertyData?.property?.bedrooms || property.bedrooms || '',
                bathrooms: data.propertyData?.property?.bathrooms || property.bathrooms || ''
              }
            }
          });
      } else {
          console.log('Setting results state for IMAGE type');
          setResults({
            type: 'image', // Explicitly set type
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
                ...(data.propertyData?.property || {}),
            address: data.propertyData?.property?.address || property.address || '',
            price: data.propertyData?.property?.price || property.price || '',
            bedrooms: data.propertyData?.property?.bedrooms || property.bedrooms || '',
            bathrooms: data.propertyData?.property?.bathrooms || property.bathrooms || ''
          }
        }
      });
      }
      
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
  
  // --- NEW HANDLER --- for video template selection
  const handleVideoTemplateSelect = (templateId) => {
    setSelectedVideoTemplateId(templateId);
    setTemplateSelectionError(null);
  };
  // --- END NEW HANDLER ---
  
  const handleCaptionEdit = (caption) => {
    setEditedCaption(caption);
  };

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
                      <span className="property-title truncated-text"> 
                        {property.address || "Property"}
                      </span>
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

          /* Add styles for text truncation */
          .truncated-text {
            display: block; /* Or inline-block */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 350px; /* Adjust as needed */
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

  // Add functions to handle video modal
  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  // --- START VIDEO PREVIEW MODAL FUNCTIONS --- 
  const openVideoPreviewModal = (url, e) => {
    if (e) e.stopPropagation(); // Prevent card selection
    setPreviewVideoUrl(url);
    setIsVideoPreviewModalOpen(true);
  };

  const closeVideoPreviewModal = () => {
    setIsVideoPreviewModalOpen(false);
    setPreviewVideoUrl(null); // Clear URL on close
  };
  // --- END VIDEO PREVIEW MODAL FUNCTIONS --- 

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
                <div className="title-container">
                  <h1 className="title">Scroll-stopping Designs</h1>
                  <FiPlayCircle 
                    onClick={openVideoModal} 
                    style={{ 
                      fontSize: '1.5rem',       // Match size
                      color: '#62d76b',       // Match color
                      cursor: 'pointer',
                      marginLeft: '0.75rem',    // Keep existing margin for spacing
                      transition: 'color 0.2s ease',
                      marginBottom: '4px'      // Match vertical alignment
                    }}
                    onMouseOver={e => e.currentTarget.style.color = '#56c15f'} // Match hover color
                    onMouseOut={e => e.currentTarget.style.color = '#62d76b'} // Match original color
                    title="Watch How-To Video" // Add tooltip like the other page
                  />
                </div>
                <p className="subtitle">Turn your property listings into scroll-stopping social media content in seconds.</p>
              </div>

              <Card>
                {/* Conditional Template Display */}
                {outputType === 'image' ? (
                <TemplateSelector 
                  selectedTemplate={selectedTemplate} 
                  onSelect={handleTemplateSelect} 
                  onSetsLoaded={handleSetsLoaded}
                  apiEndpoint="/api/list-listing-templates"
                  outputType={outputType}
                  onOutputTypeChange={(e) => {
                    setOutputType(e.target.value);
                    setSelectedTemplate(null);
                    setSelectedVideoTemplateId(null);
                    setTemplateSelectionError(null);
                  }}
                />
                ) : (
                  <div className="video-template-container">
                    <div className="template-header-with-output">
                      <h3>Video Template: <span className="select-label">Select a Video Template</span></h3>
                      <div className="header-right video-header-right">
                        <div className="dropdown-wrapper">
                          <div className="inline-output-selector">
                            <select 
                              id="output-type-video"
                              value={outputType}
                              onChange={(e) => {
                                setOutputType(e.target.value);
                                setSelectedTemplate(null);
                                setSelectedVideoTemplateId(null);
                                setTemplateSelectionError(null);
                              }}
                              className="output-type-dropdown inline"
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
                        <div className="navigation-controls">
                          <button 
                            className="nav-button prev" 
                            onClick={() => setVideoStartIndex(Math.max(0, videoStartIndex - 1))}
                            disabled={videoStartIndex === 0 || isVideoTemplateLoading || videoTemplates.length <= VIDEO_TEMPLATES_PER_PAGE}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                          </button>
                          <button 
                            className="nav-button next" 
                            onClick={() => setVideoStartIndex(Math.min(videoTemplates.length - VIDEO_TEMPLATES_PER_PAGE, videoStartIndex + 1))}
                            disabled={videoStartIndex >= videoTemplates.length - VIDEO_TEMPLATES_PER_PAGE || isVideoTemplateLoading || videoTemplates.length <= VIDEO_TEMPLATES_PER_PAGE}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                     {isVideoTemplateLoading && <p>Loading video templates...</p>}
                     {videoTemplateError && <p className="template-error-message">Error loading video templates: {videoTemplateError}</p>}
                    {!isVideoTemplateLoading && !videoTemplateError && (
                      <div className="video-template-grid">
                        {videoTemplates.slice(videoStartIndex, videoStartIndex + VIDEO_TEMPLATES_PER_PAGE).map((template) => (
                          <div 
                            key={template.id} 
                            className={`video-template-card ${selectedVideoTemplateId === template.id ? 'selected' : ''}`}
                            onClick={() => handleVideoTemplateSelect(template.id)}
                          >
                            <video 
                              src={template.previewUrl} 
                              width="100%" 
                              muted 
                              playsInline
                              loop 
                              preload="metadata"
                              onMouseOver={e => e.target.play().catch(err => console.warn("Video autoplay failed", err))} 
                              onMouseOut={e => e.target.pause()}
                              onError={(e) => console.error("Error loading video preview:", e)}
                              title={`Video Template ${template.id}`}
                              style={{ display: 'block', borderRadius: '4px 4px 0 0'}}
                            />
                            {/* --- START ZOOM ICON --- */} 
                            <div 
                              className="zoom-indicator video-zoom" 
                              onClick={(e) => openVideoPreviewModal(template.previewUrl, e)}
                              title="Preview Video"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                            </div>
                            {/* --- END ZOOM ICON --- */} 
                            <div className="video-template-info">
                                Template ID: {template.id.substring(0, 8)}...
                            </div>
                             {selectedVideoTemplateId === template.id && <div className="selected-indicator">✓</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* End Conditional Template Display */}
                
                <ListingTypeSelector
                  selectedType={selectedListingType}
                  onSelect={handleListingTypeSelect}
                />
                
                <PropertyURLForm 
                  onSubmit={handleSubmit} 
                  buttonText="Make it Happen"
                  placeholder="Paste a Rightmove, Zillow, OnTheMarket, or Realtor.com property URL"
                />
                
                {templateSelectionError && (
                  <p className="template-error-message">{templateSelectionError}</p>
                )}
              </Card>

              {/* --- CONDITIONAL LOADING MODAL --- */}
              {outputType === 'image' ? (
              <LoadingModal
                isOpen={showLoadingModal}
                onClose={closeLoadingModal}
                url={loadingUrl}
                currentStepIndex={progressStep}
                  // Pass caption state if needed by LoadingModal
                  // caption={generatedCaption} 
                  // captionOptions={captionOptions}
                  // onCaptionEdit={handleCaptionEdit}
                />
              ) : (
                <VideoLoadingModal
                  isOpen={showLoadingModal}
                  onClose={closeLoadingModal}
                  url={loadingUrl}
                  currentStepIndex={progressStep} 
                />
              )}
              {/* --- END CONDITIONAL LOADING MODAL --- */}

              {error && (
                <ErrorDisplay 
                  message={error.message} 
                  details={error.details} 
                  code={error.code}
                  onDismiss={() => setError(null)} 
                />
              )}

              {/* --- CONDITIONAL RESULTS MODAL --- */}
              {results && ( // Check if results exist before rendering
                results.type === 'video' ? ( // <-- Check results.type instead of outputType
                   <VideoResultsModal
                      isOpen={isModalOpen}
                      onClose={closeModal}
                      // Pass props needed by the refactored video modal
                      videoUrl={results?.videoUrl}
                      caption={results?.caption}
                      captionOptions={results?.captionOptions}
                      propertyData={results?.propertyData}
                    />
                 ) : ( 
              <ResultsModal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                    results={results} // Pass the image results object
              />
                )
              )}
             {/* --- END CONDITIONAL RESULTS MODAL --- */}
              
              {/* ... results summary (needs conditional logic too) ... */}
              {results && !isModalOpen && isContentFreshlyGenerated && (
                <div className="results-summary" onClick={() => setIsModalOpen(true)}>
                  <h3>
                    {outputType === 'image' 
                      ? (results.bannerbear?.status === 'completed' ? '✅ Generated images are ready!' : '⏳ Generation in progress...')
                      : (results.videoUrl ? '✅ Generated video is ready!' : '⏳ Generation in progress...')
                    }
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

        {/* Add the video modal */}
        <Modal isOpen={isVideoModalOpen} onClose={closeVideoModal} title="Watch How It Works">
          <div style={{ 
            padding: 0, 
            margin: '-1.5rem', // Adjust margin to remove default padding effect
            overflow: 'hidden',
            borderRadius: '0 0 12px 12px' // Ensure bottom corners are rounded if modal has rounded top
          }}>
            <div style={{ 
              position: 'relative', 
              paddingBottom: '56.25%', // 16:9 aspect ratio
              height: 0, 
              overflow: 'hidden', 
              maxWidth: '100%', 
              background: '#000' // Background for loading/letterboxing
            }}>
              <iframe 
                src="https://player.vimeo.com/video/1039549847?autoplay=1" // Use the Vimeo URL
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%' 
                }} 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
                title="Trofai Dashboard Tutorial" // Update title
              ></iframe>
            </div>
          </div>
        </Modal>

        {/* --- START VIDEO PREVIEW MODAL --- */} 
        {isVideoPreviewModalOpen && previewVideoUrl && (
          <Modal 
            isOpen={isVideoPreviewModalOpen} 
            onClose={closeVideoPreviewModal} 
            title="Video Preview" // Title kept for accessibility but header will be hidden by CSS
            containerClassName="video-preview-modal-size video-preview-no-chrome" // Added new class
          >
            {/* New Close Button */} 
            <button 
              className="video-preview-close-button" 
              onClick={closeVideoPreviewModal}
              aria-label="Close video preview"
            >
              ×
            </button>
             <div className="video-preview-modal-content">
                <video 
                    src={previewVideoUrl}
                    controls 
                    autoPlay
                    muted // Start muted to avoid abrupt sound
                    loop
                    playsInline
                    className="preview-video-player"
                    onError={(e) => console.error("Error loading video in modal:", e)}
                />
             </div>
          </Modal>
        )}
        {/* --- END VIDEO PREVIEW MODAL --- */} 

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
          
          .title-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem; /* Adjust spacing below title+icon */
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

          /* --- NEW STYLES --- */
          .video-template-container {
            margin-bottom: 1.5rem; /* Match spacing */
          }
          
          .video-template-container h3 {
              font-size: 1.125rem;
              font-weight: 600;
              color: #374151; /* Match other titles */
              margin-bottom: 1rem;
          }
          
          .select-label {
            color: #62d76b; /* Match styling */
            font-weight: 500;
            margin-left: 0.5rem;
          }
          
          .video-template-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* Changed from auto-fill to fixed 4 columns */
            gap: 1rem;
          }
          
          .video-template-card {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: border-color 0.2s, box-shadow 0.2s;
            overflow: hidden;
            position: relative;
            background-color: #f8fafc;
          }
          
          .video-template-card:hover {
            border-color: #cbd5e0;
          }
          
          .video-template-card.selected {
            border-color: #62d76b;
            box-shadow: 0 0 0 3px rgba(98, 215, 107, 0.4);
          }

          .video-template-info {
            padding: 0.75rem;
            font-size: 0.8rem;
            color: #4a5568;
            background-color: #fff;
            border-top: 1px solid #e2e8f0;
          }
          
          .selected-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            background-color: #62d76b;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: bold;
          }
          
          .template-error-message {
            color: #e53e3e; 
            margin-top: 0.5rem;
            font-size: 0.9rem;
          }
          /* --- END NEW STYLES --- */

          /* Style for the header containing the dropdown */
          .template-header-with-output {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem; /* Match original h3 margin */
          }
          
          .template-header-with-output h3 {
            margin: 0; /* Remove default margin from h3 */
          }

          /* Copied styles for inline dropdown */
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

          .dropdown-wrapper {
            position: relative;
            display: flex;
            align-items: center;
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

          /* --- START VIDEO TEMPLATE NAV STYLES --- */
          .header-right.video-header-right {
              display: flex;
              align-items: center;
              gap: 1rem; /* Adjust gap as needed */
          }
          
          .navigation-controls {
            display: flex;
            gap: 0.5rem; /* Spacing between buttons */
          }

          .nav-button {
            background-color: #fff;
            border: 1px solid #e2e8f0; /* Match dropdown border */
            border-radius: 6px;
            padding: 0.4rem; /* Adjust padding */
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4a5568; /* Icon color */
            transition: all 0.2s ease;
          }

          .nav-button:hover:not(:disabled) {
            background-color: #f8fafc;
            border-color: #cbd5e0;
            color: #1f2937;
          }

          .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          /* --- END VIDEO TEMPLATE NAV STYLES --- */

          /* --- START ZOOM ICON STYLES --- */
          .zoom-indicator.video-zoom {
            position: absolute;
            bottom: calc(0.75rem + 24px + 8px); /* Position above the info bar */
            right: 8px;
            background-color: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            z-index: 10; /* Ensure it's above the video */
          }

          .video-template-card:hover .zoom-indicator.video-zoom {
            opacity: 1;
          }
          /* --- END ZOOM ICON STYLES --- */
          
          /* --- START VIDEO PREVIEW MODAL STYLES --- */
          .video-preview-modal-content { /* Adjust existing styles */
            position: relative; /* This already has relative positioning */
            width: 100%;
            max-width: 360px; /* Adjust max-width as desired for portrait view */
            margin: 0 auto !important; /* Changed from -1.5rem auto */
            padding-bottom: calc(360px * 16 / 9); /* 9:16 Aspect Ratio based on max-width */
            max-height: calc(85vh - 4rem); /* Limit height based on viewport, accounting for modal padding/title */
            height: 0; /* Required for padding-bottom aspect ratio trick */
           /* overflow: hidden; */ /* REMOVED this line */
            border-radius: 12px !important; /* Keep radius on the content wrapper */
            background-color: #000; 
          }

          .preview-video-player {
            position: absolute; /* Position within the container */
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            /* max-height: 75vh; <-- Remove this */
            object-fit: contain; 
            border-radius: 12px; /* Match container rounding */
          }
          /* --- END VIDEO PREVIEW MODAL STYLES --- */
          
          /* --- START MODAL SIZE OVERRIDE --- */
          :global(.modal-container.video-preview-modal-size) { 
            max-width: 420px !important; /* Increased slightly from 360px + padding/borders, adjust as needed */
            /* width: auto !important; */ /* Optionally allow width to shrink */
          }
          /* --- END MODAL SIZE OVERRIDE --- */
          
          /* --- START NO CHROME MODAL STYLES --- */
          :global(.modal-container.video-preview-no-chrome) { 
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important; /* Allow close button overflow if needed */
            max-height: none !important; /* Remove max-height if set by default */
          }
          :global(.modal-container.video-preview-no-chrome .modal-header) {
             display: none !important; 
          }
          :global(.modal-container.video-preview-no-chrome .modal-content) {
             padding: 0 !important; 
             overflow: visible !important; /* Allow potential overflow */
             position: relative !important; /* Ensure this is the positioning context */
          }
          .video-preview-modal-content { /* Adjust existing styles */
            margin: 0 auto !important; /* Remove negative margin */
            border-radius: 12px !important; /* Keep radius on the content wrapper */
            /* max-width, padding-bottom, height, etc remain for aspect ratio */
          }
          .preview-video-player {
            border-radius: 12px !important; /* Keep radius on video */
          }
          .video-preview-close-button {
            position: absolute;
            top: -15px; /* Position above the video */
            right: -15px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            font-size: 24px;
            font-weight: bold;
            line-height: 30px;
            text-align: center;
            cursor: pointer;
            z-index: 1001; /* Above modal overlay */
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
          }
          .video-preview-close-button:hover {
            background: white;
            transform: scale(1.1);
          }
          /* --- END NO CHROME MODAL STYLES --- */
          
        `}</style>

        {/* The global style block should remain as it was */}
        <style jsx global>{`
           body {\n             margin: 0;\n             padding: 0;\n             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n             background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);\n           }\n\n           * {\n             box-sizing: border-box;\n           }\n           /* ... other global styles ... */\n        `}</style>
      </div>
    </ProtectedRoute>
  );
}