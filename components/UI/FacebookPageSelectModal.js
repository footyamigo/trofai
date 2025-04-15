import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function FacebookPageSelectModal({ 
    isOpen, 
    onClose, 
    pages, 
    onConnect, // Callback when a page is selected and confirmed
    isLoading 
}) {
  const [selectedPageId, setSelectedPageId] = useState(null);

  // Reset selection when modal opens or pages change
  useEffect(() => {
    if (isOpen) {
      setSelectedPageId(null); 
    }
  }, [isOpen]);

  const handleSelect = (pageId) => {
    setSelectedPageId(pageId);
  };

  const handleConfirm = () => {
    if (selectedPageId) {
      const selectedPage = pages.find(page => page.fbPageId === selectedPageId);
      onConnect(selectedPage); // Pass the whole selected page object back
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Select Facebook Page"
      footer={
        <div className="modal-actions">
          <button className="button secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className="button primary" 
            onClick={handleConfirm} 
            disabled={!selectedPageId || isLoading}
          >
            {isLoading ? 'Connecting...' : `Connect ${selectedPageId ? '(1)' : '(0)'}`}
          </button>
        </div>
      }
    >
      <div className="select-content">
        {pages && pages.length > 0 ? (
          <>
            <p>Choose the Facebook Page you want to connect for posting:</p>
            <ul className="account-list">
              {pages.map((page) => (
                <li 
                  key={page.fbPageId} 
                  className={`account-item ${selectedPageId === page.fbPageId ? 'selected' : ''}`}
                  onClick={() => handleSelect(page.fbPageId)}
                >
                  <input 
                    type="radio" 
                    name="facebookPage" 
                    value={page.fbPageId} 
                    checked={selectedPageId === page.fbPageId}
                    onChange={() => handleSelect(page.fbPageId)}
                    className="radio-input"
                  />
                  {/* Placeholder for Page Profile Pic if available via API */}
                  <div className="profile-pic-placeholder">FB</div> 
                  <div className="account-info">
                    <span className="username">{page.fbPageName}</span>
                    {/* <span className="page-id">ID: {page.fbPageId}</span> */}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No eligible Facebook Pages found for your account. Ensure you manage at least one page and have granted permissions.</p>
        )}
      </div>

      <style jsx>{`
        /* Reuse styles from InstagramAccountSelectModal, adjusting as needed */
        .select-content {
          padding: 0.5rem;
          min-height: 150px;
        }
        .select-content p {
          font-size: 0.95rem;
          color: #4b5563;
          margin-bottom: 1rem;
        }
        .account-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        .account-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .account-item:hover {
          border-color: #d1d5db;
        }
        .account-item.selected {
          border-color: #62d76b;
          background-color: #f0fff4;
        }
        .radio-input {
          margin-right: 0.75rem;
          accent-color: #62d76b;
        }
        .profile-pic-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 0.75rem;
          background-color: #1877f2; /* FB Blue */
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        .account-info {
          display: flex;
          flex-direction: column;
        }
        .username {
          font-weight: 600;
          color: #1f2937;
        }
        .page-id {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 1rem; 
          border-top: 1px solid #e5e7eb;
          margin-top: 1rem;
        }
        .button {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        .button.primary {
          background-color: #62d76b; 
          color: white;
        }
        .button.secondary {
          background-color: #f1f3f4; 
          color: #5f6368; 
          border: 1px solid #dadce0;
        }
        .button:disabled {
           opacity: 0.6;
           cursor: not-allowed;
         }
      `}</style>
    </Modal>
  );
} 