import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { PreviewModalProvider } from '../src/context/PreviewModalContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { isAmplifyConfigured, configureAmplify } from '../src/aws/config';

// Function to load Facebook SDK
const loadFacebookSDK = () => {
  return new Promise((resolve) => {
    // Check if SDK is already loaded
    if (document.getElementById('facebook-jssdk')) {
      resolve();
      return;
    }

    window.fbAsyncInit = function() {
      FB.init({
        appId            : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie           : true,  // Enable cookies to allow the server to access the session.
        xfbml            : true,  // Parse social plugins on this webpage.
        version          : 'v18.0' // Use the latest graph api version
      });
      FB.AppEvents.logPageView();   
      console.log('Facebook SDK initialized.');
      resolve();
    };

    // Load the SDK asynchronously
    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;} // Already loaded
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  });
};

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  const [amplifyReady, setAmplifyReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false); // State for FB SDK
  const [initError, setInitError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Initialize Amplify & Facebook SDK on client-side
  useEffect(() => {
    setIsClient(true);
    let amplifyTimer = null;

    const initialize = async () => {
      try {
        // --- Amplify Initialization ---
        if (!isAmplifyConfigured()) {
          const configured = configureAmplify();
          if (!configured) {
            console.log('Retrying Amplify configuration...');
            amplifyTimer = setTimeout(() => {
              const retryResult = configureAmplify();
              setAmplifyReady(retryResult);
              if (!retryResult) {
                console.error('Failed to configure Amplify after retry');
                setInitError('Failed to initialize authentication system');
              }
            }, 1500);
          } else {
            console.log('Amplify configured successfully');
            setAmplifyReady(true);
          }
        } else {
          console.log('Amplify already configured');
          setAmplifyReady(true);
        }

        // --- Facebook SDK Initialization ---
        if (process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
          await loadFacebookSDK();
          setFacebookReady(true);
        } else {
          console.warn('Facebook App ID not configured, skipping SDK load.');
          setFacebookReady(true); // Consider it 'ready' if not needed
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        setInitError(error.message || 'Failed to initialize application');
      }
    };

    initialize();
    
    // Cleanup timer if component unmounts
    return () => clearTimeout(amplifyTimer);

  }, []);

  // Track loading time and force a reload if it takes too long
  useEffect(() => {
    // Only track if Amplify or Facebook SDK are still loading
    if (!isClient || (amplifyReady && facebookReady)) return;
    
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        console.log(`App has been loading for ${newTime} seconds (Amplify: ${amplifyReady}, FB: ${facebookReady})`);
        
        // If still loading after 30 seconds, try force reloading
        if (newTime >= 30 && typeof window !== 'undefined') {
          console.error('App stuck in loading state for 30 seconds, forcing reload');
          clearInterval(interval);
          window.location.reload();
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isClient, amplifyReady, facebookReady]); // Depend on both readiness states

  // Validate essential environment variables on startup
  useEffect(() => {
    const requiredVars = {
      NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
      NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
      BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
      BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
      // Check for Facebook App ID only if intended to be used
      NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    };

    // Check if any required vars are missing
    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.warn(
        `⚠️ Missing environment variables: ${missingVars.join(', ')}\n` +
        `Please ensure these are set in your .env file or environment.`
      );
      
      // Set init error if critical variables are missing
      if (
        missingVars.includes('NEXT_PUBLIC_USER_POOL_ID') || 
        missingVars.includes('NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID')
      ) {
        setInitError('Missing required authentication configuration.');
      }
      if (missingVars.includes('NEXT_PUBLIC_FACEBOOK_APP_ID')) {
         // Only warn if FB connect is a core feature, maybe not an error yet
         console.warn('Facebook App ID is missing. Social connection features may be disabled.');
      }
    }
  }, []);

  // Show loading state when not ready
  if (!isClient || !amplifyReady || !facebookReady) { // Check both readiness states
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%)' 
      }}>
        {initError ? (
          <div style={{ maxWidth: '500px', textAlign: 'center', padding: '20px' }}>
            <h2 style={{ color: '#721c24' }}>Application Error</h2>
            <p>{initError}</p>
            <p>Please check your configuration or contact support.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#62d76b',
                color: '#000',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Reload Page
            </button>
          </div>
        ) : (
          <>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #62d76b', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '20px' }}>Loading application... {loadingTime > 5 ? `(${loadingTime}s)` : ''}</p>
            {loadingTime > 10 && (
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: '#62d76b',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Force Reload
              </button>
            )}
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreviewModalProvider>
          <Component {...pageProps} />
          <Toaster position="bottom-center" />
        </PreviewModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 