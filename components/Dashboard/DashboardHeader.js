import { IoNotificationsOutline } from 'react-icons/io5';
import { FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { BiChevronDown } from 'react-icons/bi';
import { RiTeamLine } from 'react-icons/ri';
import { useAuth } from '../../src/context/AuthContext';
import Link from 'next/link';
import React from 'react';
import Button from '../UI/Button';

export default function DashboardHeader() {
  const { user, loading, signOut } = useAuth();

  // Add console logging to debug user object structure
  React.useEffect(() => {
    if (user) {
      console.log('User object in header:', user);
    }
  }, [user]);

  // Helper function to get the best display name for the user
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    // For debugging purposes
    console.log('User object in getUserDisplayName:', user);
    
    // Based on the validate-session.js structure:
    // The endpoint returns: { userId, username, email, attributes: { email, name } }
    
    // Try to get the name from attributes first (this is where fullName is stored)
    if (user.attributes?.name && user.attributes.name !== 'User') {
      return user.attributes.name;
    }
    
    // Then try direct email or username fields (these are always set in validate-session response)
    if (user.email) return user.email;
    if (user.username) return user.username;
    
    // Finally fallback to User
    return 'User';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="left-section">
        <div className="team-selector">
          <RiTeamLine className="team-icon" />
          <span>Personal Team</span>
          <BiChevronDown />
        </div>
      </div>

      <div className="right-section">
        {loading ? (
          <div className="loading-auth">Loading...</div>
        ) : user ? (
          <div className="auth-container">
            <span className="welcome-text">
              Welcome, {getUserDisplayName()}
            </span>
            <Link href="/dashboard/settings">
              <button className="header-button profile">
                <span>Profile</span>
              </button>
            </Link>
            <Button onClick={handleSignOut} className="sign-out-btn">
              <FiLogOut style={{ fontSize: '1.1rem' }}/>
              <span>Sign Out</span>
            </Button>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: white;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        @media (max-width: 768px) {
          .dashboard-header {
            display: none;
          }
        }

        .left-section {
          display: flex;
          align-items: center;
        }

        .team-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.9375rem;
          color: #1a1a1a;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .team-selector:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        :global(.team-icon) {
          width: 1.25rem;
          height: 1.25rem;
          color: #FF6B6B;
        }

        .right-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          color: #4A5568;
          font-size: 0.9375rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .header-button:hover {
          background: rgba(0, 0, 0, 0.04);
          color: #1a1a1a;
        }

        .header-button.credits {
          color: #276749;
          font-weight: 500;
        }

        .header-button.upgrade {
          background: #1a1a1a;
          color: white;
          font-weight: 500;
        }

        .header-button.upgrade:hover {
          background: #000000;
          color: white;
        }

        .auth-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .welcome-text {
          font-size: 0.9375rem;
          color: #4A5568;
          margin-right: 0.5rem;
        }

        .header-button.profile {
          background: #f0f0f0;
          color: #1a1a1a;
        }

        .loading-auth {
          font-size: 0.9375rem;
          color: #4A5568;
          padding: 0.5rem 0.75rem;
        }

        :global(.header-button svg) {
          width: 1.25rem;
          height: 1.25rem;
        }
      `}</style>
    </header>
  );
} 