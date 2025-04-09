import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { isAmplifyConfigured, configureAmplify } from '../src/aws/config';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);
  const [amplifyReady, setAmplifyReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Initialize Amplify on client-side
  useEffect(() => {
    setIsClient(true);
    
    try {
      // First check if already configured
      if (isAmplifyConfigured()) {
        console.log('Amplify already configured');
        setAmplifyReady(true);
        return;
      }
      
      // Try to configure Amplify
      const configured = configureAmplify();
      
      if (configured) {
        console.log('Amplify configured successfully');
        setAmplifyReady(true);
      } else {
        // Retry after a short delay
        console.log('Retrying Amplify configuration...');
        const timer = setTimeout(() => {
          const retryResult = configureAmplify();
          setAmplifyReady(retryResult);
          
          if (!retryResult) {
            console.error('Failed to configure Amplify after retry');
            setInitError('Failed to initialize authentication system');
          }
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error('Error during Amplify initialization:', error);
      setInitError(error.message || 'Failed to initialize application');
    }
  }, []);

  // Track loading time and force a reload if it takes too long
  useEffect(() => {
    if (!isClient || amplifyReady) return;
    
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        console.log(`App has been loading for ${newTime} seconds`);
        
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
  }, [isClient, amplifyReady]);

  // Validate essential environment variables on startup
  useEffect(() => {
    const requiredVars = {
      NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
      NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
      BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
      BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
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
      
      // Set init error if critical authentication variables are missing
      if (
        missingVars.includes('NEXT_PUBLIC_USER_POOL_ID') || 
        missingVars.includes('NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID')
      ) {
        setInitError('Missing required authentication configuration. Please check your environment variables.');
      }
    }
  }, []);

  // Show loading state when not ready
  if (!isClient || !amplifyReady) {
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
        <Component {...pageProps} />
        <Toaster position="bottom-center" />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 