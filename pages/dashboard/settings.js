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

// Loading spinner component
const LoadingView = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '3rem 1rem'
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #62d76b',
      animation: 'spinAnimation 1s ease infinite'
    }}></div>
    <p style={{ color: '#555', fontWeight: '500', marginTop: '1rem' }}>Loading settings...</p>
  </div>
);

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

  // Agent Profile State
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentPhotoFile, setAgentPhotoFile] = useState(null);
  const [agentPhotoPreview, setAgentPhotoPreview] = useState(null);
  const [isSavingAgentInfo, setIsSavingAgentInfo] = useState(false);

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

  // Add useEffect to load existing agent data
  useEffect(() => {
    let isMounted = true;
    const fetchAgentProfile = async () => {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        console.log('Agent Profile: No session token, cannot fetch data.');
        return; // Don't try to fetch if not logged in
      }

      try {
        console.log('Fetching agent profile data...');
        const response = await fetch('/api/agent/profile', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });

        if (!isMounted) return;

        const data = await response.json();

        if (response.ok && data.success && data.profile) {
          console.log('Agent profile data received:', data.profile);
          setAgentName(data.profile.agentName || '');
          setAgentEmail(data.profile.agentEmail || '');
          setAgentPhone(data.profile.agentPhone || '');
          setAgentPhotoPreview(data.profile.agentPhotoUrl || null);
          // Note: We don't set agentPhotoFile here, only the preview URL
        } else {
          console.error('Failed to fetch agent profile:', data.message || 'Unknown error');
          // Optionally show a toast error, but might be annoying on load
          // toast.error('Could not load your agent profile data.'); 
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching agent profile:', error);
        // toast.error('Error loading agent profile data.');
      }
    };

    fetchAgentProfile();

    return () => { isMounted = false; };

  }, []); // Run this effect once when the component mounts

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

  const handleAgentPhotoChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAgentPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgentPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAgentPhotoFile(null);
      setAgentPhotoPreview(null);
      if (file) {
        toast.error('Please select a valid image file.');
      }
    }
  };

  const handleSaveAgentInfo = async () => {
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }

    setIsSavingAgentInfo(true);
    const toastId = toast.loading('Saving agent information...');

    // Use FormData to handle file upload along with text fields
    const formData = new FormData();
    formData.append('agentName', agentName);
    formData.append('agentEmail', agentEmail);
    formData.append('agentPhone', agentPhone);
    if (agentPhotoFile) {
      formData.append('agentPhoto', agentPhotoFile);
    }

    try {
      // TODO: Create and call the API endpoint '/api/agent/profile'
      const response = await fetch('/api/agent/profile', { // Changed endpoint
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json', // Don't set Content-Type when using FormData
          'Authorization': `Bearer ${sessionToken}`
        },
        body: formData, // Send FormData directly
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save agent information.');
      }

      toast.success('Agent information saved successfully!', { id: toastId });
      // Optionally update user context or refetch data if needed

    } catch (error) {
      console.error('Error saving agent info:', error);
      toast.error(error.message || 'Failed to save agent information.', { id: toastId });
    } finally {
      setIsSavingAgentInfo(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <ProtectedRoute>
        <div className="dashboard">
          <Head><title>Settings - Trofai</title></Head>
          <MobileMenu activePage="settings" />
          <Sidebar activePage="settings" />
          <div className="dashboard-container">
            <DashboardHeader />
            <main className="main">
              <div className="content">
                <LoadingView />
              </div>
            </main>
          </div>
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
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 60vh;
            }
            @media (max-width: 768px) {
              .dashboard-container {
                margin-left: 0;
                padding-top: 64px;
              }
            }
            @keyframes spinAnimation {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
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

              {/* --- Agent Profile Section --- */}
              <Card title="Agent Profile" className="agent-profile-card">
                <p className="card-subtitle">Update your details shown on generated property images.</p>
                
                <div className="form-group">
                  <label htmlFor="agentName">Agent Name</label>
                  <input 
                    type="text" 
                    id="agentName" 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isSavingAgentInfo}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="agentEmail">Contact Email</label>
                  <input 
                    type="email" 
                    id="agentEmail" 
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    disabled={isSavingAgentInfo}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="agentPhone">Phone Number</label>
                  <input 
                    type="tel" 
                    id="agentPhone" 
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                    placeholder="+447123456789"
                    disabled={isSavingAgentInfo}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="agentPhoto">Profile Photo</label>
                  <div className="photo-upload-area">
                    {agentPhotoPreview && (
                      <img src={agentPhotoPreview} alt="Agent photo preview" className="photo-preview" />
                    )}
                    <input 
                      type="file" 
                      id="agentPhoto" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleAgentPhotoChange}
                      disabled={isSavingAgentInfo}
                      className="file-input"
                    />
                    <label htmlFor="agentPhoto" className="button file-upload-button">
                      {agentPhotoPreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    {agentPhotoPreview && (
                      <button 
                        className="button secondary remove-photo-button" 
                        onClick={() => { setAgentPhotoFile(null); setAgentPhotoPreview(null); /* TODO: Add API call to remove photo */ }}
                        disabled={isSavingAgentInfo}
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="small-text">Recommended size: 200x200px. Max 2MB.</p>
                </div>

                <div className="form-actions">
                  <button 
                    className="button primary save-button" 
                    onClick={handleSaveAgentInfo}
                    disabled={isSavingAgentInfo}
                  >
                    {isSavingAgentInfo ? 'Saving...' : 'Save Agent Info'}
                  </button>
                </div>

              </Card>

              {/* TODO: Add other settings sections (e.g., Billing) */}

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
        .agent-profile-card {
          margin-top: 2rem; /* Add space above the new card */
        }
        .card-subtitle {
          font-size: 0.95rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
          margin-top: -0.5rem; /* Adjust spacing relative to Card title */
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #374151;
        }
        .form-group input[type="text"],
        .form-group input[type="email"],
        .form-group input[type="tel"] {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form-group input:focus {
          outline: none;
          border-color: #62d76b;
          box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.3);
        }
        .form-group input:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }
        .photo-upload-area {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .photo-preview {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e5e7eb;
        }
        .file-input {
          /* Hide the default file input */
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
        .file-upload-button {
          /* Style the custom button */
          padding: 0.6rem 1.2rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          background-color: white;
          color: #374151;
          transition: background-color 0.2s ease;
        }
        .file-upload-button:hover {
          background-color: #f9fafb;
        }
        .remove-photo-button {
           padding: 0.6rem 1.0rem; /* Slightly smaller padding */
           min-width: auto;
           font-size: 0.9rem;
        }
        .form-actions {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: right;
        }
        .save-button {
          min-width: 160px;
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