import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaTiktok, FaTwitter } from 'react-icons/fa';

// Define colors
const darkGreen = '#1A4D2E'; // Dark green background
const lightContrast = '#F0FFF0'; // Light text/accents (Honeydew)

const Footer = ({ scrollToSection }) => {
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
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h4 className="footer-title">Company</h4>
          <ul className="footer-link-list">
            <li><a href="#" onClick={(e) => handleNavClick(e, 'templates-showcase')}>HOME</a></li>
            <li><a href="#" onClick={(e) => handleNavClick(e, 'templates-showcase')}>ABOUT</a></li>
            <li><a href="#">BLOG</a></li>
            <li><a href="#">AFFILIATE PROGRAM</a></li>
            <li><a href="#">CONTACT US</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4 className="footer-title">Product</h4>
          <ul className="footer-link-list">
            <li><a href="#" onClick={(e) => handleNavClick(e, 'templates-showcase')}>ALL FEATURES</a></li>
            <li><a href="#" onClick={(e) => handleNavClick(e, 'pricing')}>JOIN TODAY</a></li>
            <li><Link href="/auth/signin">MEMBER LOGIN</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4 className="footer-title">Support</h4>
          <ul className="footer-link-list">
            <li><a href="#">CONTACT US</a></li>
            <li><a href="#" onClick={(e) => handleNavClick(e, 'faq')}>FAQ</a></li>
            <li><a href="/privacy-policy">PRIVACY POLICY</a></li>
            <li><a href="/terms-conditions">TERMS & CONDITIONS</a></li>
          </ul>
        </div>
        <div className="footer-column social-column">
          <div className="footer-social-icons">
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon-link">
              <FaInstagram />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon-link">
              <FaFacebookF />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social-icon-link">
              <FaLinkedinIn />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-icon-link">
              <FaTiktok />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-icon-link">
              <FaTwitter />
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          padding: 4rem 2rem;
          background-color: ${darkGreen};
          color: rgba(240, 255, 240, 0.7);
          border-top: 1px solid rgba(240, 255, 240, 0.2);
        }

        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        
        .social-column {
          justify-self: end;
        }

        .footer-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 1.5rem;
          color: ${lightContrast};
        }

        .footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-link-list li {
          margin-bottom: 0.75rem;
        }

        .footer-link-list a {
          color: rgba(240, 255, 240, 0.8);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }

        .footer-link-list a:hover {
          color: ${lightContrast};
        }

        .footer-social-icons {
          display: flex;
          gap: 1.5rem;
          justify-content: flex-end;
        }

        .social-icon-link {
          font-size: 1.2rem;
          color: rgba(240, 255, 240, 0.8);
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .social-icon-link:hover {
          color: ${lightContrast};
          transform: translateY(-3px);
        }
        
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem 1rem;
          }
          
          .social-column {
            grid-column: 1 / -1;
            justify-self: center;
          }
          
          .footer-social-icons {
            justify-content: center;
            margin-top: 1rem;
          }
        }
        
        @media (max-width: 480px) {
          .footer {
            padding: 3rem 1rem 2rem;
          }
          
          .footer-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          
          .footer-link-list {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }
          
          .footer-link-list li {
            margin-bottom: 0;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer; 