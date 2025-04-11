import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check authentication only after loading is complete
    if (!loading && !user) {
      console.log('Protected route: User not authenticated, redirecting to sign-in');
      router.replace('/auth/signin');
    }
  }, [user, loading, router]);

  // Show loading state if authentication is still being checked
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100%;
          }
          .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #62d76b;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          p {
            color: #4a5568;
            font-size: 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated and not loading, don't render children
  if (!user && !loading) {
    return null;
  }

  // Authentication verified, render children
  return children;
} 