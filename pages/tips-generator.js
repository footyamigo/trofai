// pages/tips-generator.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Layout/Sidebar'; // Adjust path if needed
import MobileMenu from '../components/Layout/MobileMenu'; // Adjust path if needed
import DashboardHeader from '../components/Dashboard/DashboardHeader'; // Adjust path if needed
import ProtectedRoute from '../src/components/ProtectedRoute'; // Adjust path if needed
import Select from 'react-select'; // Keep for Theme selection
import Button from '../components/UI/Button'; // Adjust path if needed
import TipLoadingModal from '../components/Tip/TipLoadingModal'; // UPDATED
import TipResultsModal from '../components/Tip/TipResultsModal'; // UPDATED path
import TemplateSelector from '../components/UI/TemplateSelector'; // <<< Import TemplateSelector
import ConfirmationModal from '../components/UI/ConfirmationModal'; // Added for delete confirmation
import { toast, Toaster } from 'react-hot-toast';
import { FiZap, FiRefreshCw, FiPlayCircle, FiEye, FiTrash2, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi'; // Add more icons if needed for empty state
import Modal from '../components/UI/Modal'; // For video modal
import { format } from 'date-fns'; // For formatting timestamp

// Define themes (can be moved to constants)
const TIP_CATEGORIES = [
    { value: 'Home Selling Tip', label: 'Home Selling Tip' },
    { value: 'Home Buying Tip', label: 'Home Buying Tip' },
    { value: 'Tip for Buyers', label: 'Tip for Buyers' }, // Assuming this is different from Home Buying Tip?
    { value: 'Tip for Renters', label: 'Tip for Renters' },
    { value: 'Mortgage Tip', label: 'Mortgage Tip' },
];

// --- No longer need mock templateset data here if TemplateSelector fetches ---

export default function QuoteGeneratorPage() {
    // --- State ---
    // Store only the selected ID from TemplateSelector
    const [selectedTemplatesetId, setSelectedTemplatesetId] = useState(null);
    const [selectedTipCategory, setSelectedTipCategory] = useState(TIP_CATEGORIES[0]);
    const [templateSelectionError, setTemplateSelectionError] = useState(null);

    // Loading Modal State
    const [isTipLoadingModalOpen, setIsTipLoadingModalOpen] = useState(false);
    const [tipLoadingStep, setTipLoadingStep] = useState(0); // 0: Fetching, 1: Selecting, 2: Generating
    const [isLoadingFetch, setIsLoadingFetch] = useState(false);
    const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
    const [tipSuggestions, setTipSuggestions] = useState([]);
    const [selectedTip, setSelectedTip] = useState(null);
    const [tipError, setTipError] = useState(null);

    // Results Modal State
    const [isTipResultsModalOpen, setIsTipResultsModalOpen] = useState(false);
    const [tipResults, setTipResults] = useState(null);

    // New state for regenerating suggestions
    const [isRegeneratingSuggestions, setIsRegeneratingSuggestions] = useState(false);

    // Add state for video modal
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // --- Add State for Advice History ---
    const [adviceHistory, setAdviceHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [historyToView, setHistoryToView] = useState(null); // For viewing details in results modal
    // --- End History State ---
    
    // --- Add Bulk Selection and Pagination State ---
    const [selectedTips, setSelectedTips] = useState([]);
    const [visibleTips, setVisibleTips] = useState(20); // Show 20 items initially
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    // --- End Bulk Selection and Pagination State ---
    
    // <<< Add state for modal loading >>>
    const [isLoadingModalContent, setIsLoadingModalContent] = useState(false);
    const [modalError, setModalError] = useState(null);
    // <<< End modal loading state >>>

    // Add state for delete confirmation
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [tipToDelete, setTipToDelete] = useState(null);
    const [isDeletingTip, setIsDeletingTip] = useState(false);

    // Add handlers for video modal
    const openVideoModal = () => setIsVideoModalOpen(true);
    const closeVideoModal = () => setIsVideoModalOpen(false);

    // --- Add Effect to Fetch History ---
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            setHistoryError(null);
            try {
                const sessionToken = localStorage.getItem('session');
                if (!sessionToken) {
                    // Optionally show a toast or just log, maybe don't throw error?
                    console.warn('No session found, cannot fetch history.');
                    // setHistoryError('Authentication session not found.');
                    setIsLoadingHistory(false);
                    return;
                }

                const response = await fetch('/api/tips/fetch-history', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`,
                    },
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to fetch advice history.');
                }

                setAdviceHistory(data.history || []);

            } catch (error) {
                console.error("Error fetching advice history:", error);
                setHistoryError(error.message);
                // Don't clear history on error, maybe show old data + error?
                // setAdviceHistory([]); 
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, []); // Empty dependency array means this runs once on mount
    // --- End Fetch History Effect ---

    // --- Handlers ---

    // Handler for TemplateSelector component
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplatesetId(templateId);
        setTemplateSelectionError(null); // Clear error on selection
    };

    const handleGenerateTips = async () => {
        if (!selectedTemplatesetId) {
            toast.error('Please select a template set first.');
            setTemplateSelectionError("Please select a template set.");
            return;
        }
         if (!selectedTipCategory) {
            toast.error('Please select a tip category.');
            return;
        }
        setTemplateSelectionError(null);

        // Reset state
        setTipError(null); // Clear previous errors specifically
        setTipSuggestions([]);
        setSelectedTip(null);
        setTipResults(null);
        setTipLoadingStep(0);
        setIsLoadingFetch(true);
        setIsLoadingGeneration(false);
        setIsTipLoadingModalOpen(true);

        try {
            // Get session token from localStorage
            const sessionToken = localStorage.getItem('session');
            if (!sessionToken) {
                 toast.error("Authentication session not found. Please log in again.");
                 setIsTipLoadingModalOpen(false);
                 return;
            }

            const response = await fetch('/api/tips/fetch-tips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    tip_category: selectedTipCategory.value,
                    templatesetId: selectedTemplatesetId
                 }),
            });

            let data;
            try {
                 data = await response.json();
            } catch (jsonError) {
                 console.error("Failed to parse response JSON:", jsonError);
                 try {
                    const text = await response.text();
                    console.error("Raw response text:", text);
                 } catch (textError) {
                     console.error("Could not get raw response text.");
                 }
                 throw new Error(`Server returned an invalid response (Status: ${response.status}).`);
            }


            if (!response.ok) {
                throw new Error(data?.message || `Request failed with status ${response.status}`);
            }

             if (!Array.isArray(data) || data.length === 0 || !data.every(tip => tip.advice_heading && tip.advice)) {
                 console.error("API returned success status but data is not an array or items lack required keys:", data);
                 throw new Error('Received invalid data format from server.');
             }

            // Success Case
            setTipSuggestions(data);
            setTipLoadingStep(1); // Move to selection step

        } catch (error) {
            console.error("Error fetching tip suggestions:", error);
            setTipError(error.message);
        } finally {
            setIsLoadingFetch(false);
        }
    };

    const handleRegenerateSuggestions = async () => {
        if (!selectedTipCategory) {
            toast.error('Cannot regenerate without a category.');
            return;
        }
        setIsRegeneratingSuggestions(true);
        setTipError(null); // Clear previous errors
        try {
            const sessionToken = localStorage.getItem('session');
            if (!sessionToken) {
                 toast.error("Authentication session not found. Please log in again.");
                 setIsRegeneratingSuggestions(false);
                 return;
            }

            const response = await fetch('/api/tips/fetch-tips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    tip_category: selectedTipCategory.value,
                    templatesetId: selectedTemplatesetId,
                    forceUnique: true,
                    previousSuggestions: tipSuggestions // Pass current suggestions to explicitly avoid
                 }),
            });

            let data;
            try {
                 data = await response.json();
            } catch (jsonError) {
                 console.error("Failed to parse regenerate response JSON:", jsonError);
                 throw new Error(`Server returned an invalid response (Status: ${response.status}).`);
            }

            if (!response.ok) {
                throw new Error(data?.message || `Regeneration failed with status ${response.status}`);
            }
            if (!Array.isArray(data) || data.length === 0 || !data.every(tip => tip.advice_heading && tip.advice)) {
                 console.error("API returned success status but data is not an array or items lack required keys (regen):", data);
                 throw new Error('Received invalid or empty data format from server during regeneration.');
            }

            // Success Case - Update suggestions
            setTipSuggestions(data);
            setSelectedTip(null);
            toast.success('Generated new tip suggestions!');

        } catch (error) {
            console.error("Error regenerating tip suggestions:", error);
            setTipError(error.message);
        } finally {
            setIsRegeneratingSuggestions(false);
        }
    };

    const handleSelectTip = (suggestion) => {
        setSelectedTip(suggestion);
         setTipError(null); // Clear error when user makes a selection
    };

    const handleGenerateImage = async () => {
        if (!selectedTip || !selectedTemplatesetId) {
             toast.error('Internal error: No tip or template selected.');
             setTipError('Could not proceed. Please close the modal and try again.');
             return;
        }

        setTipLoadingStep(2); // Move to generation step
        setIsLoadingGeneration(true);
        setTipError(null); // Clear previous errors

         try {
             // Get session token from localStorage
            const sessionToken = localStorage.getItem('session');
            if (!sessionToken) {
                 toast.error("Authentication session not found. Please log in again.");
                 setIsTipLoadingModalOpen(false); // Close modal if no token
                 return;
            }

            const response = await fetch('/api/tips/generate-tip-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                     'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({
                    tips_type: selectedTipCategory.value,
                    advice_heading: selectedTip.advice_heading,
                    advice: selectedTip.advice,
                    templatesetId: selectedTemplatesetId
                 }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Attempt to parse error message from backend
                const errorMsg = data?.message || data?.error || 'Failed to generate image.';
                throw new Error(errorMsg);
            }
            // Check if bannerbear data exists, minimum check
            if (!data.bannerbear) { 
                throw new Error('Image generation succeeded but essential data is missing.');
            }

            // Store the full results object
            setTipResults(data); 
            
            // --- Add the newly generated item to the top of the history state --- 
            // Re-create the history item as saved in the backend
            const newHistoryItem = {
                advice_heading: selectedTip.advice_heading,
                advice: selectedTip.advice,
                category: selectedTipCategory.value,
                timestamp: new Date().toISOString(), // Match backend format
                templateSetId: selectedTemplatesetId,
                imageUrl: data.bannerbear?.images?.[0]?.image_url_png || data.bannerbear?.images?.[0]?.image_url || null,
                collectionUid: data.bannerbear?.uid,
                caption: data.caption // Add the caption from the results data
            };
            setAdviceHistory(prevHistory => [newHistoryItem, ...prevHistory]); // Add to front
            // --- End update history state ---

            setIsTipLoadingModalOpen(false); // Close loading modal
            setIsTipResultsModalOpen(true); // Open results modal

        } catch (error) {
            console.error("Error generating tip image:", error);
            setTipError(error.message); // Set error for the modal
            // Keep loading modal open to show the error
        } finally {
            setIsLoadingGeneration(false);
        }
    };

    const handleCloseLoadingModal = () => {
         setIsTipLoadingModalOpen(false);
         // Reset potentially incomplete states if closed early
         setIsLoadingFetch(false);
         setIsLoadingGeneration(false);
         setTipError(null);
         setSelectedTip(null);
         setTipSuggestions([]);
    };

    const handleCloseResultsModal = () => {
        setIsTipResultsModalOpen(false);
        setTipResults(null); // Clear full results
    };

    // --- Add Handler to View History Item --- 
    const handleViewHistoryItem = async (item) => {
        // Check for collectionUid AND the stored caption
        if (!item.collectionUid) { 
            toast.error('Cannot view history item: Missing collection identifier.');
            return;
        }
        // Don't fetch if caption isn't stored (for older history items before the fix)
        // OR if we don't have the heading/advice needed for context
        if (!item.caption || !item.advice_heading || !item.advice) {
            toast.error('Cannot view history item: Essential data missing (caption/advice).');
            console.warn("History item missing essential data:", item);
            return;
        }
        
        console.log("Fetching Bannerbear data for history item:", item.collectionUid);
        setIsLoadingModalContent(true); 
        setModalError(null);
        setHistoryToView(null); 
        setIsTipResultsModalOpen(true); 
        // Set selected tip context immediately using data from the history item
        setSelectedTip({ advice_heading: item.advice_heading, advice: item.advice }); 

        try {
            const sessionToken = localStorage.getItem('session');
            if (!sessionToken) throw new Error('Authentication session not found.');

            // Fetch ONLY Bannerbear collection data
            const response = await fetch(`/api/tips/fetch-history-item?collectionUid=${item.collectionUid}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${sessionToken}` },
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || `Failed to fetch history item details (Status: ${response.status})`);
            }
            
            const fullBannerbearData = data.bannerbearCollection;

            // Construct the results object using fetched BB data and STORED caption
            const resultsForModal = {
                bannerbear: fullBannerbearData, 
                caption: item.caption // <<< Use the caption from the history item object
            };

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
        setIsTipResultsModalOpen(false);
        setHistoryToView(null); // Clear the viewed history item
        setSelectedTip(null); // Clear the selected tip context
        setIsLoadingModalContent(false); // Reset loading state
        setModalError(null); // Reset error state
    };
    // --- End View History Handler --- 

    // --- Add Handlers for Bulk Selection ---
    const handleSelectTipItem = (timestamp, isSelected) => {
        if (isSelected) {
            setSelectedTips(prev => [...prev, timestamp]);
        } else {
            setSelectedTips(prev => prev.filter(t => t !== timestamp));
        }
    };

    const handleSelectAllTips = (isSelected) => {
        if (isSelected) {
            const visibleTipIds = adviceHistory
                .slice(0, visibleTips)
                .map(item => item.timestamp)
                .filter(Boolean);
            setSelectedTips(visibleTipIds);
        } else {
            setSelectedTips([]);
        }
    };

    const handleBulkDelete = () => {
        if (selectedTips.length === 0) return;
        setIsBulkDelete(true);
        setShowDeleteConfirmation(true);
    };

    const loadMoreTips = () => setVisibleTips(v => v + 20);
    // --- End Bulk Selection Handlers ---

    // --- Update Delete History Handlers ---
    const handleDeleteHistoryItem = async (timestamp, e) => {
        if (e) e.stopPropagation();
        setTipToDelete(timestamp);
        setShowDeleteConfirmation(true);
        setIsBulkDelete(false);
    };
    
    const confirmDeleteHistoryItem = async () => {
        const tipsToDelete = isBulkDelete ? selectedTips : [tipToDelete];
        if (!tipsToDelete.length) return;
        
        try {
            setIsDeletingTip(true);
            
            // Process each tip deletion
            for (const timestamp of tipsToDelete) {
                // Call the API to delete the history item
                const response = await fetch(`/api/tips/delete-history-item?timestamp=${timestamp}`, {
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
            setAdviceHistory(prevHistory => prevHistory.filter(item => !tipsToDelete.includes(item.timestamp)));
            
            toast.success(isBulkDelete 
                ? `Successfully deleted ${tipsToDelete.length} tips` 
                : 'Tip deleted successfully');
            
            // Reset states
            setShowDeleteConfirmation(false);
            setTipToDelete(null);
            setSelectedTips([]); 
            setIsBulkDelete(false);
        } catch (error) {
            console.error('Error deleting history item(s):', error);
            toast.error(error.message || 'Failed to delete tip(s)');
        } finally {
            setIsDeletingTip(false);
        }
    };
    
    const cancelDeleteHistoryItem = () => {
        setShowDeleteConfirmation(false);
        setTipToDelete(null);
        setIsBulkDelete(false);
    };
    // --- End Delete History Handler ---

    // --- Render ---
    return (
         <ProtectedRoute>
             <div className="dashboard"> {/* Assuming this class exists */}
                 <Toaster position="bottom-center" />
                 <Head>
                     <title>Real Estate Advice Generator - Trofai</title> {/* Update title */}
                 </Head>
                 <MobileMenu activePage="tips-generator" />
                 <Sidebar activePage="tips-generator" />
                 <div className="dashboard-container"> {/* Assuming this class exists */}
                    <DashboardHeader /> {/* Assuming this component exists */}
                     <main className="main"> {/* Assuming this class exists */}
                         <div className="content"> {/* Assuming this class exists */}
                             {/* Page Header */}
                             <div className="dashboard-header"> {/* Use existing class */}
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    <h1 className="title">Real Estate Tip Generator</h1>
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
                                 <p className="subtitle">Select a template and tip category to generate shareable advice graphics.</p>
                             </div>

                            {/* --- Use TemplateSelector Component --- */}
                            <div className="template-selector-section card">
                                <TemplateSelector
                                    selectedTemplate={selectedTemplatesetId}
                                    onSelect={handleTemplateSelect}
                                    apiEndpoint="/api/list-quote-templates"
                                />
                                {templateSelectionError && <div className="error-inline" style={{marginTop: '1rem'}}>{templateSelectionError}</div>}

                                {/* --- Moved Tip Category Selection Here --- */}
                                <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                     <label htmlFor="tip-category-select">Select Tip Category:</label>
                                     <Select
                                         id="tip-category-select"
                                         instanceId="tip-category-select-instance"
                                         options={TIP_CATEGORIES}
                                         value={selectedTipCategory}
                                         onChange={setSelectedTipCategory}
                                         styles={selectStyles}
                                     />
                                 </div>

                                {/* --- Moved Generate Button Here --- */}
                                <div className="generate-button-container">
                                    <Button
                                        onClick={handleGenerateTips}
                                        // Only disable visually when actually fetching
                                        disabled={isLoadingFetch} 
                                        isLoading={isLoadingFetch}
                                    >
                                        <FiZap style={{ marginRight: '0.5em' }} />
                                        {isLoadingFetch ? 'Fetching...' : 'Generate Advice'}
                                    </Button>
                                 </div>
                             </div>

                            {/* --- Generated Advice History Section --- */}
                            <div className="history-section">
                                <div className="history-header">
                                    <h2 className="history-title">History</h2>
                                    {selectedTips.length > 0 && (
                                        <button
                                            className={`bulk-delete-button ${isDeletingTip ? 'loading' : ''}`}
                                            onClick={handleBulkDelete}
                                            disabled={isDeletingTip}
                                        >
                                            {isDeletingTip && isBulkDelete ? (
                                                <>
                                                    <span className="delete-spinner"></span>
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>Delete Selected ({selectedTips.length})</>
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
                                        <div className="empty-icon"><FiAlertTriangle /></div>
                                        <h3>Error Loading History</h3>
                                        <p>{historyError}</p>
                                    </div>
                                )}
                                {!isLoadingHistory && !historyError && adviceHistory.length === 0 && (
                                    <div className="empty-state">
                                      <div className="empty-icon">💡</div>
                                      <h3>No advice generated yet</h3>
                                      <p>Generate your first advice graphic to see it here.</p>
                                    </div>
                                )}
                                {!isLoadingHistory && !historyError && adviceHistory.length > 0 && (
                                    // Added history-table-container for potential horizontal scroll
                                    <div className="history-table-container">
                                        <table className="history-table">
                                            <thead>
                                                <tr>
                                                    <th className="checkbox-cell">
                                                        <label className="checkbox-container">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={adviceHistory.slice(0, visibleTips).length > 0 && 
                                                                    adviceHistory.slice(0, visibleTips).every(item => 
                                                                        selectedTips.includes(item.timestamp))}
                                                                onChange={e => handleSelectAllTips(e.target.checked)}
                                                            />
                                                            <span className="checkmark"></span>
                                                        </label>
                                                    </th>
                                                    <th>Advice Heading</th>
                                                    <th>Category</th>
                                                    <th>Date</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adviceHistory.slice(0, visibleTips).map((item, index) => {
                                                    const isSelected = selectedTips.includes(item.timestamp);
                                                    return (
                                                        <tr key={item.timestamp || index} className={`history-row ${isSelected ? 'selected' : ''}`}>
                                                            <td className="checkbox-cell">
                                                                <label className="checkbox-container">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isSelected}
                                                                        onChange={e => handleSelectTipItem(item.timestamp, e.target.checked)}
                                                                    />
                                                                    <span className="checkmark"></span>
                                                                </label>
                                                            </td>
                                                            <td className="property-cell"> 
                                                                <span className="property-title">{item.advice_heading}</span>
                                                            </td>
                                                            <td>{item.category}</td>
                                                            <td className="date-cell">
                                                                <span className="property-date">{format(new Date(item.timestamp), 'dd/MM/yyyy')}</span>
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
                                                                        disabled={isDeletingTip}
                                                                        >
                                                                        {isDeletingTip && tipToDelete === item.timestamp ? (
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
                                        {adviceHistory.length > visibleTips && (
                                            <div className="load-more-container">
                                                <button className="load-more-button" onClick={loadMoreTips}>
                                                    Load More
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* --- End History Section --- */}

                            {/* Loading Modal */}
                            <TipLoadingModal
                                isOpen={isTipLoadingModalOpen}
                                onClose={handleCloseLoadingModal}
                                currentStepIndex={tipLoadingStep}
                                categoryLabel={selectedTipCategory?.label || 'your category'}
                                tipSuggestions={tipSuggestions}
                                selectedTip={selectedTip}
                                onSelectTip={handleSelectTip}
                                onGenerateClick={handleGenerateImage}
                                isLoadingFetch={isLoadingFetch}
                                isLoadingGeneration={isLoadingGeneration}
                                isLoadingRegeneration={isRegeneratingSuggestions}
                                onRegenerateSuggestions={handleRegenerateSuggestions}
                                error={tipError}
                            />

                            {/* Results Modal - Pass loading/error states */}
                            <TipResultsModal
                                isOpen={isTipResultsModalOpen}
                                onClose={historyToView || modalError ? handleCloseResultsModalFromHistory : handleCloseResultsModal}
                                results={historyToView || tipResults} // Use history item data if viewing history
                                selectedTip={selectedTip} // Ensure selectedTip is set when viewing history
                                isLoading={isLoadingModalContent} // Pass modal loading state
                                error={modalError} // Pass modal error state
                            />

                            {/* Video modal */}
                            <Modal 
                              isOpen={isVideoModalOpen} 
                              onClose={closeVideoModal} 
                              title="How to Use the Advice Generator"
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
                                    title="Quote Generator Tutorial"
                                  ></iframe>
                                </div>
                              </div>
                            </Modal>

                            {/* Add Confirmation Modal */}
                            <ConfirmationModal
                                isOpen={showDeleteConfirmation}
                                onCancel={cancelDeleteHistoryItem}
                                onConfirm={confirmDeleteHistoryItem}
                                title={isBulkDelete ? 'Delete Multiple Tips' : 'Delete Tip'}
                                message={isBulkDelete
                                    ? `Are you sure you want to delete ${selectedTips.length} tips? This action cannot be undone.`
                                    : 'Are you sure you want to delete this tip? This action cannot be undone.'}
                                isLoading={isDeletingTip}
                            />
                         </div>
                     </main>
                 </div>

                {/* Add/Update History & Empty State Styles */}
                 <style jsx>{`
                    /* Basic Dashboard Layout Styles (assume they exist globally or copy from review-generator) */
                    .dashboard { min-height: 100vh; background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%); }
                    .dashboard-container { margin-left: 240px; min-height: 100vh; display: flex; flex-direction: column; }
                    .main { flex: 1; padding: 2rem; }
                    .content { max-width: 1000px; /* Adjusted max-width? */ margin: 0 auto; }

                    /* Page Header Styles (from review-generator) */
                    .dashboard-header { text-align: center; margin-bottom: 2rem; }
                    .title { margin: 0; line-height: 1.15; font-size: 3.5rem; font-weight: 900; color: #111; }
                    .subtitle { line-height: 1.5; font-size: 1.2rem; margin: 1rem 0 1.5rem; color: #333; }

                    /* Card Styles (from review-generator) */
                    .card {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.04); /* Adjusted shadow */
                        border: 1px solid #e5e7eb;
                        padding: 1.5rem 2rem; /* Adjusted padding */
                        margin-bottom: 2rem; /* Add consistent margin bottom */
                    }

                    .template-selector-section {
                        margin: 1rem auto 2rem auto;
                        max-width: 100%; /* Allow it to take full width */
                        /* Use card styles */
                     }
                     /* REMOVE .config-section style */
                     /* .config-section { ... } */

                     /* Add title style (optional, could use inline) */
                     .config-title {
                         font-size: 1.25rem; /* Adjust size */
                         font-weight: 600; /* Make it semi-bold */
                         color: #1f2937; /* Darker text */
                         margin-bottom: 1.5rem; /* Space below title */
                         /* text-align: center; /* Keep left-aligned */
                     }

                     /* Style the label */
                     .form-group label {
                         display: block;
                         margin-bottom: 0.5rem;
                         font-weight: 500;
                         color: #374151;
                     }

                     .generate-button-container {
                         display: flex;
                         justify-content: center;
                         margin-top: 1rem; /* Space above button */
                     }

                    .error-inline { /* Ensure error style is defined */
                         color: #c53030;
                         font-size: 0.8rem;
                         margin-top: 0.25rem;
                     }

                    /* Responsive adjustments (from review-generator) */
                     @media (max-width: 768px) {
                        .dashboard-container { margin-left: 0; }
                        .main { padding: 1rem; }
                        .title { font-size: 2rem; }
                        .subtitle { font-size: 1rem; }
                        .card { padding: 1rem; }
                        .config-section.card { padding: 1.5rem; } /* Adjust padding */
                     }

                     /* Card Styles */
                     .card {
                         /* ... existing card styles ... */
                         margin-bottom: 2rem; /* Ensure consistent spacing */
                     }
                     
                     /* Apply exact same history section structure */
                     .history-section {
                         margin-top: 2rem;
                         padding: 2rem;
                         background: white;
                         border-radius: 12px;
                         box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                     }

                     .history-header { /* Add if header needed */
                         display: flex;
                         justify-content: space-between;
                         align-items: center;
                         margin-bottom: 1.5rem;
                     }

                     /* Empty State Styles (ensure match properties.js) */
                     .empty-state {
                       text-align: center;
                       padding: 4rem 1rem; /* Match properties.js */
                       background: #f8fafc;
                       border-radius: 12px;
                       border: 2px dashed #e2e8f0; /* Match properties.js */
                     }
                     .empty-icon {
                       font-size: 3rem; /* Match properties.js */
                       margin-bottom: 1rem;
                       color: #9ca3af; 
                     }
                     .empty-state h3 {
                       margin: 0 0 0.5rem 0;
                       font-size: 1.25rem; /* Match properties.js */
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

                     /* Container for potential scroll */
                     .history-table-container {
                         overflow-x: auto;
                     }

                     /* History Table Styles (match properties.js) */
                     .history-table {
                         width: 100%;
                         border-collapse: collapse;
                         border-spacing: 0;
                     }
                     .history-table th,
                     .history-table td {
                         padding: 1rem; /* Match properties.js */
                         text-align: left;
                         vertical-align: middle;
                         border-bottom: 1px solid #e2e8f0; /* Match properties.js */
                     }
                     .history-table th {
                         font-weight: 600; /* Match properties.js */
                         color: #4a5568; /* Match properties.js */
                         font-size: 0.875rem; /* Match properties.js? properties.js has no font-size here */
                         border-bottom-width: 2px; /* Match properties.js */
                     }
                     .history-row:hover {
                         background-color: #f7fafc; /* Match properties.js */
                     }
                     .history-row.selected {
                         background-color: #f0fff4; /* Match properties.js */
                     }
                     .history-row.selected:hover {
                         background-color: #e6ffed; /* Match properties.js */
                     }
                     
                     /* Replicate cell specific styles */
                     .property-cell .property-title { /* Use same structure */
                        font-weight: 600;
                        color: #1a1a1a;
                        display: block;
                     }
                     .date-cell .property-date { /* Use same structure */
                        color: #718096;
                        font-size: 0.9rem;
                     }
                     .action-cell {
                         width: 160px; /* Match properties.js */
                         text-align: center; /* Match properties.js */
                     }

                     /* Action Buttons - EXACT styles from properties.js */
                     .action-buttons {
                         display: flex;
                         justify-content: center; /* Match properties.js */
                         gap: 0.5rem;
                         align-items: center;
                     }
                     .view-button { /* Match properties.js */
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
                     .view-button.clicked::after { /* Ripple effect */
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
                     .delete-button { /* Match properties.js */
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
                     .delete-button::after { /* Ripple effect */
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
                     .delete-button svg {
                        width: 16px;
                        height: 16px;
                     }

                     /* Keyframes (Copy from properties.js) */
                     @keyframes ripple {
                         0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
                         100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
                     }
                     @keyframes delete-ripple {
                         0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                         100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                     }
                     @keyframes spin { /* Add if needed for loading spinners */
                         to { transform: rotate(360deg); }
                     }

                     /* Checkbox styles (ensure match properties.js) */
                     .checkbox-cell { width: 40px; text-align: center; padding-right: 0; }
                     .checkbox-container { display: inline-block; position: relative; cursor: pointer; user-select: none; height: 18px; width: 18px; vertical-align: middle; }
                     .checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
                     .checkmark { position: absolute; top: 0; left: 0; height: 18px; width: 18px; background-color: #fff; border: 1px solid #d1d5db; border-radius: 4px; transition: all 0.15s ease; }
                     .checkbox-container:hover input ~ .checkmark { background-color: #f3f4f6; }
                     .checkbox-container input:checked ~ .checkmark { background-color: #62d76b; border-color: #62d76b; }
                     .checkmark:after { content: ""; position: absolute; display: none; }
                     .checkbox-container input:checked ~ .checkmark:after { display: block; }
                     .checkbox-container .checkmark:after { left: 6px; top: 2px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

                     /* Responsive adjustments */
                      @media (max-width: 768px) {
                         .empty-state { padding: 2rem 1rem; }
                         .empty-icon { font-size: 2rem; }
                         .empty-state h3 { font-size: 1rem; }
                         .empty-state p { font-size: 0.85rem; }
                         
                         /* Match properties.js table adjustments */
                          .history-table th,
                          .history-table td {
                              padding: 0.5rem;
                              font-size: 0.85rem;
                          }
                          .history-table th:nth-child(3), /* Hide Date */
                          .history-table td:nth-child(3) {
                              display: none;
                          }
                          .action-cell { width: 100px; } /* Match properties.js */
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
                 `}</style>
             </div>
         </ProtectedRoute>
    );
}

// Basic styles for react-select (copy from review-generator or customize)
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? '#62d76b' : '#d1d5db', // <<< Green focus border
    borderRadius: '0.375rem', // 6px
    minHeight: '42px',
    boxShadow: state.isFocused ? '0 0 0 1px #62d76b' : 'none', // <<< Green focus shadow
    '&:hover': {
      borderColor: state.isFocused ? '#62d76b' : '#a5b4fc', // <<< Green border on hover when focused, keep blue otherwise for consistency? Or change to green always? Let's try green always for focus indication
      borderColor: '#62d76b', // <<< Green border on hover
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#62d76b' : state.isFocused ? '#f0fdf4' : null,
    color: state.isSelected ? 'black' : '#1f2937', // Black text on selected green
     fontWeight: state.isSelected ? '500' : 'normal', // Slightly bolder selected
    '&:active': { // Click style
      backgroundColor: state.isSelected ? '#56c15f' : '#dcfce7',
    },
     cursor: 'pointer',
  }),
  menu: (provided) => ({
    ...provided,
    maxHeight: '200px', // Limit height to allow scrolling
    overflowY: 'auto', // Enable vertical scrolling
    zIndex: 20, // Ensure dropdown is above other elements
    borderRadius: '0.375rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Add some shadow
  }),
  menuList: (provided) => ({
      ...provided,
      // Add padding if needed, e.g.:
      // padding: '4px 0',
  }),
  placeholder: (provided) => ({
     ...provided,
     color: '#9ca3af', // Lighter placeholder text
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#1f2937', // Ensure selected value text color
  }),
}; 