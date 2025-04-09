import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { FiLogIn, FiUserPlus } from 'react-icons/fi';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="landing-page">
      <Head>
        <title>Trofai - Property Marketing Automation</title>
        <meta name="description" content="Generate stunning social media content for your property listings" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔥</span>
          <h1>Trofai</h1>
        </div>
        <div className="auth-buttons">
          <Link href="/auth/signin">
            <button className="button signin">
              <FiLogIn />
              <span>Sign In</span>
            </button>
          </Link>
          <Link href="/auth/signup">
            <button className="button signup">
              <FiUserPlus />
              <span>Sign Up</span>
            </button>
          </Link>
        </div>
      </header>

      <main className="main">
        <div className="hero">
          <h1 className="title">Make Your Listings Shine Online</h1>
          <p className="subtitle">
            Turn your property listings into scroll-stopping social media content in seconds.
          </p>
          <div className="cta-buttons">
            <Link href="/auth/signup">
              <button className="button cta">Get Started for Free</button>
            </Link>
            <Link href="/auth/signin">
              <button className="button secondary">Sign In to Your Account</button>
            </Link>
          </div>
        </div>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">🏠</div>
            <h3>Property Scraping</h3>
            <p>Automatically extract data from major property portals like Rightmove and Zillow.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🖼️</div>
            <h3>Beautiful Designs</h3>
            <p>Generate professional, eye-catching images perfect for social media.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>AI Captions</h3>
            <p>Create engaging captions that highlight your property's best features.</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Trofai. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .auth-buttons {
          display: flex;
          gap: 1rem;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        }

        .hero {
          text-align: center;
          max-width: 900px;
          margin: 2rem auto 4rem;
          padding: 0 1rem;
        }

        .title {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          color: #1a1a1a;
        }

        .subtitle {
          font-size: 1.5rem;
          color: #4a5568;
          margin-bottom: 2.5rem;
          line-height: 1.5;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .features {
          display: flex;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          flex-wrap: wrap;
          justify-content: center;
        }

        .feature-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          width: 320px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }

        .feature-card p {
          color: #4a5568;
          line-height: 1.6;
        }

        .button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 1rem;
        }

        .button.signin,
        .button.secondary {
          background: white;
          color: #1a1a1a;
          border: 2px solid #e2e8f0;
        }

        .button.signin:hover,
        .button.secondary:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .button.signup,
        .button.cta {
          background: #62d76b;
          color: #1a1a1a;
          border: 2px solid #62d76b;
        }

        .button.signup:hover,
        .button.cta:hover {
          background: #56c15f;
          border-color: #56c15f;
        }

        .button.cta {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }

        .footer {
          padding: 2rem;
          text-align: center;
          background: white;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }

          .subtitle {
            font-size: 1.25rem;
          }

          .cta-buttons {
            flex-direction: column;
            width: 100%;
            max-width: 320px;
            margin-left: auto;
            margin-right: auto;
          }

          .auth-buttons {
            display: none;
          }
        }
      `}</style>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }
      `}</style>
    </div>
  );
} 