import React, { useState, useEffect } from 'react';
import Modal from './Modal';

export default function InstagramAccountSelectModal({ 
    isOpen, 
    onClose, 
    accounts, 
    onConnect, 
    isLoading 
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Reset selection when modal opens or accounts change
  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId(null); 
    }
  }, [isOpen]);

  const handleSelect = (accountId) => {
    setSelectedAccountId(accountId);
  };

  const handleConfirm = () => {
    if (selectedAccountId) {
      const selectedAccount = accounts.find(acc => acc.igUserId === selectedAccountId);
      onConnect(selectedAccount);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Select Instagram Account"
      footer={
        <div className="modal-actions">
          <button className="button secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button 
            className="button primary" 
            onClick={handleConfirm} 
            disabled={!selectedAccountId || isLoading}
          >
            {isLoading ? 'Connecting...' : `Connect ${selectedAccountId ? '(1)' : '(0)'}`}
          </button>
        </div>
      }
    >
      <div className="select-content">
        {accounts && accounts.length > 0 ? (
          <>
            <p>Choose the Instagram Business or Creator account you'd like to connect:</p>
            <ul className="account-list">
              {accounts.map((acc) => (
                <li 
                  key={acc.igUserId} 
                  className={`account-item ${selectedAccountId === acc.igUserId ? 'selected' : ''}`}
                  onClick={() => handleSelect(acc.igUserId)}
                >
                  <input 
                    type="radio" 
                    name="instagramAccount" 
                    value={acc.igUserId} 
                    checked={selectedAccountId === acc.igUserId}
                    onChange={() => handleSelect(acc.igUserId)}
                    className="radio-input"
                  />
                  <img 
                    src={acc.igProfilePictureUrl || '/default-avatar.png'} // Add a default avatar
                    alt={acc.igUsername}
                    className="profile-pic"
                  />
                  <div className="account-info">
                    <span className="username">{acc.igUsername}</span>
                    <span className="page-name">Linked to FB Page: {acc.fbPageName}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No eligible Instagram Business or Creator accounts found linked to your Facebook Pages.</p>
          // Optionally add troubleshooting steps here
        )}
      </div>

      <style jsx>{`
        .select-content {
          padding: 0.5rem;
          min-height: 150px; /* Ensure minimum height */
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
          accent-color: #62d76b; /* Style radio button */
        }
        .profile-pic {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-right: 0.75rem;
          object-fit: cover;
          background-color: #f0f0f0; /* Placeholder bg */
        }
        .account-info {
          display: flex;
          flex-direction: column;
        }
        .username {
          font-weight: 600;
          color: #1f2937;
        }
        .page-name {
          font-size: 0.8rem;
          color: #6b7280;
        }
        /* Modal actions styles same as info modal */
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