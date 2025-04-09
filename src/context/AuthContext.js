import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load
  useEffect(() => {
    if (isBrowser) {
      // Add safety timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.log('Auth loading timeout triggered - forcing loading state to complete');
        setLoading(false);
      }, 5000); // 5 seconds timeout (reduced from 10)

      // Attempt to check user authentication
      checkUser();
      
      return () => clearTimeout(loadingTimeout);
    } else {
      setLoading(false);
    }
  }, []);

  // Check current authentication state
  const checkUser = async () => {
    if (!isBrowser) {
      console.log('Skipping auth check - not in browser');
      setLoading(false);
      return null;
    }
    
    try {
      console.log('Checking current authenticated user...');
      setLoading(true);
      
      // Get session from local storage
      const session = localStorage.getItem('session');
      if (!session) {
        console.log('No session found in local storage');
        setUser(null);
        setLoading(false);
        return null;
      }

      // Validate session with server
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
      });

      if (!response.ok) {
        console.log('Session validation failed');
        localStorage.removeItem('session');
        setUser(null);
        setLoading(false);
        return null;
      }

      const userData = await response.json();
      if (!userData || !userData.username) {
        console.log('Invalid user data received');
        localStorage.removeItem('session');
        setUser(null);
        setLoading(false);
        return null;
      }

      console.log('User authenticated successfully:', userData.username);
      setUser(userData);
      setError(null);
      
    } catch (err) {
      console.error('Error checking authentication:', err);
      setUser(null);
      setError(err);
      localStorage.removeItem('session');
    } finally {
      setLoading(false);
    }
  };

  // Sign in user
  const signIn = async (username, password) => {
    if (!isBrowser) {
      console.error('Trying to sign in outside of browser environment');
      return null;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting to sign in with username:', username);
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }
      
      // Store session
      localStorage.setItem('session', data.session);
      
      // Set user data
      setUser(data.user);
      setError(null);
      toast.success('Successfully signed in');
      
      return data.user;
    } catch (err) {
      console.error('Sign in error:', err);
      
      // Handle specific error cases
      if (err.message.includes('not confirmed')) {
        toast.error('Your account has not been verified. Please check your email for a verification code.');
        // Redirect to confirmation page
        if (typeof window !== 'undefined') {
          window.location.href = `/auth/confirm?username=${encodeURIComponent(username)}`;
        }
      } else if (err.message.includes('incorrect')) {
        toast.error('Incorrect email or password. Please try again.');
      } else if (err.message.includes('not found')) {
        toast.error('No account found with this email. Please check your email or sign up.');
      } else {
        setError(err);
        toast.error(err.message || 'Error signing in');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const signOut = async () => {
    if (!isBrowser) return null;
    
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session: localStorage.getItem('session') }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      localStorage.removeItem('session');
      setUser(null);
      toast.success('Successfully signed out');
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Error signing out');
    }
  };

  // Sign up user
  const signUp = async (fullName, email, password) => {
    if (!isBrowser) return null;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user account');
      }
      
      toast.success('Registration successful! Please check your email for the verification code.');
      
      return {
        user: {
          username: email,
          attributes: {
            email,
            name: fullName
          }
        }
      };
    } catch (err) {
      console.error('SignUp error:', err);
      setError(err);
      toast.error(err.message || 'Error signing up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm sign up via API
  const confirmSignUpViaAPI = async (username, code, password) => {
    try {
      const response = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, code, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to confirm account');
      }
      
      const data = await response.json();
      console.log('Confirmation success:', data);

      // If we got back a session and user, update the auth context
      if (data.session && data.user) {
        localStorage.setItem('session', data.session);
        setUser(data.user);
      }

      toast.success('Account confirmed! Redirecting...');
      return data;
    } catch (err) {
      console.error('Confirm signup error:', err);
      setError(err);
      toast.error(err.message || 'Error confirming sign up');
      throw err;
    }
  };

  // Request password reset
  const forgotPassword = async (username) => {
    if (!isBrowser) return null;
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

      toast.success('Password reset instructions sent to your email');
      return true;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Error requesting password reset');
      throw err;
    }
  };

  // Resend confirmation code
  const resendConfirmationCode = async (username) => {
    try {
      console.log('Attempting to send verification email via SES for:', username);
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification email');
      }
      
      console.log('Verification email sent successfully:', data);
      toast.success('Verification email sent! Please check your inbox and spam folder.');
      return data;
    } catch (err) {
      console.error('Error sending verification email:', err);
      toast.error(err.message || 'Error sending verification code');
      throw err;
    }
  };

  // Complete password reset
  const forgotPasswordSubmit = async (username, code, newPassword) => {
    if (!isBrowser) return null;
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, code, newPassword }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password successfully reset. You can now sign in with your new password.');
      return true;
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Error resetting password');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
    confirmSignUpViaAPI,
    forgotPassword,
    forgotPasswordSubmit,
    resendConfirmationCode,
    checkUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 