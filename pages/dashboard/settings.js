import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import Sidebar from '../../components/Layout/Sidebar';
import MobileMenu from '../../components/Layout/MobileMenu';
import Card from '../../components/UI/Card';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      const sessionToken = localStorage.getItem('session');

      if (!sessionToken) {
        console.log('No session token found, cannot fetch status.');
        setIsLoadingStatus(false);
        setIsFacebookConnected(false);
        setIsInstagramConnected(false);
        return;
      }

      try {
        const response = await fetch('/api/social/status', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        const data = await response.json();
        if (data.success && data.connections) {
          setIsFacebookConnected(data.connections.facebook || false);
          setIsInstagramConnected(data.connections.instagram || false);
        } else {
          console.error('Failed to fetch social status:', data.message);
          if (response.status !== 401) {
             toast.error('Could not load social connection status.');
          }
        }
      } catch (error) {
        console.error('Error fetching social status:', error);
        toast.error('Error loading social connection status.');
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchStatus();
  }, []);

  const handleConnectFacebook = () => {
    if (typeof FB === 'undefined') {
      toast.error('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('You seem to be logged out. Please log in again.');
      return;
    }

    setIsConnecting(true);
    toast.loading('Connecting to Facebook...');

    FB.login(function(response) {
      toast.dismiss();
      setIsConnecting(false);

      if (response.authResponse) {
        console.log('Welcome! Fetching your information.... ');
        console.log('Facebook Auth Response:', response.authResponse);
        const accessToken = response.authResponse.accessToken;
        const userID = response.authResponse.userID;

        fetch('/api/social/facebook-connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            accessToken: accessToken,
            facebookUserId: userID
          }),
        })
        .then(res => {
          if (!res.ok) {
            return res.json().then(errData => {
              throw new Error(errData.message || `Request failed with status ${res.status}`);
            }).catch(() => {
               throw new Error(`Request failed with status ${res.status}`);
            });
          }
          return res.json();
        })
        .then(data => {
          toast.success('Facebook connected successfully!');
          setIsFacebookConnected(true);
        })
        .catch(error => {
          console.error('Error sending token to backend:', error);
          toast.error(error.message || 'An error occurred while connecting Facebook.');
        });

      } else {
        console.log('User cancelled login or did not fully authorize.');
        toast.error('Facebook connection cancelled or failed.');
      }
    }, {
      scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts',
      return_scopes: true
    });
  };

  const handleDisconnectFacebook = () => {
    console.log('Disconnect Facebook');
    toast.promise(
      fetch('/api/social/facebook-disconnect', { method: 'POST' }).then(res => {
        if (!res.ok) throw new Error('Failed to disconnect');
        return res.json();
      }),
      {
        loading: 'Disconnecting Facebook...',
        success: (data) => {
          if(data.success) {
            setIsFacebookConnected(false);
            return 'Facebook disconnected.';
          } else {
            throw new Error(data.message || 'Failed to disconnect');
          }
        },
        error: (err) => err.message || 'Failed to disconnect Facebook.',
      }
    );
  };

  const handleConnectInstagram = () => {
    if (!isFacebookConnected) {
        toast.error('Please connect your Facebook account first.');
        return;
    }
    if (typeof FB === 'undefined') {
      toast.error('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('You seem to be logged out. Please log in again.');
      return;
    }

    setIsConnecting(true);
    toast.loading('Connecting to Instagram via Facebook...');

    FB.login(function(response) {
        toast.dismiss();
        setIsConnecting(false);

        if (response.authResponse) {
            console.log('Instagram via Facebook Auth Response:', response.authResponse);
            const fbAccessToken = response.authResponse.accessToken;

            fetch('/api/social/instagram-connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                },
                body: JSON.stringify({ fbAccessToken: fbAccessToken }),
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(errData => {
                      throw new Error(errData.message || `Request failed with status ${res.status}`);
                    }).catch(() => {
                       throw new Error(`Request failed with status ${res.status}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                toast.success(data.message || 'Instagram connected successfully!');
                setIsInstagramConnected(true);
            })
            .catch(error => {
                console.error('Error connecting Instagram:', error);
                toast.error(error.message || 'Failed to connect Instagram.');
            });

        } else {
            console.log('User cancelled Instagram login/permissions or did not fully authorize.');
            toast.error('Instagram connection cancelled or failed.');
        }
    }, {
        scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
        return_scopes: true
    });
  };

  const handleDisconnectInstagram = () => {
     console.log('Disconnect Instagram');
     toast('Disconnect Instagram functionality not yet implemented.');
     // TODO: Implement backend call and state update
  };

  if (isLoadingStatus) {
    return (
      <ProtectedRoute>
        <div className="dashboard">
          <Head><title>Loading Settings... - Trofai</title></Head>
          <MobileMenu activePage="settings" />
          <Sidebar activePage="settings" />
          <div className="dashboard-container flex-center">
            <div className="loading-indicator">Loading settings...</div>
          </div>
        </div>
        <style jsx>{`
          .dashboard-container.flex-center {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-grow: 1;
          }
          .loading-indicator {
            font-size: 1.2rem;
            color: #6b7280;
          }
        `}</style>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>Account Settings - Trofai</title>
          <meta name="description" content="Manage your Trofai account settings and connected social media accounts." />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <MobileMenu activePage="settings" />
        <Sidebar activePage="settings" />

        <div className="dashboard-container">
          <DashboardHeader />
          
          <main className="main">
            <div className="content">
              <div className="dashboard-header">
                <h1 className="title">Account Settings</h1>
                <p className="subtitle">Manage your profile and social media connections.</p>
              </div>

              <Card title="Social Media Connections">
                <div className="social-connection">
                  <div className="connection-header">
                    <h2>Facebook</h2>
                    {isFacebookConnected ? <span className="status connected">Connected</span> : <span className="status disconnected">Not Connected</span>}
                  </div>
                  <p>Connect your Facebook account to post property designs directly to your pages.</p>
                  {isFacebookConnected ? (
                    <button 
                      className="button secondary" 
                      onClick={handleDisconnectFacebook}
                      disabled={isConnecting}
                    >
                      Disconnect Facebook
                    </button>
                  ) : (
                    <button 
                      className="button primary" 
                      onClick={handleConnectFacebook}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Facebook'}
                    </button>
                  )}
                </div>
                
                <div className="social-connection">
                  <div className="connection-header">
                    <h2>Instagram</h2>
                    {isInstagramConnected ? (
                      <span className="status connected">Connected</span>
                    ) : (
                      <span className="status disconnected">Not Connected</span>
                    )}
                  </div>
                  <p>Connect your Instagram Business account (via Facebook) to post property designs.</p>
                  {isInstagramConnected ? (
                    <button
                      className="button secondary"
                      onClick={handleDisconnectInstagram}
                      disabled={isConnecting}
                    >
                      Disconnect Instagram
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      onClick={handleConnectInstagram}
                      disabled={!isFacebookConnected || isConnecting}
                    >
                      {isConnecting ? "Connecting..." : "Connect Instagram"}
                    </button>
                  )}
                  <p className="small-text">Note: Requires a connected Facebook Business account with an associated Instagram Business profile.</p>
                </div>
              </Card>

              {/* TODO: Add other settings sections (e.g., Profile, Billing) */}

            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background-color: #f9fafb;
        }
        .dashboard-container {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        .main {
          flex-grow: 1;
          padding: 1rem 2rem;
        }
        .content {
          max-width: 1000px;
          margin: 0 auto;
        }
        .dashboard-header {
          margin-bottom: 2rem;
        }
        .title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          font-size: 1rem;
          color: #6b7280;
        }
        .social-connection {
          border-top: 1px solid #e5e7eb;
          padding: 1.5rem 0;
        }
        .social-connection:first-of-type {
          border-top: none;
          padding-top: 0;
        }
        .connection-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .social-connection h2 {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
        }
        .status {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          text-transform: uppercase;
        }
        .status.connected {
          background-color: #e6f4ea;
          color: #34a853;
        }
        .status.disconnected {
          background-color: #f1f3f4;
          color: #5f6368;
        }
        .social-connection p {
          color: #4b5563;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        .button {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
        }
        .button.primary {
          background-color: #62d76b;
          color: white;
        }
        .button.primary:hover:not(:disabled) {
          background-color: #4caf50;
        }
        .button.secondary {
          background-color: #f1f3f4;
          color: #5f6368;
          border: 1px solid #dadce0;
        }
        .button.secondary:hover:not(:disabled) {
          background-color: #e8eaed;
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .small-text {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.75rem;
        }
      `}</style>
    </ProtectedRoute>
  );
} 