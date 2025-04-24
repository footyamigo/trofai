import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Button from '../UI/Button';

const FrontendHeader = ({ scrollToSection }) => {
  const router = useRouter();
  
  // If not on homepage, we need to handle navigation differently
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    
    if (router.pathname === '/') {
      // If on homepage, scroll to section
      if (scrollToSection) {
        scrollToSection(sectionId);
      }
    } else {
      // If on another page, navigate to homepage with section hash
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <span className="logo-icon" style={{ filter: 'invert(1)' }}>🔥</span>
        <Link href="/">
          <h1>Trofai</h1>
        </Link>
      </div>
      
      <div className="nav-and-auth">
        <div className="nav-menu">
          <a href="#" onClick={(e) => handleNavClick(e, 'templates-showcase')} className="nav-link">About</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'pricing')} className="nav-link">Pricing</a>
          <a href="#" onClick={(e) => handleNavClick(e, 'faq')} className="nav-link">Contact</a>
        </div>
        
        <div className="auth-buttons">
          <Link href="/auth/signin">
            <Button className="small outline">
              <span>Sign In</span>
            </Button>
          </Link>
          <a href="#" onClick={(e) => handleNavClick(e, 'pricing')}>
            <Button className="small">
              <span>Get Started</span>
            </Button>
          </a>
        </div>
      </div>

      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: transparent;
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
          font-weight: 600;
          color: #F0FFF0;
          font-family: 'Jost', sans-serif;
          letter-spacing: 0;
          cursor: pointer;
        }
        
        .nav-and-auth {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-menu {
          display: flex;
          gap: 1.5rem;
        }

        .nav-link {
          color: #F0FFF0;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .nav-link:hover {
          opacity: 0.8;
        }

        .auth-buttons {
          display: flex;
          gap: 0.75rem;
        }

        /* Style for outline button in header */
        :global(.outline) {
          background: transparent !important;
          border: 1px solid #4CAF50 !important;
          color: #4CAF50 !important;
          box-shadow: none !important;
        }
        
        :global(.outline:hover) {
          background: rgba(76, 175, 80, 0.1) !important;
          box-shadow: none !important;
          transform: none !important;
        }
        
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            padding: 1rem;
          }
          
          .nav-and-auth {
            margin-top: 1rem;
            flex-direction: column;
            width: 100%;
            gap: 1rem;
          }
          
          .nav-menu {
            width: 100%;
            justify-content: center;
          }
          
          .auth-buttons {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </header>
  );
};

export default FrontendHeader; 