import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import Sidebar from '../../components/Layout/Sidebar';
import MobileMenu from '../../components/Layout/MobileMenu';
import Card from '../../components/UI/Card';
import { toast } from 'react-hot-toast';
import InstagramConnectInfoModal from '../../components/UI/InstagramConnectInfoModal';
import InstagramAccountSelectModal from '../../components/UI/InstagramAccountSelectModal';
import FacebookPageSelectModal from '../../components/UI/FacebookPageSelectModal';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showInstagramInfoModal, setShowInstagramInfoModal] = useState(false);
  const [showInstagramSelectModal, setShowInstagramSelectModal] = useState(false);
  const [availableIgAccounts, setAvailableIgAccounts] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  const [showFacebookPageModal, setShowFacebookPageModal] = useState(false);
  const [availableFbPages, setAvailableFbPages] = useState([]);
  const [fbConnectData, setFbConnectData] = useState(null);
  const [facebookPageName, setFacebookPageName] = useState(null);
  const [instagramUsername, setInstagramUsername] = useState(null);
  const [igConnectData, setIgConnectData] = useState(null);

  useEffect(() => {
    let isMounted = true; 
    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      const sessionToken = localStorage.getItem('session');

      if (!sessionToken) {
        console.log('No session token found, cannot fetch status.');
        if (isMounted) {
          setIsFacebookConnected(false);
          setIsInstagramConnected(false);
          setFacebookPageName(null);
          setInstagramUsername(null);
          setIsLoadingStatus(false);
        }
        return;
      }

      try {
        const response = await fetch('/api/social/status', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (!isMounted) return; 
        
        const data = await response.json();
        if (data.success && data.connections) {
          setIsFacebookConnected(data.connections.facebook || false);
          setFacebookPageName(data.connections.facebookPageName || null);
          setIsInstagramConnected(data.connections.instagram || false);
          setInstagramUsername(data.connections.instagramUsername || null);
        } else {
          console.error('Failed to fetch social status:', data.message);
           setIsFacebookConnected(false);
           setIsInstagramConnected(false);
           setFacebookPageName(null);
           setInstagramUsername(null);
        }
      } catch (error) {
         if (!isMounted) return; 
         console.error('Error fetching social status:', error);
         setIsFacebookConnected(false);
         setIsInstagramConnected(false);
         setFacebookPageName(null);
         setInstagramUsername(null);
      } finally {
         if (isMounted) {
            setIsLoadingStatus(false);
         }
      }
    };

    fetchStatus();

    return () => { isMounted = false; };

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
    toast.loading('Connecting to Facebook & fetching pages...');

    FB.login(function(response) {
      if (response.authResponse) {
        console.log('Facebook Auth Response:', response.authResponse);
        const accessToken = response.authResponse.accessToken;
        const facebookUserId = response.authResponse.userID;

        fetch('/api/social/facebook-connect', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}` 
          },
          body: JSON.stringify({ 
            accessToken: accessToken,      
            facebookUserId: facebookUserId         
          }),
        })
        .then(res => {
           if (!res.ok) {
                return res.json().then(errData => { throw new Error(errData.message || `Request failed with status ${res.status}`); })
                    .catch(() => { throw new Error(`Request failed with status ${res.status}`); });
            }
           return res.json();
        })
        .then(data => {
          toast.dismiss();
          setIsConnecting(false);
          if (data.success && data.pages) {
            if (data.pages.length > 0) {
                setAvailableFbPages(data.pages);
                setFbConnectData({ 
                    facebookUserId: data.facebookUserId, 
                    fbUserAccessToken: data.fbUserAccessToken,
                    fbTokenExpiry: data.fbTokenExpiry
                });
                setShowFacebookPageModal(true);
            } else {
                toast.error('No Facebook Pages found. Please create or manage a Page.');
                setAvailableFbPages([]);
            }
          } else {
            throw new Error(data.message || 'Failed to fetch Facebook Pages.');
          }
        })
        .catch(error => {
          toast.dismiss();
          setIsConnecting(false);
          console.error('Error fetching Facebook pages:', error);
          toast.error(error.message || 'Failed to fetch Facebook pages.');
        });

      } else {
        toast.dismiss();
        setIsConnecting(false);
        console.log('User cancelled login or did not fully authorize.');
        toast.error('Facebook connection cancelled or failed.');
      }
    }, { 
      scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts', 
      return_scopes: true
    });
  };

  const handleDisconnectFacebook = () => {
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    setIsLinking(true);

    toast.promise(
      fetch('/api/social/facebook-disconnect', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }).then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'Failed to disconnect');
          }).catch(() => { throw new Error('Failed to disconnect Facebook.'); });
        }
        return res.json();
      }),
      {
        loading: 'Disconnecting Facebook...',
        success: (data) => {
          setIsLinking(false);
          if (data.success) {
            setIsFacebookConnected(false);
            setFacebookPageName(null);
            return 'Facebook disconnected successfully.';
          } else {
            throw new Error(data.message || 'Failed to disconnect');
          }
        },
        error: (err) => {
          setIsLinking(false);
          return err.message || 'Failed to disconnect Facebook.';
        },
      }
    );
  };

  const proceedWithInstagramConnect = () => {
    setShowInstagramInfoModal(false); 
    
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
                    }).catch(() => { throw new Error(`Request failed with status ${res.status}`); });
                }
                return res.json();
            })
            .then(data => {
                toast.dismiss();
                setIsConnecting(false); 
                if (data.success && data.accounts) {
                    if (data.accounts.length > 0) {
                        setAvailableIgAccounts(data.accounts);
                        setIgConnectData({ 
                            fbUserAccessToken: data.fbUserAccessToken,
                            fbTokenExpiry: data.fbTokenExpiry
                        });
                        setShowInstagramSelectModal(true); 
                    } else {
                        toast.error('No Instagram Business/Creator accounts found linked to your Facebook Pages.');
                        setAvailableIgAccounts([]);
                    }
                } else {
                     throw new Error(data.message || 'Failed to fetch Instagram accounts.');
                }
            })
            .catch(error => {
                toast.dismiss(); 
                setIsConnecting(false); 
                console.error('Error fetching Instagram accounts list:', error);
                toast.error(error.message || 'Failed to fetch Instagram accounts list.');
            });
        } else {
            toast.dismiss();
            setIsConnecting(false);
            console.log('User cancelled Instagram login/permissions or did not fully authorize.');
            toast.error('Instagram connection cancelled or failed.');
        }
    }, {
        scope: 'email,public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
        return_scopes: true
    });
  };

  const handleConnectInstagram = () => {
    setShowInstagramInfoModal(true); 
  };

  const handleDisconnectInstagram = () => {
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    setIsLinking(true);

    toast.promise(
      fetch('/api/social/instagram-disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }).then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'Failed to disconnect');
          }).catch(() => { throw new Error('Failed to disconnect Instagram.'); });
        }
        return res.json();
      }),
      {
        loading: 'Disconnecting Instagram...',
        success: (data) => {
          setIsLinking(false);
          if (data.success) {
            setIsInstagramConnected(false);
            setInstagramUsername(null);
            return 'Instagram disconnected successfully.';
          } else {
            throw new Error(data.message || 'Failed to disconnect');
          }
        },
        error: (err) => {
          setIsLinking(false);
          return err.message || 'Failed to disconnect Instagram.';
        },
      }
    );
  };

  const handleInstagramAccountSelected = async (selectedAccount) => {
    if (!selectedAccount || !igConnectData) return;

    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('You seem to be logged out. Please log in again.');
      return;
    }
    
    setIsLinking(true);
    setShowInstagramSelectModal(false);
    toast.loading('Linking selected Instagram account...');

    try {
      const response = await fetch('/api/social/instagram-link-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          igUserId: selectedAccount.igUserId,
          igUsername: selectedAccount.igUsername,
          fbPageId: selectedAccount.fbPageId,
        }),
      });

      const data = await response.json();
      toast.dismiss();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to link Instagram account.');
      }

      toast.success(data.message || 'Instagram account linked successfully!');
      setIsInstagramConnected(true);
      setInstagramUsername(selectedAccount.igUsername);
      setIgConnectData(null);

    } catch (error) {
      toast.dismiss();
      console.error('Error linking Instagram account:', error);
      toast.error(error.message || 'Failed to link Instagram account.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleFacebookPageSelected = async (selectedPage) => {
      if (!selectedPage || !fbConnectData) return;

      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
          toast.error('You seem to be logged out. Please log in again.');
          return;
      }
      
      setIsLinking(true); 
      setShowFacebookPageModal(false);
      toast.loading('Linking selected Facebook Page...');

      try {
          const response = await fetch('/api/social/facebook-link-page', { 
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionToken}`
              },
              body: JSON.stringify({
                  fbPageId: selectedPage.fbPageId,
                  fbPageName: selectedPage.fbPageName,
                  fbPageAccessToken: selectedPage.fbPageAccessToken,
                  facebookUserId: fbConnectData.facebookUserId,
                  fbUserAccessToken: fbConnectData.fbUserAccessToken,
                  fbTokenExpiry: fbConnectData.fbTokenExpiry
              }),
          });

          const data = await response.json();
          toast.dismiss();

          if (!response.ok || !data.success) {
              throw new Error(data.message || 'Failed to link Facebook Page.');
          }

          toast.success(data.message || 'Facebook Page linked successfully!');
          setIsFacebookConnected(true);
          setFacebookPageName(selectedPage.fbPageName);
          setFbConnectData(null);

      } catch (error) {
          toast.dismiss();
          console.error('Error linking Facebook Page:', error);
          toast.error(error.message || 'Failed to link Facebook Page.');
      } finally {
          setIsLinking(false); 
      }
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
                  {isFacebookConnected && facebookPageName && (
                    <p className="connected-account-info">Connected Page: <strong>{facebookPageName}</strong></p>
                  )}
                  <p>{isFacebookConnected ? 'Facebook Page connected.' : 'Connect your Facebook account to post property designs directly to your pages.'}</p>
                  {isFacebookConnected ? (
                    <button 
                      className="button secondary" 
                      onClick={handleDisconnectFacebook}
                      disabled={isConnecting || isLinking}
                    >
                      Disconnect Facebook
                    </button>
                  ) : (
                    <button 
                      className="button primary" 
                      onClick={handleConnectFacebook}
                      disabled={isConnecting || isLinking}
                    >
                      {(isConnecting || isLinking) ? "Processing..." : "Connect Facebook"}
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
                  {isInstagramConnected && instagramUsername && (
                    <p className="connected-account-info">Connected Account: <strong>@{instagramUsername}</strong></p>
                  )}
                  <p>{isInstagramConnected ? 'Instagram account connected.' : 'Connect your Instagram Business account (via Facebook) to post property designs.'}</p>
                  {isInstagramConnected ? (
                    <button
                      className="button secondary"
                      onClick={handleDisconnectInstagram}
                      disabled={isConnecting || isLinking}
                    >
                      Disconnect Instagram
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      onClick={handleConnectInstagram}
                      disabled={isConnecting || isLinking}
                    >
                      {(isConnecting || isLinking) ? "Processing..." : "Connect Instagram"}
                    </button>
                  )}
                  {!isInstagramConnected && (
                    <p className="small-text">Note: Requires a connected Facebook Business account with an associated Instagram Business profile.</p>
                  )}
                </div>
              </Card>

              {/* TODO: Add other settings sections (e.g., Profile, Billing) */}

            </div>
          </main>
        </div>
      </div>

      <FacebookPageSelectModal
        isOpen={showFacebookPageModal}
        onClose={() => setShowFacebookPageModal(false)}
        pages={availableFbPages}
        onConnect={handleFacebookPageSelected}
        isLoading={isLinking}
      />
      <InstagramConnectInfoModal 
        isOpen={showInstagramInfoModal}
        onClose={() => setShowInstagramInfoModal(false)}
        onProceed={proceedWithInstagramConnect}
      />
      <InstagramAccountSelectModal 
        isOpen={showInstagramSelectModal}
        onClose={() => setShowInstagramSelectModal(false)}
        accounts={availableIgAccounts}
        onConnect={handleInstagramAccountSelected}
        isLoading={isLinking}
      />

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
        .connected-account-info {
            font-size: 0.9rem;
            color: #4b5563;
            margin-bottom: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #e6f4ea;
            border: 1px solid #c8e6c9;
            border-radius: 6px;
            display: inline-block;
        }
        .connected-account-info strong {
            color: #2e7d32;
        }
        @media (max-width: 768px) {
          .dashboard-container {
            margin-left: 0;
            padding-top: 64px; /* Height of mobile header */
          }
        }
      `}</style>
    </ProtectedRoute>
  );
} 