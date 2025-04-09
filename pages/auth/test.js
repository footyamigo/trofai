import { useState } from 'react';
import Head from 'next/head';

export default function Test() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  // Test Cognito Configuration
  const testConfig = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to test configuration');
      }
      
      setResults(data);
    } catch (err) {
      console.error('Error testing configuration:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // List Users in Cognito
  const listUsers = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/test-email?action=listUsers');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to list users');
      }
      
      setResults(data);
    } catch (err) {
      console.error('Error listing users:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Send Verification Email via Cognito directly
  const sendCognitoEmail = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification email');
      }
      
      setResults({
        success: true,
        message: 'Verification email sent via Cognito directly',
        details: data
      });
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Send Verification Email via SES
  const sendSESEmail = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification email');
      }
      
      setResults({
        success: true,
        message: 'Verification email sent via SES',
        details: data
      });
    } catch (err) {
      console.error('Error sending verification email:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Email Verification Test - Trofai</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">Email Verification Test</h1>
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button 
            className={`tab ${activeTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('verification')}
          >
            Send Verification
          </button>
        </div>
        
        <div className="card">
          {activeTab === 'config' && (
            <div>
              <h2>Test Cognito Configuration</h2>
              <div className="button-group">
                <button 
                  onClick={testConfig} 
                  disabled={loading} 
                  className="button"
                >
                  {loading ? 'Testing...' : 'Test Cognito Configuration'}
                </button>
                <button 
                  onClick={listUsers} 
                  disabled={loading} 
                  className="button"
                >
                  {loading ? 'Testing...' : 'List Users'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'verification' && (
            <div>
              <h2>Send Verification Email</h2>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input"
                />
              </div>
              
              <div className="button-group">
                <button 
                  onClick={sendCognitoEmail} 
                  disabled={loading || !email} 
                  className="button"
                >
                  {loading ? 'Sending...' : 'Send via Cognito'}
                </button>
                <button 
                  onClick={sendSESEmail} 
                  disabled={loading || !email} 
                  className="button"
                >
                  {loading ? 'Sending...' : 'Send via SES'}
                </button>
              </div>
              
              <p className="hint">
                <strong>Note:</strong> To receive verification emails, the user must exist in Cognito. 
                Try signing up first if you haven't already.
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error">
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
        
        {results && (
          <div className="result">
            <h3>Results:</h3>
            <pre>{JSON.stringify(results, null, 2)}</pre>
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
        
        .tabs {
          display: flex;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #eaeaea;
          width: 100%;
          max-width: 600px;
        }
        
        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        .tab.active {
          color: #4caf50;
          border-bottom: 2px solid #4caf50;
        }
        
        .card {
          margin: 1rem 0;
          padding: 1.5rem;
          background-color: #f9f9f9;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          width: 100%;
          max-width: 600px;
        }
        
        .card h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
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
        }
        
        .button-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
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
        
        .hint {
          font-size: 0.875rem;
          color: #666;
          margin-top: 1rem;
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
        }
      `}</style>
    </div>
  );
} 