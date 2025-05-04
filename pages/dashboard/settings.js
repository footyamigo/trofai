import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import Sidebar from '../../components/Layout/Sidebar';
import MobileMenu from '../../components/Layout/MobileMenu';
import Card from '../../components/UI/Card';
import { toast } from 'react-hot-toast';
import { FaFacebookSquare, FaInstagram, FaLinkedin } from 'react-icons/fa';
import InstagramConnectInfoModal from '../../components/UI/InstagramConnectInfoModal';
import InstagramAccountSelectModal from '../../components/UI/InstagramAccountSelectModal';
import FacebookPageSelectModal from '../../components/UI/FacebookPageSelectModal';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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
  const router = useRouter();
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showInstagramInfoModal, setShowInstagramInfoModal] = useState(false);
  const [showInstagramSelectModal, setShowInstagramSelectModal] = useState(false);
  const [availableIgAccounts, setAvailableIgAccounts] = useState([]);
  const [showFacebookPageModal, setShowFacebookPageModal] = useState(false);
  const [availableFbPages, setAvailableFbPages] = useState([]);
  const [fbConnectData, setFbConnectData] = useState(null);
  const [facebookPageName, setFacebookPageName] = useState(null);
  const [instagramUsername, setInstagramUsername] = useState(null);
  const [igConnectData, setIgConnectData] = useState(null);

  // LinkedIn State
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [linkedinName, setLinkedinName] = useState(null);

  // Agent Profile State
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentPhotoFile, setAgentPhotoFile] = useState(null);
  const [agentPhotoPreview, setAgentPhotoPreview] = useState(null);
  const [isSavingAgentInfo, setIsSavingAgentInfo] = useState(false);

  // Account Profile State (Password Only)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('social'); // 'social', 'agent', 'account'

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
          setIsLinkedInConnected(false);
          setFacebookPageName(null);
          setInstagramUsername(null);
          setLinkedinName(null);
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
          setIsLinkedInConnected(data.connections.linkedin || false);
          setLinkedinName(data.connections.linkedinName || null);
        } else {
          console.error('Failed to fetch social status:', data.message);
           setIsFacebookConnected(false);
           setIsInstagramConnected(false);
           setIsLinkedInConnected(false);
           setFacebookPageName(null);
           setInstagramUsername(null);
           setLinkedinName(null);
        }
      } catch (error) {
         if (!isMounted) return; 
         console.error('Error fetching social status:', error);
         setIsFacebookConnected(false);
         setIsInstagramConnected(false);
         setIsLinkedInConnected(false);
         setFacebookPageName(null);
         setInstagramUsername(null);
         setLinkedinName(null);
      } finally {
         if (isMounted) {
            setIsLoadingStatus(false);
         }
      }
    };

    fetchStatus();

    return () => { isMounted = false; };

  }, []);

  // Handle Redirects from LinkedIn OAuth Callback
  useEffect(() => {
    const { linkedin_connected, linkedin_error } = router.query;

    // Define fetchStatus locally if it's not accessible or redefine it if needed
    // This assumes fetchStatus is defined in the outer scope of SettingsPage
    const triggerStatusFetch = async () => {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) return; // No need to fetch if logged out
      
      setIsLoadingStatus(true); // Show loading while fetching
      try {
        const response = await fetch('/api/social/status', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const data = await response.json();
        if (data.success && data.connections) {
          setIsFacebookConnected(data.connections.facebook || false);
          setFacebookPageName(data.connections.facebookPageName || null);
          setIsInstagramConnected(data.connections.instagram || false);
          setInstagramUsername(data.connections.instagramUsername || null);
          setIsLinkedInConnected(data.connections.linkedin || false);
          setLinkedinName(data.connections.linkedinName || null);
        } else {
          // Handle error case, maybe show a toast
          console.error('Failed to re-fetch social status after LinkedIn connect:', data.message);
        }
      } catch (error) {
        console.error('Error re-fetching social status after LinkedIn connect:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    if (linkedin_connected === 'true') {
      toast.success('LinkedIn connected successfully!');
      // Clean up URL first
      const { pathname, query } = router;
      delete query.linkedin_connected;
      router.replace({ pathname, query }, undefined, { shallow: true });
      
      // THEN trigger status refresh
      triggerStatusFetch(); 
    }

    if (linkedin_error) {
      toast.error(`LinkedIn connection failed: ${linkedin_error}`);
      // Clean up URL
      const { pathname, query } = router;
      delete query.linkedin_error;
      router.replace({ pathname, query }, undefined, { shallow: true });
    }
    // Ensure fetchStatus is listed as a dependency if it's defined outside this hook
    // and relies on state/props. If it's defined inside SettingsPage, it's fine.
  }, [router.query, router]); // Add router to dependencies

  useEffect(() => {
    let isMounted = true;
    const fetchAgentProfile = async () => {
      const sessionToken = localStorage.getItem('session');
      if (!sessionToken) {
        console.log('Agent Profile: No session token, cannot fetch data.');
        return;
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
        } else {
          console.error('Failed to fetch agent profile:', data.message || 'Unknown error');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching agent profile:', error);
      }
    };

    fetchAgentProfile();

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
                setIsConnecting(false); 
                console.error('Error fetching Instagram accounts list:', error);
                toast.error(error.message || 'Failed to fetch Instagram accounts list.');
            });
        } else {
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

  const handleConnectLinkedIn = () => {
    setIsConnecting(true);
    toast.loading('Redirecting to LinkedIn...');

    // Get the current session token
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.dismiss();
      setIsConnecting(false);
      toast.error('Authentication error. Please log in again.');
      return;
    }

    // Use the session token as the state parameter for user linking
    // NOTE: For stronger CSRF protection, generate a separate random value,
    // store it server-side associated with the session, send the random value
    // as state, and verify it on the backend against the stored value.
    // const csrfState = Math.random().toString(36).substring(2); 
    // storeCsrfStateForSession(sessionToken, csrfState); // Hypothetical server call
    // const stateValue = csrfState; 
    const stateValue = sessionToken; // Using session token directly for now

    // We no longer need to store this separately in localStorage for validation
    // localStorage.setItem('linkedin_oauth_state', csrfState);

    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/social/linkedin-connect` 
      : 'http://localhost:3000/api/social/linkedin-connect';
      
    if (!clientId) {
        toast.dismiss();
        setIsConnecting(false);
        toast.error('LinkedIn Client ID is not configured. Please contact support.');
        console.error('Missing NEXT_PUBLIC_LINKEDIN_CLIENT_ID environment variable');
        return;
    }

    const scope = encodeURIComponent('openid profile email w_member_social');
    // Pass the session token (or CSRF token) as the state value
    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateValue}&scope=${scope}`;

    window.location.href = linkedInAuthUrl;
  };

  const handleDisconnectLinkedIn = () => {
    const sessionToken = localStorage.getItem('session');
    if (!sessionToken) {
      toast.error('Authentication error. Please log in again.');
      return;
    }
    
    setIsLinking(true);

    toast.promise(
      fetch('/api/social/linkedin-disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }).then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'Failed to disconnect');
          }).catch(() => { throw new Error('Failed to disconnect LinkedIn.'); });
        }
        return res.json();
      }),
      {
        loading: 'Disconnecting LinkedIn...',
        success: (data) => {
          setIsLinking(false);
          if (data.success) {
            setIsLinkedInConnected(false);
            setLinkedinName(null);
            return 'LinkedIn disconnected successfully.';
          } else {
            throw new Error(data.message || 'Failed to disconnect LinkedIn');
          }
        },
        error: (err) => {
          setIsLinking(false);
          return err.message || 'Failed to disconnect LinkedIn.';
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

    const formData = new FormData();
    formData.append('agentName', agentName);
    formData.append('agentEmail', agentEmail);
    formData.append('agentPhone', agentPhone);
    if (agentPhotoFile) {
      formData.append('agentPhoto', agentPhotoFile);
    }

    try {
      const response = await fetch('/api/agent/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save agent information.');
      }

      toast.success('Agent information saved successfully!', { id: toastId });

    } catch (error) {
      console.error('Error saving agent info:', error);
      toast.error(error.message || 'Failed to save agent information.', { id: toastId });
    } finally {
      setIsSavingAgentInfo(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    setIsUpdatingAccount(true);
    const toastId = toast.loading('Changing password...');

    try {
      // 1. Get the custom session token from local storage
      const sessionToken = localStorage.getItem('session'); 

      if (!sessionToken) {
        // This case might indicate the user's session expired between page load and action
        throw new Error('Session not found. Please log in again.');
      }

      // 2. Call the backend API endpoint
      const response = await fetch('/api/auth/change-password', { // Call our backend API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send the *custom session token* in the Authorization header
          'Authorization': `Bearer ${sessionToken}` 
        },
        body: JSON.stringify({ 
          currentPassword: currentPassword, 
          newPassword: newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) { // Check response status code for errors
        // Use the specific error message from the backend
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      // Assuming success if response.ok is true and no error was thrown
      toast.dismiss(toastId);
      toast.success('Password changed successfully!');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (error) {
      toast.dismiss(toastId);
      console.error("Error changing password:", error);
      // Display the error message (could be from backend or frontend validation)
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdatingAccount(false);
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

              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button 
                  className={`tab-button ${activeTab === 'social' ? 'active' : ''}`}
                  onClick={() => setActiveTab('social')}
                >
                  Social Connections
                </button>
                <button 
                  className={`tab-button ${activeTab === 'agent' ? 'active' : ''}`}
                  onClick={() => setActiveTab('agent')}
                >
                  Agent Profile
                </button>
                <button 
                  className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveTab('account')}
                >
                  Account Profile
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'social' && (
                  <Card title="Social Media Connections">
                    <div className="social-connection">
                      <div className="connection-header">
                        <h2><FaFacebookSquare style={{ marginRight: '8px', color: '#1877F2' }}/> Facebook</h2>
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
                        <h2><FaInstagram style={{ marginRight: '8px', color: '#E4405F' }}/> Instagram</h2>
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

                    <div className="social-connection">
                      <div className="connection-header">
                        <h2><FaLinkedin style={{ marginRight: '8px', color: '#0A66C2' }}/> LinkedIn</h2>
                        {isLinkedInConnected ? (
                          <span className="status connected">Connected</span>
                        ) : (
                          <span className="status disconnected">Not Connected</span>
                        )}
                      </div>
                      {isLinkedInConnected && linkedinName && (
                        <p className="connected-account-info">Connected Account: <strong>{linkedinName}</strong></p>
                      )}
                      <p>{isLinkedInConnected ? 'LinkedIn account connected.' : 'Connect your LinkedIn account to share property designs with your professional network.'}</p>
                      {isLinkedInConnected ? (
                        <button
                          className="button secondary"
                          onClick={handleDisconnectLinkedIn}
                          disabled={isConnecting || isLinking}
                        >
                          Disconnect LinkedIn
                        </button>
                      ) : (
                        <button
                          className="button primary"
                          onClick={handleConnectLinkedIn}
                          disabled={isConnecting || isLinking}
                        >
                          {(isConnecting || isLinking) ? "Processing..." : "Connect LinkedIn"}
                        </button>
                      )}
                      {!isLinkedInConnected && (
                         <p className="small-text">Ensure you allow sharing permissions when connecting.</p>
                      )}
                    </div>
                  </Card>
                )}

                {activeTab === 'agent' && (
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
                            onClick={() => { setAgentPhotoFile(null); setAgentPhotoPreview(null); }}
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
                )}

                {activeTab === 'account' && (
                  <Card title="Account Profile" className="account-profile-card">
                    <p className="card-subtitle">Manage your account security settings.</p>
                    
                    <div className="password-change-section">
                      <h3 className="section-subheader">Change Password</h3>
                      <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            disabled={isUpdatingAccount}
                          />
                          <button
                            type="button"
                            className="password-visibility-toggle"
                            tabIndex={-1}
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                          >
                            {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your new password"
                            disabled={isUpdatingAccount}
                          />
                          <button
                            type="button"
                            className="password-visibility-toggle"
                            tabIndex={-1}
                            onClick={() => setShowNewPassword((v) => !v)}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmNewPassword">Confirm New Password</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmNewPassword ? "text" : "password"}
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm your new password"
                            disabled={isUpdatingAccount}
                          />
                          <button
                            type="button"
                            className="password-visibility-toggle"
                            tabIndex={-1}
                            onClick={() => setShowConfirmNewPassword((v) => !v)}
                            aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmNewPassword ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button 
                          className="button primary save-button"
                          onClick={handleChangePassword}
                          disabled={isUpdatingAccount || !currentPassword || !newPassword || !confirmNewPassword}
                        >
                          {isUpdatingAccount ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

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

        /* Tab Styles Start */
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e7eb; 
          margin-bottom: 2rem;
        }
        .tab-button {
          padding: 0.8rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: -1px; /* Overlap border */
          border-bottom: 2px solid transparent; 
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .tab-button:hover {
          color: #1f2937;
        }
        .tab-button.active {
          color: #62d76b; /* Theme color */
          border-bottom-color: #62d76b; /* Theme color */
        }
        .tab-content {
           /* Add any specific styles for the content area below tabs if needed */
        }
        /* Tab Styles End */

        /* Card and Form Styles */
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
          display: flex;
          align-items: center;
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
        .agent-profile-card,
        .account-profile-card {
          /* Cards within tabs don't need margin-top usually */
        }
        .card-subtitle {
          font-size: 0.95rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
          margin-top: -0.5rem; /* Adjust if needed based on card padding */
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
        .form-group input[type="tel"],
        .form-group input[type="password"] { /* Added password */
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
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
        .file-upload-button {
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
           padding: 0.6rem 1.0rem;
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
        .password-change-section {
           margin-top: 0; /* Reset margin */
           padding-top: 1.5rem; /* Add padding above the header */
           border-top: none; /* No border needed inside card */
        }
        .password-change-section .form-actions {
           border-top: none; /* Remove border above password change button */
           padding-top: 0.5rem; /* Adjust spacing if needed */
           margin-top: 1rem; /* Adjust spacing */
        }
        .section-subheader {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1.5rem;
        }
        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrapper input {
          flex: 1;
        }
        .password-visibility-toggle {
          background: none;
          border: none;
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #6b7280;
          font-size: 1.2rem;
          padding: 0 0.25rem;
          display: flex;
          align-items: center;
        }
        .password-visibility-toggle:focus {
          outline: 2px solid #62d76b;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            margin-left: 0;
            padding-top: 64px;
          }
          .tab-navigation {
            /* Example: Make tabs scrollable horizontally on small screens */
            overflow-x: auto;
            white-space: nowrap;
            margin-bottom: 1.5rem;
          }
          .tab-button {
             padding: 0.6rem 1rem;
             font-size: 0.9rem;
          }
        }
      `}</style>
    </ProtectedRoute>
  );
} 