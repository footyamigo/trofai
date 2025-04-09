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
import Head from 'next/head';
import Sidebar from '../../components/Layout/Sidebar';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import MobileMenu from '../../components/Layout/MobileMenu';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';

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
  const [selectedTemplate, setSelectedTemplate] = useState('5AaLxyr4P8xrP8bDRG'); // Default to template set 1
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [captionOptions, setCaptionOptions] = useState(null);
  const [initializeAttempts, setInitializeAttempts] = useState(0);
  const [properties, setProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [viewingProperty, setViewingProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const pollIntervalRef = useRef(null);

  const [history, setHistory] = useState([]);

  // Add a state to track which dropdown menu is open
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Toggle dropdown menu
  const toggleDropdown = (propertyId) => {
    if (activeDropdown === propertyId) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(propertyId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
          // Set the final step before completion
          setProgressStep(3);
          
          // Small delay to show the final step before completion
          setTimeout(async () => {
            console.log('Processing completed!');
            setShowLoadingModal(false);
            
            // Use the edited caption if available, otherwise use the original
            const finalCaption = editedCaption || generatedCaption;
            
            // Add the new property to the existing properties list
            const newProperty = {
              ...data,
              caption: finalCaption,
              captionOptions: captionOptions
            };
            setProperties(prevProperties => [newProperty, ...prevProperties]);
            
            setResults({
              bannerbear: data,
              caption: finalCaption || "Caption generated earlier",
              captionOptions: captionOptions
            });
            setIsLoading(false);
            setCurrentUid(null);
            setCurrentType(null);
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            
            // Open the modal automatically when processing completes
            setIsModalOpen(true);
          }, 1000);
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
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
      
    setResults(null);
    setError(null);
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
            templateId: selectedTemplate 
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
    }
  };

  const handleViewHistoryItem = async (property) => {
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No session found');
      }

      console.log('Viewing property:', property.id);

      // Fetch the property content
      const response = await fetch(`/api/properties/content?propertyId=${property.id}`, {
        headers: {
          'Authorization': `Bearer ${session}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch property content');
      }

      const { data } = await response.json();
      console.log('Property content response:', data);
      
      // Extract caption from all possible locations
      const captionFromPropertyData = data.propertyData && data.propertyData.caption;
      const mainCaption = data.caption || captionFromPropertyData || '';
      const altCaption = data.altCaption || data.alternativeCaption || '';
      
      // Format the data to match ResultsModal expected structure
      const resultsData = {
        bannerbear: {
          status: data.status || 'completed',
          images: data.images || [],
          image_urls: data.bannerbear?.image_urls || {},
          zip_url: data.bannerbear?.zip_url,
          ...data.bannerbear
        },
        caption: mainCaption,
        captionOptions: data.captionOptions || { 
          main: mainCaption,
          alternative: altCaption
        },
        propertyData: data.propertyData || {}
      };
      
      // Set the formatted data to viewingProperty and open ResultsModal
      setViewingProperty(resultsData);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error viewing property:', error);
      setError({
        message: 'Failed to load property content',
        details: error.message
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const closeLoadingModal = () => {
    // We might want to prevent closing the loading modal while processing
    if (!isLoading) {
      setShowLoadingModal(false);
    }
  };
  
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };
  
  const handleCaptionEdit = (caption) => {
    setEditedCaption(caption);
  };

  // Fetch properties when component mounts
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const session = localStorage.getItem('session');
        if (!session) {
          console.error('No session found');
          return;
        }

        const response = await fetch('/api/properties/list', {
          headers: {
            'Authorization': `Bearer ${session}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const data = await response.json();
        setProperties(data.properties);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  // First, let's add a new function to handle property deletion
  const handleDeleteProperty = async (propertyId) => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }
    
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No session found');
      }

      const response = await fetch(`/api/properties/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`
        },
        body: JSON.stringify({ propertyId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete property');
      }

      // Remove the deleted property from the local state
      setProperties(prevProperties => prevProperties.filter(prop => prop.id !== propertyId));
      
      // Show success message
      alert('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      setError({
        message: 'Failed to delete property',
        details: error.message
      });
    }
  };

  // Now, let's update the renderHistory function to include a delete button
  const renderHistory = () => {
    if (isLoadingProperties) {
      return <div className="text-center py-4">Loading property history...</div>;
    }

    if (properties.length === 0) {
      return <div className="text-center py-4">No properties converted yet.</div>;
    }

    return (
      <div className="history-section">
        <h2 className="history-title">History</h2>
        <div className="history-list">
          {properties.map((property) => (
            <div key={property.id} className="history-item">
              <div className="item-header">
                <h3 className="property-title">{property.address}</h3>
                <div className="menu-container">
                  <button 
                    className="menu-button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event from bubbling up
                      toggleDropdown(property.id);
                    }}
                  >
                    ⋮
                  </button>
                  {activeDropdown === property.id && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item delete-item"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent event from bubbling up
                          handleDeleteProperty(property.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="property-price">{property.price}</p>
              <p className="property-date">
                Generated on {new Date(property.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleViewHistoryItem(property)}
                className="view-button"
              >
                View
              </button>
            </div>
          ))}
        </div>
        <style jsx>{`
          .history-section {
            margin-top: 2rem;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .history-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 1.5rem;
          }

          .history-list {
            display: flex;
            gap: 1.5rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }

          .history-list::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }

          .history-item {
            flex: 0 0 auto;
            width: 300px;
            padding: 1.25rem;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            transition: transform 0.2s ease;
            position: relative;
          }

          .history-item:hover {
            transform: translateY(-2px);
          }

          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
          }

          .property-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a1a1a;
            margin: 0;
            flex: 1;
            padding-right: 10px;
          }

          .menu-container {
            position: relative;
          }

          .menu-button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.25rem;
            font-weight: bold;
            color: #6b7280;
            padding: 0.25rem;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 4px;
          }

          .menu-button:hover {
            background: #edf2f7;
            color: #4a5568;
          }

          .dropdown-menu {
            position: absolute;
            right: 0;
            top: 100%;
            background: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10;
            width: 120px;
            overflow: hidden;
          }

          .dropdown-item {
            padding: 0.75rem 1rem;
            text-align: left;
            width: 100%;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background 0.2s;
          }

          .delete-item {
            color: #e53e3e;
          }

          .delete-item:hover {
            background: #fee2e2;
          }

          .property-price {
            font-size: 1rem;
            color: #2d3748;
            margin: 0 0 0.5rem 0;
          }

          .property-date {
            font-size: 0.875rem;
            color: #718096;
            margin: 0 0 1rem 0;
          }

          .view-button {
            width: 100%;
            padding: 0.75rem;
            background: #62d76b;
            color: #1a1a1a;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border-radius: 6px;
            border: 2px solid #1a1a1a;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          }

          .view-button:hover {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            .history-section {
              padding: 1rem;
            }
            
            .history-list {
              gap: 1rem;
            }
            
            .history-item {
              width: 280px;
            }
          }
        `}</style>
      </div>
    );
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingProperty(null);
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
          <title>Make Your Listings Shine Online - Trofai</title>
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
                <h1 className="title">Make Your Listings Shine Online</h1>
                <p className="subtitle">Turn your property listings into scroll-stopping social media content in seconds.</p>
              </div>

              <Card>
                <TemplateSelector 
                  selectedTemplate={selectedTemplate} 
                  onSelect={handleTemplateSelect} 
                />
                
                <PropertyURLForm 
                  onSubmit={handleSubmit} 
                  buttonText="Make it Happen"
                  placeholder="Paste a Rightmove or Zillow property URL"
                />
              </Card>

              {/* Loading modal for processing steps */}
              <LoadingModal
                isOpen={showLoadingModal}
                onClose={closeLoadingModal}
                url={loadingUrl}
                currentStep={progressStep}
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

              {/* Use ResultsModal for viewing saved properties */}
              <ResultsModal
                isOpen={isViewModalOpen}
                onClose={closeViewModal}
                results={viewingProperty}
              />
              
              {/* Keep the traditional results display but make it less prominent */}
              {results && !isModalOpen && (
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
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 