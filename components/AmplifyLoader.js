import React, { useState, useEffect } from 'react';

export default function AmplifyLoader({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Allow time for Amplify to initialize
    setTimeout(() => {
      setIsReady(true);
    }, 1000);
  }, []);

  if (error) {
    return (
      <div className="amplify-error">
        <p>Error loading AWS Amplify: {error.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
        <style jsx>{`
          .amplify-error {
            padding: 20px;
            margin: 40px auto;
            max-width: 500px;
            text-align: center;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            background-color: #f8d7da;
            color: #721c24;
          }
          button {
            background-color: #0062cc;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
          }
        `}</style>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="amplify-loader">
        <div className="spinner"></div>
        <p>Loading application...</p>
        <style jsx>{`
          .amplify-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #09f;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
} 