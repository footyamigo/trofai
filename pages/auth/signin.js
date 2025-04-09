import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import Link from 'next/link';
import Head from 'next/head';
import { FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../../components/UI/Button';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const { signIn } = useAuth();
  const router = useRouter();

  const slides = [
    {
      image: '/images/sign-in-image1.jpg',
      text: 'Elevate Your Listings\nWith AI-Powered Design'
    },
    {
      image: '/images/sign-in-image.jpg',
      text: 'Transform Properties\nInto Dream Homes'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting sign in for:', email);
      const user = await signIn(email, password);
      console.log('Sign in successful, redirecting to dashboard. User:', user ? 'Found' : 'Not found');
      
      if (user) {
        // Immediately redirect to dashboard using replace
        router.replace('/dashboard')
          .catch(err => {
            console.error('Router navigation failed:', err);
            window.location.replace('/dashboard');
          });
      }
    } catch (err) {
      console.error('Sign in error in component:', err);
      
      // Only set error if not a UserNotConfirmedException (that's handled by redirect)
      if (err.code !== 'UserNotConfirmedException') {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <Head>
        <title>Sign In - Trofai</title>
        <meta name="description" content="Sign in to your Trofai account" />
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
              <h2 className="auth-title">Sign in to your account</h2>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <Link href="/auth/forgot-password">
                  Forgot your password?
                </Link>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                isLoading={isLoading}
                fullWidth
              >
                Sign In
              </Button>
            </form>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link href="/auth/signup">
                  Sign up
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
        }

        .auth-form {
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          margin-bottom: 0.25rem;
        }

        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #1a1a1a;
          transition: all 0.2s ease;
        }

        .auth-input::placeholder {
          color: #a0aec0;
        }

        .auth-input:focus {
          outline: none;
          border-color: #62d76b;
          box-shadow: 0 0 0 3px rgba(98, 215, 107, 0.1);
          background: white;
        }

        .password-input-container {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #a0aec0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #4a5568;
        }

        .forgot-password {
          text-align: right;
          margin-bottom: 1rem;
        }

        .forgot-password a {
          color: #62d76b;
          text-decoration: none;
          font-size: 0.875rem;
          transition: color 0.2s ease;
        }

        .forgot-password a:hover {
          color: #4caf50;
          text-decoration: underline;
        }

        .auth-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          background: #62d76b;
          color: black;
          border: 2px solid black;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
        }

        .auth-button:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }

        .auth-button:disabled {
          background: #e2e8f0;
          color: #a0aec0;
          border-color: #a0aec0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(26, 26, 26, 0.3);
          border-radius: 50%;
          border-top-color: #1a1a1a;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: #fff5f5;
          color: #e53e3e;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          border: 1px solid #feb2b2;
        }

        .auth-footer {
          text-align: center;
          color: #718096;
          font-size: 0.875rem;
        }

        .auth-footer a {
          color: #62d76b;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .auth-footer a:hover {
          color: #4caf50;
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .auth-left {
            flex: 1;
          }
          
          .auth-right {
            flex: 1;
            padding: 3rem;
          }
        }

        @media (max-width: 768px) {
          .auth-card {
            flex-direction: column;
          }

          .auth-left {
            display: none;
          }

          .auth-right {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 