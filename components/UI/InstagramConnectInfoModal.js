import React, { useState } from 'react';
import Modal from './Modal'; // Assuming Modal component exists in the same folder
import { FiInfo, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function InstagramConnectInfoModal({ isOpen, onClose, onProceed }) {
  // State for collapsible sections
  const [isBizReqOpen, setIsBizReqOpen] = useState(false);
  const [isFbReqOpen, setIsFbReqOpen] = useState(false);

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

        {/* Requirement 1: Business/Creator Profile */}
        <div className="requirement">
          <h4 onClick={() => setIsBizReqOpen(!isBizReqOpen)} className="collapsible-header">
            <FiInfo className="icon" /> 
            <span>Must be a Business or Creator profile</span>
            {isBizReqOpen ? <FiChevronUp className="chevron" /> : <FiChevronDown className="chevron" />}
          </h4>
          {/* Collapsible Content */}
          {isBizReqOpen && (
            <div className="collapsible-content">
              <p>
                Only Instagram Business or Creator profiles are supported. Personal profiles are not supported. Switching to a Business or Creator profile is easy and only takes a few minutes.
              </p>
              <div className="links">
                <a href="https://help.instagram.com/502981923235522" target="_blank" rel="noopener noreferrer">How to set up a business account <FiExternalLink /></a>
                <a href="https://help.instagram.com/2358103564437429" target="_blank" rel="noopener noreferrer">How to set up a creator account <FiExternalLink /></a>
              </div>
            </div>
          )}
        </div>

        {/* Requirement 2: Connected FB Page */}
        <div className="requirement">
           <h4 onClick={() => setIsFbReqOpen(!isFbReqOpen)} className="collapsible-header">
            <FiInfo className="icon" /> 
            <span>Must be connected to a Facebook Page</span>
             {isFbReqOpen ? <FiChevronUp className="chevron" /> : <FiChevronDown className="chevron" />}
          </h4>
           {/* Collapsible Content */}
          {isFbReqOpen && (
            <div className="collapsible-content">
              <p>
                Make sure you have connected your profile to a Facebook Page, even if it's not in use. This is required by Meta for API access.
              </p>
              <div className="links">
                <a href="https://help.instagram.com/176235449218188" target="_blank" rel="noopener noreferrer">How to connect Instagram to a Facebook Page <FiExternalLink /></a>
              </div>
            </div>
          )}
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
        .collapsible-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0; /* Remove default margin */
          cursor: pointer;
          position: relative; /* For chevron positioning */
        }
         .collapsible-header span {
           flex-grow: 1; /* Allow text to take space */
         }
        .collapsible-header .icon {
          color: #6b7280;
          flex-shrink: 0; /* Prevent icon shrinking */
        }
        .collapsible-header .chevron {
           color: #6b7280;
           margin-left: auto; /* Push chevron to the right */
           flex-shrink: 0;
        }
        .collapsible-content {
          padding-top: 0.75rem; /* Space between header and content */
          margin-top: 0.5rem;
          border-top: 1px solid #e5e7eb; /* Optional separator */
        }
        .collapsible-content p {
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.5;
          margin: 0 0 1rem 0; /* Adjust margin */
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
          padding: 1rem 0 0 0; /* Adjust padding */
          border-top: 1px solid #e5e7eb;
          margin-top: 1.5rem;
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