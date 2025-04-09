import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import { FiArrowRight } from 'react-icons/fi';
import Button from '../../components/UI/Button';
import { toast } from 'react-hot-toast';

export default function ConfirmSignUp() {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const { confirmSignUpViaAPI, resendConfirmationCode } = useAuth();
  const router = useRouter();

  const slides = [
    {
      image: '/images/sign-in-image.jpg',
      text: 'Market Properties\nLike Never Before'
    },
    {
      image: '/images/sign-in-image1.jpg',
      text: 'AI-Powered Designs\nFor Every Listing'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get username from query params
    const { username: queryUsername } = router.query;
    if (queryUsername) {
      setUsername(queryUsername);
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Get the stored password
      const tempPassword = localStorage.getItem('tempSignupPassword');
      
      const response = await confirmSignUpViaAPI(username, code, tempPassword);

      // Clear the temporary password regardless of outcome
      localStorage.removeItem('tempSignupPassword');

      if (response.success) {
        if (response.session) {
          // If we got a session, we're automatically signed in - redirect to dashboard
          router.replace('/dashboard');
        } else {
          // No session means we need to sign in manually
          router.replace('/auth/signin');
        }
      }
    } catch (err) {
      console.error('Error confirming signup:', err);
      setError(err.message || 'Failed to confirm account. Please try again.');
      // Clear stored password if confirmation fails
      localStorage.removeItem('tempSignupPassword');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setIsSendingCode(true);

    try {
      await resendConfirmationCode(username);
      toast.success('Verification code sent! Please check your email.');
    } catch (err) {
      console.error('Error resending code:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="auth-page">
      <Head>
        <title>Confirm Account - Trofai</title>
        <meta name="description" content="Confirm your Trofai account" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="auth-card">
        <div className="auth-left" style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)), url('${slides[currentSlide].image}')`
        }}>
          <div className="back-to-website">
            <Link href="/">
              <FiArrowRight className="back-icon" />
              Back to website
            </Link>
          </div>
          <div className="auth-content">
            <h2 className="slogan">{slides[currentSlide].text}</h2>
            <div className="dots">
              {slides.map((_, index) => (
                <span 
                  key={index} 
                  className={`dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-container">
            <div className="auth-header">
              <div className="logo">
                <span className="logo-icon">🔥</span>
                <h1>Trofai</h1>
              </div>
              <h2 className="auth-title">Confirm your account</h2>
              <p className="auth-subtitle">Please enter the verification code sent to your email. If you don't see the email, check your spam folder.</p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Email</label>
                <input
                  id="username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="Enter verification code"
                  className="auth-input"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                isLoading={isLoading}
                fullWidth
              >
                Verify Account
              </Button>

              <div className="auth-links">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="text-button"
                >
                  {isSendingCode ? 'Sending...' : "Didn't receive a code? Send again"}
                </button>
              </div>
            </form>

            <div className="auth-footer">
              <p>
                Already verified?{' '}
                <Link href="/auth/signin">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          background: #1a1625;
        }

        .auth-card {
          display: flex;
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
        }

        .auth-left {
          flex: 1.2;
          background-size: cover;
          background-position: center;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          position: relative;
          justify-content: flex-end;
          transition: background-image 0.5s ease-in-out;
        }

        .back-to-website {
          position: absolute;
          top: 2rem;
          left: 2rem;
          z-index: 10;
        }

        .back-to-website a {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .back-to-website a:hover {
          opacity: 1;
        }

        .back-icon {
          transform: rotate(180deg);
        }

        .auth-content {
          margin: 0;
          padding: 0 2rem;
          position: relative;
          z-index: 5;
          text-align: left;
          width: 100%;
          max-width: 600px;
          margin-left: 2rem;
          margin-bottom: 2rem;
        }

        .slogan {
          font-size: 2.25rem;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.02em;
          opacity: 0.95;
          white-space: pre-line;
        }

        .dots {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .dot.active {
          background: #62d76b;
          width: 20px;
          border-radius: 12px;
        }

        .auth-right {
          flex: 0.8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          background: white;
        }

        .auth-container {
          width: 100%;
          max-width: 420px;
        }

        .auth-header {
          margin-bottom: 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .logo-icon {
          font-size: 1.75rem;
        }

        .logo h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.5px;
        }

        .auth-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          margin: 0;
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.5;
        }

        .auth-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
          position: relative;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #1f2937;
          transition: border-color 0.15s ease;
        }

        .auth-input:focus {
          outline: none;
          border-color: #62d76b;
          box-shadow: 0 0 0 3px rgba(98, 215, 107, 0.1);
        }

        .auth-input::placeholder {
          color: #9ca3af;
        }

        .auth-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .text-button {
          background: none;
          border: none;
          color: #62d76b;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.15s ease;
          outline: none;
        }

        .text-button:hover {
          color: #4baf54;
          text-decoration: underline;
        }

        .text-button:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        .auth-footer {
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .auth-footer a {
          color: #62d76b;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .auth-footer a:hover {
          color: #4baf54;
          text-decoration: underline;
        }

        .error-message {
          padding: 0.75rem 1rem;
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          color: #b91c1c;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .auth-card {
            flex-direction: column;
          }
          
          .auth-left {
            flex: 1;
            min-height: 200px;
          }
          
          .auth-right {
            flex: 1;
            padding: 2rem;
          }
          
          .auth-container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 