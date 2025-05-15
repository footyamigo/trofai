import React, { createContext, useState, useContext } from 'react';

// Create the context
const PreviewModalContext = createContext();

// Create a provider component
export function PreviewModalProvider({ children }) {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [carouselDataForPreview, setCarouselDataForPreview] = useState(null);

  // Function to open the preview modal with data
  const openPreviewModal = (data) => {
    setCarouselDataForPreview(data);
    setIsPreviewModalOpen(true);
  };

  // Function to close the preview modal
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    // Optional: Clear the data when closing
    // setCarouselDataForPreview(null);
  };

  // The value that will be provided to consumers of this context
  const value = {
    isPreviewModalOpen,
    carouselDataForPreview,
    openPreviewModal,
    closePreviewModal,
  };

  return (
    <PreviewModalContext.Provider value={value}>
      {children}
    </PreviewModalContext.Provider>
  );
}

// Custom hook to use the preview modal context
export function usePreviewModal() {
  const context = useContext(PreviewModalContext);
  if (context === undefined) {
    throw new Error('usePreviewModal must be used within a PreviewModalProvider');
  }
  return context;
} 