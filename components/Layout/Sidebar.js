import Link from 'next/link';
import { useState } from 'react';
import { AiOutlineHome } from 'react-icons/ai';
import { BiPlayCircle, BiImageAdd } from 'react-icons/bi';
import { VscExtensions } from 'react-icons/vsc';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { IoStatsChartOutline, IoEllipsisHorizontal } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';
import { FiKey, FiCopy, FiZap, FiStar, FiActivity, FiSettings, FiLogOut, FiHelpCircle, FiBookOpen } from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';
import { MdOutlineViewModule } from 'react-icons/md';
import { RiText } from 'react-icons/ri';
import { useAuth } from '../../src/context/AuthContext';

export default function Sidebar({ activePage = 'home' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const userEmail = user?.attributes?.email || user?.email || user?.username || '';
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AiOutlineHome, href: '/dashboard' },
    // { id: 'caption', label: 'Caption Generator', icon: RiText, href: '/caption', isNew: false },
    { id: 'reviews', label: 'Social Proof', icon: FiStar, href: '/review-generator' },
    { id: 'tips-generator', label: 'Tip Generator', icon: FiZap, href: '/tips-generator', isNew: true },
    { id: 'templates', label: 'Template Gallery', icon: MdOutlineViewModule, href: '/templates' },
    { id: 'my-templates', label: 'My Templates', icon: FiCopy, href: '/my-templates' },
    { id: 'settings', label: 'Settings', icon: FiSettings, href: '/dashboard/settings' },
  ];
  
  const profileMenuItems = [
    { id: 'blog', label: 'Blog', icon: FiBookOpen, href: '/blog' },
    { id: 'contact', label: 'Contact Us', icon: FiHelpCircle, href: '/contact' },
    { id: 'account', label: 'Account Settings', icon: FiSettings, href: '/dashboard/settings' },
    { id: 'signout', label: 'Sign Out', icon: FiLogOut, action: signOut },
  ];
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <Link href="/" className="logo-link">
          <span className="logo-icon">🔥</span>
          <h1>Trofai</h1>
        </Link>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (!Icon) {
            console.warn(`Icon for nav item '${item.label}' (id: ${item.id}) is undefined.`);
            return null;
          }
          return (
            <Link 
              key={item.id}
              href={item.href}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
              {item.isNew && <span className="new-badge">New</span>}
            </Link>
          );
        })}
      </nav>

      <div className="feedback-box">
        <div className="feedback-content">
          <h3>Dashboard is in Alpha</h3>
          <p>Please reach out to us at <a href="mailto:help@trofai.com" className="feedback-link">help@trofai.com</a> if you have any feedback.</p>
        </div>
      </div>

      <div className="user-profile-container">
        <div className="user-profile" onClick={toggleMenu}>
          <div className="avatar">{userEmail?.[0]?.toUpperCase() || 'P'}</div>
          <span className="username">{userEmail || 'presidentialideas'}</span>
          <button className="menu-button">
            <IoEllipsisHorizontal />
          </button>
        </div>
        
        {menuOpen && (
          <>
            <div className="profile-menu-backdrop" onClick={handleClickOutside}></div>
            <div className="profile-menu">
              <div className="profile-menu-header">
                <span className="menu-username">{userEmail || 'No user logged in'}</span>
              </div>
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                if (item.action) {
                  return (
                    <button
                      key={item.id}
                      className="profile-menu-item"
                      onClick={() => {
                        item.action();
                        setMenuOpen(false);
                      }}
                    >
                      <Icon className="profile-menu-icon" />
                      <span>{item.label}</span>
                    </button>
                  );
                } else {
                  return (
                    <Link 
                      key={item.id}
                      href={item.href}
                      className="profile-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="profile-menu-icon" />
                      <span>{item.label}</span>
                    </Link>
                  );
                }
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .sidebar {
          width: 240px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: white;
          border-right: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          padding: 1.25rem 0;
          background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }

        .logo-section {
          padding: 0 1.25rem;
          margin-bottom: 2rem;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-section h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 0 0.75rem;
          flex: 1;
        }

        :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          position: relative;
          font-weight: 400;
        }

        :global(.nav-item:hover) {
          background: rgba(0, 0, 0, 0.05);
          color: #000;
          transform: translateX(2px);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        :global(.nav-item.active) {
          background: rgba(98, 215, 107, 0.2);
          color: #0d6b20;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(98, 215, 107, 0.2);
        }

        :global(.nav-icon) {
          width: 1.25rem;
          height: 1.25rem;
          opacity: 0.9;
        }

        .new-badge {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: #FF6B6B;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .feedback-box {
          margin: 1rem 0.75rem;
          padding: 1rem;
          background: #FFF5F5;
          border: 1px solid #FED7D7;
          border-radius: 8px;
        }

        .feedback-content h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .feedback-content p {
          margin: 0;
          font-size: 0.8125rem;
          color: #4A5568;
          line-height: 1.4;
        }

        .feedback-link {
          color: #FF6B6B;
          text-decoration: none;
        }

        .feedback-link:hover {
          text-decoration: underline;
        }
        
        .user-profile-container {
          position: relative;
          margin-top: 0.75rem;
        }

        .user-profile {
          margin: 0.75rem;
          padding: 0.5rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          margin-top: 0;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .user-profile:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .avatar {
          width: 28px;
          height: 28px;
          background: #E2E8F0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          color: #4A5568;
          font-weight: 500;
        }

        .username {
          flex: 1;
          font-size: 0.875rem;
          color: #4A5568;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .menu-button {
          background: none;
          border: none;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A5568;
          opacity: 0.75;
          transition: opacity 0.2s ease;
          border-radius: 50%;
          cursor: pointer;
        }

        .menu-button:hover {
          opacity: 1;
        }

        :global(.menu-button svg) {
          width: 16px;
          height: 16px;
        }
        
        .profile-menu-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }
        
        .profile-menu {
          position: absolute;
          bottom: 100%;
          right: 0.75rem;
          width: 200px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 20;
          overflow: hidden;
          margin-bottom: 0.5rem;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        
        .profile-menu-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background-color: #f8f9fa;
        }
        
        .menu-username {
          font-size: 0.875rem;
          color: #4a5568;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        
        :global(.profile-menu-item) {
          display: flex;
          width: 100%;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #4a5568;
          text-decoration: none;
          gap: 0.75rem;
          transition: all 0.2s;
          font-size: 0.875rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
        }
        
        :global(.profile-menu-item:hover) {
          background: rgba(0, 0, 0, 0.05);
          color: #000;
        }
        
        :global(.profile-menu-item:last-child) {
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          color: #e53e3e;
        }
        
        :global(.profile-menu-item:last-child:hover) {
          background: rgba(229, 62, 62, 0.05);
        }
        
        :global(.profile-menu-icon) {
          width: 1rem;
          height: 1rem;
          opacity: 0.9;
        }
      `}</style>
    </aside>
  );
}