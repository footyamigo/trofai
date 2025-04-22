import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Layout/Sidebar';
import MobileMenu from '../components/Layout/MobileMenu';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ProtectedRoute from '../src/components/ProtectedRoute';
import Button from '../components/UI/Button';
import TemplateSelector from '../components/UI/TemplateSelector';
import TestimonialResultsModal from '../components/Testimonial/TestimonialResultsModal';
import TestimonialLoadingModal from '../components/Testimonial/TestimonialLoadingModal';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import { toast, Toaster } from 'react-hot-toast';
import { format } from 'date-fns'; // For formatting timestamp
import { FiZap, FiRefreshCw, FiPlayCircle, FiEye, FiTrash2, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Modal from '../components/UI/Modal'; // Added for video modal

// Define steps for the LoadingModal specific to this flow
const REVIEW_LOADING_STEPS = [
  { key: 'extracting', label: 'Extracting Review Text', icon: '✍️', description: 'Analyzing image to find reviewer and text' },
  { key: 'generating', label: 'Generating Testimonial Images', icon: '🖼️', description: 'Creating designs using Bannerbear' },
];

export default function ReviewGenerator() {
  const [selectedTemplateSetId, setSelectedTemplateSetId] = useState(null); 
  const [templateSelectionError, setTemplateSelectionError] = useState(null); 
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // State for Loading Modal
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  const [loadingError, setLoadingError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // Added for confirm button loading state
  const [extractedReviewData, setExtractedReviewData] = useState(null); // To hold extracted data for modal
  const [editedReviewText, setEditedReviewText] = useState(''); // <<< Added state for edited text
  const [editedReviewerName, setEditedReviewerName] = useState(''); // <<< Added state for editable name

  // State for Results Modal
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [finalResults, setFinalResults] = useState(null); 

  // Text Input Flow State
  const [pastedReviewerName, setPastedReviewerName] = useState('');
  const [pastedReviewText, setPastedReviewText] = useState('');

  // State to control text input visibility
  const [showTextInput, setShowTextInput] = useState(false); 

  // Renamed Upload Flow State
  const [isExtractingText, setIsExtractingText] = useState(false); // <<< Renamed state
  const [errorExtract, setErrorExtract] = useState(null); 

  // --- Add Review History State ---
  const [reviewHistory, setReviewHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyToView, setHistoryToView] = useState(null); // For viewing details in results modal
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [visibleReviews, setVisibleReviews] = useState(20); // Show 20 items initially
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [isLoadingModalContent, setIsLoadingModalContent] = useState(false);
  const [modalError, setModalError] = useState(null);
  // --- End Review History State ---

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Determine input mode
  const isUploadMode = !!selectedFile;
  // Adjust isTextMode based on visibility as well?
  // Let's keep it simple: disable upload if text form is *shown* and has content
  const isTextModeActive = showTextInput && (!!pastedReviewText || !!pastedReviewerName);

  // --- Add Effect to Fetch Review History ---
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setHistoryError(null);
      try {
        const sessionToken = localStorage.getItem('session');
        if (!sessionToken) {
          console.warn('No session found, cannot fetch review history.');
          setIsLoadingHistory(false);
          return;
        }

        const response = await fetch('/api/reviews/fetch-history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch review history.');
        }

        setReviewHistory(data.history || []);
      } catch (error) {
        console.error("Error fetching review history:", error);
        setHistoryError(error.message);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []); // Empty dependency array means this runs once on mount
  // --- End Fetch History Effect ---

  const handleTemplateSelect = (templateId) => {
      setSelectedTemplateSetId(templateId);
      setTemplateSelectionError(null); 
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPastedReviewerName(''); 
      setPastedReviewText('');
      setShowTextInput(false); // <<< Hide text input on file select
      setTemplateSelectionError(null); 
      setErrorExtract(null);
      setShowLoadingModal(false); 
      setShowResultsModal(false);
      setExtractedReviewData(null);
      setEditedReviewText(''); 
      setEditedReviewerName(''); 
      setFinalResults(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setTemplateSelectionError("Please select a valid image file (PNG, JPG, etc.).");
    }
  };

  const handlePastedNameChange = (e) => {
      setPastedReviewerName(e.target.value);
      // No need to clear file here, handled by button disabling
  };
  const handlePastedTextChange = (e) => {
       setPastedReviewText(e.target.value);
       // No need to clear file here, handled by button disabling
  };

  const toggleTextInput = () => {
      setShowTextInput(prev => !prev);
      if (!showTextInput) { // If we are *showing* the text input
          setSelectedFile(null); // Clear any selected file
          setPreviewUrl(null);
          setLoadingError(null);
      } else { // If we are *hiding* the text input
           setPastedReviewerName(''); // Clear pasted text
           setPastedReviewText('');
      }
  }

  // Updated handler: Only extracts text and opens the PREVIEW modal
  const handleExtractReview = async () => {
    if (!selectedTemplateSetId) { 
        toast.error("Please select a template set first.");
        setTemplateSelectionError("Please select a template set first.");
        return; 
    }
    if (!selectedFile || isTextModeActive) {
        setTemplateSelectionError("Please upload a review screenshot first."); 
        return;
    }

    setTemplateSelectionError(null); 
    setLoadingError(null);
    setExtractedReviewData(null); 
    setEditedReviewText(''); 
    setEditedReviewerName(''); 
    setShowLoadingModal(true);
    setCurrentLoadingStep(0); 
    setShowResultsModal(false);
    setFinalResults(null);
    setIsGenerating(false); 
    setIsExtractingText(true); 

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      console.log("Requesting text extraction...");
      const extractResponse = await fetch('/api/extract-review', {
        method: 'POST',
        body: formData,
      });
      const extractResult = await extractResponse.json();
      
      if (!extractResponse.ok || !extractResult.success) {
        throw new Error(extractResult.message || 'Failed to extract review data.');
      }
      if (!extractResult.data || !extractResult.data.reviewText) {
          throw new Error('Extraction succeeded but no review text was found.');
      }

      console.log("Extraction successful, updating preview data:", extractResult.data);
      // Set extracted data AND initialize edited states
      const reviewName = extractResult.data.reviewerName || ''; // Handle potential null
      const reviewText = extractResult.data.reviewText;
      setExtractedReviewData({ reviewerName: reviewName, reviewText: reviewText }); // Store original
      setEditedReviewerName(reviewName); // <<< Initialize editable name
      setEditedReviewText(reviewText); // Initialize editable text

    } catch (err) {
      console.error("Extraction error:", err);
      setLoadingError(`Extraction Failed: ${err.message}`);
      toast.error(`Extraction Failed: ${err.message}`);
    } finally {
      setIsExtractingText(false); 
    }
  };

  // Handles NAME changes from the modal
  const handleReviewerNameChange = (newName) => {
      setEditedReviewerName(newName);
  };

  // Handles TEXT changes from the modal
  const handleReviewTextChange = (newText) => {
      setEditedReviewText(newText);
  };

  // Called from LoadingModal to start generation
  const handleConfirmAndGenerate = async (nameToUse, textToUse) => {
    if (!textToUse) {
        setLoadingError("Cannot generate images, review text is empty.");
        return;
    }
    if (!selectedTemplateSetId) {
        setLoadingError("Cannot generate images, template set ID is missing.");
        return;
    }

    console.log(`Starting generation with Name: ${nameToUse}, Text: ${textToUse.substring(0,30)}..., Template: ${selectedTemplateSetId}`);
    setIsGenerating(true); 
    setLoadingError(null);
    setCurrentLoadingStep(1); // Ensure modal shows "Generating Images"
    if (!showLoadingModal) setShowLoadingModal(true); // Open loading modal if not already open (for text flow)

    let bannerData = null;
    let generatedCaption = null;
    let historyItemToSave = null;

    // --- Generate Bannerbear --- 
    try {
        console.log("Step 1 (Modal Step 2): Generating Bannerbear images...");
        const bannerResponse = await fetch('/api/generate-review-banner', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('session')}` 
            },
            body: JSON.stringify({
              reviewerName: nameToUse, 
              reviewText: textToUse, 
              templateSetId: selectedTemplateSetId 
            }),
          });
          const bannerResult = await bannerResponse.json();
          if (!bannerResponse.ok || !bannerResult.success) throw new Error(bannerResult.message || 'Failed to generate banner image.');
          console.log("Step 1 Success: Bannerbear response:", bannerResult.bannerbearResponse);
          bannerData = bannerResult.bannerbearResponse; // Store banner data
    
    } catch (err) {
        console.error("Banner generation error:", err);
        setLoadingError(`Image Generation Failed: ${err.message}`);
        setIsGenerating(false); 
        return; 
    }

    // --- Generate Caption --- 
    try {
        setCurrentLoadingStep(2); // Advance modal to "Creating Caption" step
        console.log("Step 2 (Modal Step 3): Generating caption...");
        const captionResponse = await fetch('/api/generate-testimonial-caption', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('session')}` 
            },
            body: JSON.stringify({
              reviewerName: nameToUse, 
              reviewText: textToUse
            }),
          });
        const captionResult = await captionResponse.json();
        if (!captionResponse.ok || !captionResult.success) throw new Error(captionResult.message || 'Failed to generate caption.');
        console.log("Step 2 Success: Generated caption:", captionResult.caption);
        generatedCaption = captionResult.caption;

    } catch (err) {
         console.error("Caption generation error:", err);
         setLoadingError(`Caption Generation Failed: ${err.message}. Proceeding without generated caption.`);
         // Use fallback caption (original text)
         generatedCaption = textToUse; 
    }
    
    // --- Prepare History Item --- 
    try {
      historyItemToSave = {
        reviewerName: nameToUse,
        reviewText: textToUse,
        timestamp: new Date().toISOString(), // Generate timestamp here
        templateSetId: selectedTemplateSetId,
        imageUrl: bannerData?.images?.[0]?.image_url_png || bannerData?.images?.[0]?.image_url || null,
        collectionUid: bannerData?.uid,
        caption: generatedCaption // Use the actual generated (or fallback) caption
      };
      console.log("Prepared history item:", historyItemToSave);
    } catch (err) {
      console.error("Error preparing history item:", err);
      toast.error("Internal error preparing data for history.");
      // Don't stop, proceed to show results but history might not save
    }

    // --- Save to History via API --- 
    if (historyItemToSave) {
      try {
        console.log("Step 3: Saving to history via API...");
        const saveResponse = await fetch('/api/reviews/save-history-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('session')}`
          },
          body: JSON.stringify(historyItemToSave) // Send the complete item
        });
        const saveResult = await saveResponse.json();
        if (!saveResponse.ok || !saveResult.success) {
          throw new Error(saveResult.message || 'Failed to save item to history.');
        }
        console.log("Step 3 Success: Saved to history.");
        // Add to local state only AFTER successful save
        setReviewHistory(prevHistory => [historyItemToSave, ...prevHistory]); 
      } catch (err) {
        console.error("Error saving history item via API:", err);
        toast.error(`Failed to save to history: ${err.message}`);
        // Still proceed to show results modal
      }
    }
    
    // Store results for the results modal
    const finalResultsData = {
        bannerbear: bannerData, 
        caption: generatedCaption 
    };
        
    // --- Open Results Modal --- 
    setFinalResults(finalResultsData);
    setShowLoadingModal(false); 
    setShowResultsModal(true); 
    setIsGenerating(false); // Final generation process complete
  };

  // --- Text Input Flow: handleGenerateFromText (Calls the shared generation logic directly) ---
  const handleGenerateFromText = () => {
      if (!selectedTemplateSetId) {
           toast.error("Please select a template set first.");
           setTemplateSelectionError("Please select a template set first.");
           return;
      }
      if (!pastedReviewText) {
          toast.error("Please enter the review text.");
          return;
      }
      // Call the shared generation logic, passing the pasted values
      handleConfirmAndGenerate(pastedReviewerName, pastedReviewText);
  }

  const closeLoadingModal = () => {
      setShowLoadingModal(false);
      setLoadingError(null);
      setExtractedReviewData(null);
      setIsGenerating(false);
  }

   const closeResultsModal = () => {
      setShowResultsModal(false);
      setFinalResults(null);
  }

  // --- Add History Item Handlers ---
  const handleViewHistoryItem = async (item) => {
    console.log("Viewing history item:", JSON.stringify(item, null, 2)); // Log the full item
    // Check for collectionUid AND the stored caption
    if (!item.collectionUid) { 
      toast.error('Cannot view history item: Missing collection identifier.');
      return;
    }
    
    // Log if caption seems missing or is the same as reviewText
    if (!item.caption) {
        console.warn("History item is missing caption. Item:", item);
    } else if (item.caption === item.reviewText) {
        console.warn("History item caption is the same as reviewText. Was caption generation skipped or failed? Item:", item);
    }

    console.log("Fetching Bannerbear data for history item:", item.collectionUid);
    setIsLoadingModalContent(true); 
    setModalError(null);
    setHistoryToView(null); 
    setShowResultsModal(true); 
    
    try {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) throw new Error('Authentication session not found.');

      // Fetch the Bannerbear collection data
      const response = await fetch(`/api/reviews/fetch-history-item?collectionUid=${item.collectionUid}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to fetch history item details (Status: ${response.status})`);
      }
      
      const fullBannerbearData = data.bannerbearCollection;

      // Construct the results object using fetched BB data and STORED caption (with fallback)
      const resultsForModal = {
        bannerbear: fullBannerbearData, 
        caption: item.caption || item.reviewText || 'Caption not found' // Use caption, fallback explicitly
      };
      console.log("Prepared results for modal:", JSON.stringify(resultsForModal, null, 2)); // Log what's being sent

      setHistoryToView(resultsForModal); // Set the complete data for the modal

    } catch (error) {
      console.error("Error fetching history item details:", error);
      setModalError(error.message || 'Could not load the details for this item.');
    } finally {
      setIsLoadingModalContent(false); // Stop loading indicator
    }
  };
  
  // Override the close handler for the results modal if opened from history
  const handleCloseResultsModalFromHistory = () => {
    setShowResultsModal(false);
    setHistoryToView(null); // Clear the viewed history item
    setIsLoadingModalContent(false); // Reset loading state
    setModalError(null); // Reset error state
  };

  // Handlers for bulk selection
  const handleSelectReviewItem = (timestamp, isSelected) => {
    if (isSelected) {
      setSelectedReviews(prev => [...prev, timestamp]);
    } else {
      setSelectedReviews(prev => prev.filter(t => t !== timestamp));
    }
  };

  const handleSelectAllReviews = (isSelected) => {
    if (isSelected) {
      const visibleReviewIds = reviewHistory
        .slice(0, visibleReviews)
        .map(item => item.timestamp)
        .filter(Boolean);
      setSelectedReviews(visibleReviewIds);
    } else {
      setSelectedReviews([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedReviews.length === 0) return;
    setIsBulkDelete(true);
    setIsDeleteConfirmationOpen(true);
  };

  const loadMoreReviews = () => setVisibleReviews(v => v + 20);

  // Delete handlers
  const handleDeleteHistoryItem = async (timestamp, e) => {
    if (e) e.stopPropagation();
    setReviewToDelete(timestamp);
    setIsDeleteConfirmationOpen(true);
    setIsBulkDelete(false);
  };
  
  const confirmDeleteHistoryItem = async () => {
    const reviewsToDelete = isBulkDelete ? selectedReviews : [reviewToDelete];
    if (!reviewsToDelete.length) return;
    
    try {
      setIsDeletingReview(true);
      
      // Process each review deletion
      for (const timestamp of reviewsToDelete) {
        // Call the API to delete the history item
        const response = await fetch(`/api/reviews/delete-history-item?timestamp=${timestamp}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('session')}`
          }
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to delete history item');
        }
      }
      
      // Update local state after successful deletion
      setReviewHistory(prevHistory => prevHistory.filter(item => !reviewsToDelete.includes(item.timestamp)));
      
      toast.success(isBulkDelete 
        ? `Successfully deleted ${reviewsToDelete.length} reviews` 
        : 'Review deleted successfully');
      
      // Reset states
      setIsDeleteConfirmationOpen(false);
      setReviewToDelete(null);
      setSelectedReviews([]); 
      setIsBulkDelete(false);
    } catch (error) {
      console.error('Error deleting history item(s):', error);
      toast.error(error.message || 'Failed to delete review(s)');
    } finally {
      setIsDeletingReview(false);
    }
  };
  
  const cancelDeleteHistoryItem = () => {
    setIsDeleteConfirmationOpen(false);
    setReviewToDelete(null);
    setIsBulkDelete(false);
  };
  // --- End History Item Handlers ---

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Toaster position="bottom-center" />
        <Head>
          <title>Review Screenshot Generator - Trofai</title>
        </Head>
        <MobileMenu activePage="review-generator" />
        <Sidebar activePage="review-generator" />
        <div className="dashboard-container">
           <DashboardHeader /> 
          <main className="main">
            <div className="content">
              <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <h1 className="title" style={{ marginBottom: 0 }}>Review Screenshot Generator</h1>
                  <FiPlayCircle 
                    onClick={openVideoModal}
                    style={{ 
                      fontSize: '1.5rem', 
                      color: '#62d76b', 
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      marginBottom: '4px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#56c15f'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#62d76b'}
                    title="Watch How-To Video"
                  />
                </div>
                <p className="subtitle">Select a template, then upload a screenshot or paste the review text.</p>
              </div>

              <div className="card-container">
              <div className="template-selector-section card">
                 <TemplateSelector 
                    selectedTemplate={selectedTemplateSetId} 
                    onSelect={handleTemplateSelect} 
                    apiEndpoint="/api/list-testimonial-templates" 
                 />
                 {templateSelectionError && <div className="error-message" style={{marginTop: '1rem'}}>{templateSelectionError}</div>}
              </div>

              <div className="upload-section card">
                   {!showTextInput ? (
                     <>
                 <label 
                   htmlFor="review-screenshot-upload" 
                         className="upload-label"
                 >
                   {previewUrl ? 'Change Screenshot' : 'Upload Review Screenshot'}
                 </label>
                 <input 
                   id="review-screenshot-upload"
                   type="file"
                   accept="image/*"
                   onChange={handleFileChange}
                   style={{ display: 'none' }} 
                 />
                       {previewUrl && (
                   <div className="image-preview">
                     <img src={previewUrl} alt="Review preview" />
                   </div>
                 )}
                       {selectedFile && (
                   <Button 
                     onClick={handleExtractReview} 
                     isLoading={isExtractingText}
                     disabled={isExtractingText || showLoadingModal}
                     style={{ marginTop: '1.5rem' }}
                   >
                     {isExtractingText ? 'Extracting Text...' : 'Extract Review Text'}
                   </Button>
                 )}
                     </>
                   ) : (
                     <>
                      <div className="input-group">
                          <label htmlFor="pastedReviewerName">Reviewer Name (Optional)</label>
                          <input 
                              type="text"
                              id="pastedReviewerName"
                              value={pastedReviewerName}
                              onChange={handlePastedNameChange}
                              placeholder="Enter reviewer's name"
                              disabled={showLoadingModal}
                          />
                      </div>
                       <div className="input-group">
                          <label htmlFor="pastedReviewText">Paste Review Text</label>
                          <textarea 
                              id="pastedReviewText"
                              value={pastedReviewText}
                              onChange={handlePastedTextChange}
                              placeholder="Paste the full review text here..."
                              rows={6} 
                              disabled={showLoadingModal}
                          />
                      </div>
                      <Button 
                          onClick={handleGenerateFromText} 
                         disabled={!pastedReviewText || showLoadingModal}
                         style={{ marginTop: '1rem' }}
                      >
                          Generate from Text
                      </Button>
                     </>
                   )}
                   
                   {/* --- "Or Paste Review" / "Use Upload" Trigger --- */}
                   <div className="paste-trigger-container">
                     <button onClick={toggleTextInput} className="paste-trigger-button">
                       {showTextInput ? 'Use Screenshot Upload Instead' : 'Or paste review text'}
                     </button>
                  </div>
                   
                   {/* Show extraction error here */}
                   {!showLoadingModal && errorExtract && <div className="error-message">Error: {errorExtract}</div>} 
                </div>
              </div>

              {/* --- Review History Section --- */}
              <div className="history-section">
                <div className="history-header">
                  <h2 className="history-title">History</h2>
                  {selectedReviews.length > 0 && (
                    <button
                      className={`bulk-delete-button ${isDeletingReview ? 'loading' : ''}`}
                      onClick={handleBulkDelete}
                      disabled={isDeletingReview}
                    >
                      {isDeletingReview && isBulkDelete ? (
                        <>
                          <span className="delete-spinner"></span>
                          Deleting...
                        </>
                      ) : (
                        <>Delete Selected ({selectedReviews.length})</>
                      )}
                    </button>
                  )}
                </div>
                
                {isLoadingHistory && (
                  <div className="loading-placeholder">
                    Loading history...
                  </div>
                )}
                {historyError && (
                  <div className="empty-state error-state">
                    <div className="empty-icon"><span>⚠️</span></div>
                    <h3>Error Loading History</h3>
                    <p>{historyError}</p>
                  </div>
                )}
                {!isLoadingHistory && !historyError && reviewHistory.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">💡</div>
                    <h3>No reviews generated yet</h3>
                    <p>Generate your first review to see it here.</p>
                  </div>
                )}
                {!isLoadingHistory && !historyError && reviewHistory.length > 0 && (
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th className="checkbox-cell">
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={reviewHistory.slice(0, visibleReviews).length > 0 && 
                                  reviewHistory.slice(0, visibleReviews).every(item => 
                                    selectedReviews.includes(item.timestamp))}
                                onChange={e => handleSelectAllReviews(e.target.checked)}
                              />
                              <span className="checkmark"></span>
                            </label>
                          </th>
                          <th>Reviewer Name</th>
                          <th>Review Text</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewHistory.slice(0, visibleReviews).map((item, index) => {
                          const isSelected = selectedReviews.includes(item.timestamp);
                          return (
                            <tr key={item.timestamp || index} className={`history-row ${isSelected ? 'selected' : ''}`}>
                              <td className="checkbox-cell">
                                <label className="checkbox-container">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={e => handleSelectReviewItem(item.timestamp, e.target.checked)}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                              </td>
                              <td className="reviewer-cell"> 
                                <span className="reviewer-name">{item.reviewerName || 'Anonymous'}</span>
                              </td>
                              <td className="review-text-cell">
                                <span className="review-text-preview">{item.reviewText?.substring(0, 60)}...</span>
                              </td>
                              <td className="date-cell">
                                <span className="review-date">{new Date(item.timestamp).toLocaleDateString()}</span>
                              </td>
                              <td className="action-cell">
                                <div className="action-buttons">
                                  <button 
                                    className="view-button" 
                                    onClick={() => handleViewHistoryItem(item)}
                                    title="View Generated Image"
                                    disabled={!item.imageUrl} 
                                  >
                                    View
                                  </button>
                                  <button 
                                    className="delete-button"
                                    onClick={e => handleDeleteHistoryItem(item.timestamp, e)}
                                    title="Delete History Entry"
                                    disabled={isDeletingReview}
                                  >
                                    {isDeletingReview && reviewToDelete === item.timestamp ? (
                                      <span className="loading-spinner"></span>
                                    ) : (
                                      <FiTrash2 />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {reviewHistory.length > visibleReviews && (
                      <div className="load-more-container">
                        <button className="load-more-button" onClick={loadMoreReviews}>
                          Load More
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* --- End History Section --- */}

              {/* --- Render Testimonial Loading Modal --- */} 
              <TestimonialLoadingModal
                isOpen={showLoadingModal}
                onClose={closeLoadingModal} 
                currentStepIndex={currentLoadingStep} 
                error={loadingError} 
                reviewData={extractedReviewData} 
                editedNameValue={editedReviewerName}
                onNameChange={handleReviewerNameChange}
                editedTextValue={editedReviewText} 
                onTextChange={handleReviewTextChange}
                onGenerateClick={() => handleConfirmAndGenerate(editedReviewerName, editedReviewText)} 
                isLoadingGeneration={isGenerating} 
              />

              {/* --- Render FINAL Results Modal --- */} 
              {showResultsModal && (historyToView || finalResults) && (
                  <TestimonialResultsModal 
                      isOpen={showResultsModal} 
                      onClose={historyToView ? handleCloseResultsModalFromHistory : closeResultsModal} 
                      results={historyToView || finalResults}
                      isLoading={isLoadingModalContent}
                      error={modalError}
                  />
              )}

              {/* Confirmation Modal for deleting reviews */}
              <ConfirmationModal
                isOpen={isDeleteConfirmationOpen}
                onCancel={cancelDeleteHistoryItem}
                onConfirm={confirmDeleteHistoryItem}
                title={isBulkDelete ? 'Delete Multiple Reviews' : 'Delete Review'}
                message={isBulkDelete
                  ? `Are you sure you want to delete ${selectedReviews.length} reviews? This action cannot be undone.`
                  : 'Are you sure you want to delete this review? This action cannot be undone.'}
                isLoading={isDeletingReview}
              />

              {/* Video Modal - Add this section */} 
              <Modal 
                isOpen={isVideoModalOpen} 
                onClose={closeVideoModal} 
                title="How to Use the Review Screenshot Generator"
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
                    {/* Placeholder for the actual Review Generator video URL */}
                    <iframe 
                      src="https://player.vimeo.com/video/YOUR_REVIEW_VIDEO_ID_HERE" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                      frameBorder="0" 
                      allow="autoplay; fullscreen; picture-in-picture" 
                      allowFullScreen
                      title="Review Generator Tutorial"
                    ></iframe>
                  </div>
                </div>
              </Modal>
              {/* End Video Modal section */}
            </div>
          </main>
        </div>

        <style jsx>{`
          .dashboard { min-height: 100vh; background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%); }
          .dashboard-container { margin-left: 240px; min-height: 100vh; display: flex; flex-direction: column; }
          .main { flex: 1; padding: 2rem; }
          .content { max-width: 1100px; margin: 0 auto; }
          .dashboard-header { text-align: center; margin-bottom: 2rem; }
          .title {
            margin: 0; 
            line-height: 1.15;
            font-size: 3rem;
            font-weight: 900;
            color: #111;
          }
          .subtitle { line-height: 1.5; font-size: 1.2rem; margin: 1rem 0 1.5rem; color: #333; }
          .error-message { text-align: center; margin: 1.5rem auto; padding: 0.75rem 1rem; background-color: #fff5f5; color: #c53030; border: 1px solid #fed7d7; border-radius: 6px; max-width: 600px; }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            padding: 1.5rem;
          }
          .card-container {
            display: flex;
            gap: 1.5rem;
            max-width: 1100px;
            margin: 0 auto 1.5rem;
          }
          .template-selector-section { 
            flex: 3;
          }
          .upload-section { 
            flex: 2;
              text-align: center; 
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 300px;
          }
          .upload-label { 
            display: inline-block; 
            padding: 0.8rem 1.5rem; 
            background: #62d76b;
            color: black;
            border: 2px solid black;
            border-radius: 6px;
            font-weight: 600;
            font-size: 1rem; 
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
            margin-bottom: 1.5rem; 
          }
          .upload-label:hover:not(.disabled-label) {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }
          .upload-label.disabled-label { background: #e2e8f0; color: #a0aec0; border-color: #a0aec0; cursor: not-allowed; box-shadow: none; }
          .image-preview { 
              margin-top: 0;  
              margin-bottom: 1.5rem; 
          }
          .image-preview img { 
              max-width: 100%; 
              max-height: 300px; 
              border-radius: 8px; 
              border: 1px solid #eee; 
          }
          
          .separator {
              text-align: center;
              margin: 1.5rem auto;
              font-weight: 600;
              color: #a0aec0;
              width: 100%;
              max-width: 600px;
              position: relative;
          }
          .separator::before, .separator::after {
              content: '';
              position: absolute;
              top: 50%;
              width: calc(50% - 25px);
              height: 1px;
              background-color: #e2e8f0;
          }
          .separator::before { left: 0; }
          .separator::after { right: 0; }
          
          .text-input-section {
            margin: 0 auto 2rem;
              max-width: 600px;
              padding: 2rem;
          }
          .input-group { 
            margin-bottom: 1rem;
            text-align: left;
          }
          .input-group label { 
            display: block; 
            margin-bottom: 0.5rem; 
            font-weight: 500; 
            color: #4a5568; 
            font-size: 0.9rem; 
          }
          .input-group input, .input-group textarea {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 0.95rem;
           }
           .input-group input:focus, .input-group textarea:focus {
              outline: none;
              border-color: #62d76b;
              box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.2);
           }
          .input-group textarea { 
            resize: vertical; 
            min-height: 120px; 
          }
          .paste-trigger-container {
            margin-top: 1rem;
          }
          .paste-trigger-button {
              background: none;
              border: none;
              color: #276749;
              text-decoration: underline;
              cursor: pointer;
              font-size: 0.9rem;
              padding: 0.25rem;
            margin-top: auto;
          }
          .paste-trigger-button:hover {
              color: #22543d;
          }
          @media (max-width: 768px) {
             .dashboard-container { margin-left: 0; }
             .main { padding: 1rem; }
             .title { font-size: 2.5rem; }
             .subtitle { font-size: 1rem; }
             .card-container { 
               flex-direction: column; 
               gap: 1rem;
             }
             .upload-section, .template-selector-section { 
               padding: 1.5rem;
               flex: none;
             }
             .text-input-section { 
               padding: 1.5rem;
               margin-bottom: 1.5rem;
             }
             .separator { max-width: calc(100% - 2rem); }
          }

          /* History Section Styles */
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

          /* Empty State Styles */
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
          .empty-state h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #334155;
          }
          .empty-state p {
            margin: 0;
            color: #64748b;
          }
          .error-state .empty-icon { color: #f87171; }
          .error-state h3 { color: #b91c1c; }
          .loading-placeholder {
            text-align: center;
            padding: 3rem 1rem;
            color: #6b7280;
          }

          /* History Table Styles */
          .history-table-container {
            overflow-x: auto;
          }
          .history-table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
          }
          .history-table th,
          .history-table td {
            padding: 1rem;
            text-align: left;
            vertical-align: middle;
            border-bottom: 1px solid #e2e8f0;
          }
          .history-table th {
            font-weight: 600;
            color: #4a5568;
            font-size: 0.875rem;
            border-bottom-width: 2px;
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
          
          /* Table Cell Styles */
          .checkbox-cell {
            width: 40px;
            text-align: center;
            padding-right: 0;
          }
          .checkbox-container {
            display: inline-block;
            position: relative;
            cursor: pointer;
            user-select: none;
            height: 18px;
            width: 18px;
            vertical-align: middle;
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
            height: 18px;
            width: 18px;
            background-color: #fff;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            transition: all 0.15s ease;
          }
          .checkbox-container:hover input ~ .checkmark {
            background-color: #f3f4f6;
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
            left: 6px;
            top: 2px;
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }

          .reviewer-cell .reviewer-name {
            font-weight: 600;
            color: #1a1a1a;
            display: block;
          }
          
          .review-text-cell .review-text-preview {
            color: #4a5568;
            display: block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 300px;
          }
          
          .date-cell .review-date {
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
            to { transform: rotate(360deg); }
          }

          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          }
          
          @keyframes delete-ripple {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .dashboard-container { margin-left: 0; }
            .main { padding: 1rem; }
            .title { font-size: 2rem; }
            .subtitle { font-size: 1rem; }
            
            .history-table th,
            .history-table td {
              padding: 0.5rem;
              font-size: 0.85rem;
            }
            .history-table th:nth-child(3),
            .history-table td:nth-child(3) {
              display: none;
            }
            .action-cell { width: 100px; }
          }

          .input-group input:disabled, .input-group textarea:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
            opacity: 0.7;
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 