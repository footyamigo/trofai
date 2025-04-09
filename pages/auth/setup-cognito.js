import { useState } from 'react';
import Head from 'next/head';

export default function SetupCognito() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/setup-cognito-ses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to configure Cognito with SES');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Error setting up Cognito:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Setup Cognito with SES - Trofai</title>
        <meta name="description" content="Configure Cognito to use SES for email delivery" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">Setup Cognito with SES</h1>
        
        <p className="description">
          This utility will configure your Cognito User Pool to use Amazon SES for sending emails.
        </p>
        
        <div className="card">
          <div className="form-group">
            <label htmlFor="testEmail">Test Email (optional):</label>
            <input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to test verification"
              className="input"
            />
            <p className="hint">If provided, a test verification email will be sent to this address</p>
          </div>
          
          <button 
            onClick={handleSetup} 
            disabled={loading} 
            className="button"
          >
            {loading ? 'Configuring...' : 'Configure Cognito with SES'}
          </button>
        </div>
        
        {error && (
          <div className="error">
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
        
        {result && (
          <div className="result">
            <h3>Result:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </main>

      <style jsx>{`
        .container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .main {
          min-height: 100vh;
          padding: 4rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 2.5rem;
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .description {
          margin: 1rem 0;
          line-height: 1.5;
          font-size: 1.25rem;
          text-align: center;
        }
        
        .card {
          margin: 2rem 0;
          padding: 1.5rem;
          background-color: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          width: 100%;
          max-width: 600px;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .input {
          width: 100%;
          padding: 0.75rem;
          font-size: 1rem;
          border: 1px solid #d1d1d1;
          border-radius: 5px;
          margin-bottom: 0.5rem;
        }
        
        .hint {
          font-size: 0.875rem;
          color: #666;
          margin: 0;
        }
        
        .button {
          padding: 0.75rem 1.5rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .button:hover {
          background-color: #388e3c;
        }
        
        .button:disabled {
          background-color: #a5d6a7;
          cursor: not-allowed;
        }
        
        .error, .result {
          margin-top: 2rem;
          padding: 1rem;
          border-radius: 5px;
          width: 100%;
          max-width: 600px;
        }
        
        .error {
          background-color: #ffebee;
          border: 1px solid #ffcdd2;
        }
        
        .result {
          background-color: #e8f5e9;
          border: 1px solid #c8e6c9;
        }
        
        pre {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 1rem;
          border-radius: 5px;
          overflow: auto;
          max-height: 300px;
          width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
} 