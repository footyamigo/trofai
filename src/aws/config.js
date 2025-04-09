import { Amplify } from 'aws-amplify';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Configure AWS Amplify
 * This function initializes AWS Amplify with the configuration from environment variables
 */
export const configureAmplify = () => {
  if (!isBrowser) {
    console.log('Skipping Amplify configuration on server');
    return false;
  }

  try {
    // Get access to Amplify
    let Amplify;
    try {
      Amplify = require('@aws-amplify/core').Amplify;
    } catch (e) {
      console.error('Failed to import Amplify:', e);
      return false;
    }
    
    // Get environment variables - supporting both with and without AWS_ prefix
    const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.REGION || 'us-east-1';
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
    const userPoolWebClientId = process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID;
    
    // Check for required environment variables
    if (!userPoolId || !userPoolWebClientId) {
      console.error('Missing required Cognito configuration:', {
        userPoolId: userPoolId ? 'SET' : 'MISSING',
        userPoolWebClientId: userPoolWebClientId ? 'SET' : 'MISSING',
        region
      });
      return false;
    }

    // Construct config object
    const config = {
      Auth: {
        region,
        userPoolId,
        userPoolWebClientId,
        mandatorySignIn: true
      }
    };

    // Add Cognito configuration required by Amplify v6
    config.Auth.Cognito = {
      userPoolId: config.Auth.userPoolId,
      userPoolWebClientId: config.Auth.userPoolWebClientId
    };

    // Log configuration
    console.debug('Configuring Amplify with:', {
      region: config.Auth.region,
      userPoolId: config.Auth.userPoolId && config.Auth.userPoolId.substring(0, 10) + '...',
      userPoolWebClientId: config.Auth.userPoolWebClientId && config.Auth.userPoolWebClientId.substring(0, 5) + '...',
    });

    // Configure Amplify
    Amplify.configure(config);
    console.debug('Amplify configuration successful');
    return true;
  } catch (error) {
    console.error('Error configuring Amplify:', error);
    return false;
  }
};

// Initialize Amplify when this module is imported
let isConfigured = false;
let configAttempts = 0;
const MAX_ATTEMPTS = 3;

const attemptConfiguration = () => {
  if (isBrowser && !isConfigured && configAttempts < MAX_ATTEMPTS) {
    console.log(`Attempting to configure Amplify (attempt ${configAttempts + 1}/${MAX_ATTEMPTS})`);
    try {
      isConfigured = configureAmplify();
      configAttempts++;
      
      if (!isConfigured && configAttempts < MAX_ATTEMPTS) {
        console.log(`Configuration failed, retrying in ${configAttempts * 500}ms...`);
        setTimeout(attemptConfiguration, configAttempts * 500);
      } else if (isConfigured) {
        console.log('Amplify successfully configured after', configAttempts, 'attempts');
      } else {
        console.error('Failed to configure Amplify after', MAX_ATTEMPTS, 'attempts');
      }
    } catch (e) {
      console.error('Error during Amplify configuration attempt:', e);
      configAttempts++;
      
      if (configAttempts < MAX_ATTEMPTS) {
        setTimeout(attemptConfiguration, configAttempts * 500);
      }
    }
  }
};

// Start configuration process if in browser
if (isBrowser) {
  attemptConfiguration();
}

// Export a function to check if Amplify is configured
export const isAmplifyConfigured = () => {
  // If we haven't tried configuring yet or haven't succeeded, try again
  if (isBrowser && !isConfigured && configAttempts < MAX_ATTEMPTS) {
    attemptConfiguration();
  }
  
  return isConfigured;
}; 