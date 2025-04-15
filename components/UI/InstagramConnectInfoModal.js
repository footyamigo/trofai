import React from 'react';
import Modal from './Modal'; // Assuming Modal component exists in the same folder
import { FiInfo, FiExternalLink } from 'react-icons/fi';

export default function InstagramConnectInfoModal({ isOpen, onClose, onProceed }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Connect Instagram Account"
      footer={
        <div className="modal-actions">
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" onClick={onProceed}>
            Connect
          </button>
        </div>
      }
    >
      <div className="info-content">
        <p className="intro-text">
          Connect an Instagram Creator or Business profile to post and schedule posts on Instagram.
        </p>

        <div className="requirement">
          <h4><FiInfo className="icon" /> Must be a Business or Creator profile</h4>
          <p>
            Only Instagram Business or Creator profiles are supported. Personal profiles are not supported. Switching to a Business or Creator profile is easy and only takes a few minutes.
          </p>
          <div className="links">
            <a href="https://help.instagram.com/502981923235522" target="_blank" rel="noopener noreferrer">How to set up a business account <FiExternalLink /></a>
            <a href="https://help.instagram.com/2358103564437429" target="_blank" rel="noopener noreferrer">How to set up a creator account <FiExternalLink /></a>
          </div>
        </div>

        <div className="requirement">
          <h4><FiInfo className="icon" /> Must be connected to a Facebook Page</h4>
          <p>
            Make sure you have connected your profile to a Facebook Page, even if it's not in use. This is required by Meta for API access.
          </p>
          <div className="links">
            <a href="https://help.instagram.com/176235449218188" target="_blank" rel="noopener noreferrer">How to connect Instagram to a Facebook Page <FiExternalLink /></a>
          </div>
        </div>

        <div className="troubleshooting">
          <a href="#" onClick={(e) => e.preventDefault()} className="trouble-link"> {/* Replace # with actual help link */} 
             Having trouble connecting? View troubleshooting guide
          </a>
        </div>
      </div>

      <style jsx>{`
        .info-content {
          padding: 0.5rem;
        }
        .intro-text {
          font-size: 1rem;
          color: #4b5563;
          margin-bottom: 1.5rem;
        }
        .requirement {
          background-color: #f9fafb; /* Light gray background */
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .requirement h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        .requirement .icon {
          color: #6b7280;
        }
        .requirement p {
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .links a {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.85rem;
          color: #62d76b; /* Primary color */
          text-decoration: none;
          font-weight: 500;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .troubleshooting {
          margin-top: 1.5rem;
          text-align: center;
        }
        .trouble-link {
           font-size: 0.9rem;
           color: #6b7280;
           text-decoration: none;
        }
         .trouble-link:hover {
           text-decoration: underline;
         }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-top: 1rem; 
          border-top: 1px solid #e5e7eb;
          margin-top: 1rem;
        }
        /* Reusing button styles from settings page - consider global styles */
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
      `}</style>
    </Modal>
  );
} 