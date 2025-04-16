import { useState } from 'react';
import Link from 'next/link';
import { IoClose, IoNotificationsOutline } from 'react-icons/io5';
import { FiHelpCircle, FiMenu } from 'react-icons/fi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { AiOutlineHome } from 'react-icons/ai';
import { BiPlayCircle } from 'react-icons/bi';
import { VscExtensions } from 'react-icons/vsc';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { IoStatsChartOutline } from 'react-icons/io5';
import { FiKey } from 'react-icons/fi';
import { IoSettingsOutline } from 'react-icons/io5';
import { BsBuilding } from 'react-icons/bs';
import { MdOutlineViewModule } from 'react-icons/md';
import { RiText } from 'react-icons/ri';

export default function MobileMenu({ activePage }) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AiOutlineHome, href: '/dashboard' },
    { id: 'properties', label: 'Properties', icon: BsBuilding, href: '/properties' },
    { id: 'templates', label: 'Templates', icon: MdOutlineViewModule, href: '/templates' },
    { id: 'caption', label: 'Caption Generator', icon: RiText, href: '/caption', isNew: true },
    { id: 'activity', label: 'Activity Logs', icon: TbActivityHeartbeat, href: '/activity' },
    { id: 'settings', label: 'Settings', icon: IoSettingsOutline, href: '/dashboard/settings' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="mobile-menu">
      <div className="mobile-header">
        <Link href="/" className="logo-link">
          <span className="logo-icon">🔥</span>
          <h1>Trofai</h1>
        </Link>
        <button className="menu-toggle" onClick={toggleMenu}>
          {isOpen ? <IoClose /> : <FiMenu />}
        </button>
      </div>

      {isOpen && (
        <div className="menu-content">
          <nav className="nav-section">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={toggleMenu}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
                {item.isNew && <span className="new-badge">New</span>}
              </Link>
            ))}
          </nav>

          <div className="action-section">
            <button className="action-button credits">
              <span>Get Free Credits</span>
            </button>
            <button className="action-button">
              <IoNotificationsOutline />
              <span>Notifications</span>
            </button>
            <button className="action-button">
              <FiHelpCircle />
              <span>Help</span>
            </button>
            <button className="action-button">
              <HiOutlineDocumentText />
              <span>Docs</span>
            </button>
            <button className="action-button upgrade">
              <span>Upgrade Plan</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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

        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .menu-toggle {
          background: none;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a1a;
        }

        .menu-content {
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          overflow-y: auto;
          padding: 1rem;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 1rem;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .nav-item.active {
          background: rgba(255, 165, 0, 0.1);
          color: #1a1a1a;
          font-weight: 500;
        }

        :global(.nav-icon) {
          width: 1.25rem;
          height: 1.25rem;
          opacity: 0.9;
        }

        .new-badge {
          position: absolute;
          right: 0.75rem;
          background: #FF6B6B;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .action-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: none;
          background: none;
          color: #4A5568;
          font-size: 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .action-button:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .action-button.credits {
          color: #276749;
          font-weight: 500;
        }

        .action-button.upgrade {
          background: #1a1a1a;
          color: white;
          font-weight: 500;
        }

        .action-button.upgrade:hover {
          background: #000000;
        }

        @media (max-width: 768px) {
          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </div>
  );
} 