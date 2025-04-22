import Link from 'next/link';
import { AiOutlineHome } from 'react-icons/ai';
import { BiPlayCircle, BiImageAdd } from 'react-icons/bi';
import { VscExtensions } from 'react-icons/vsc';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { IoStatsChartOutline, IoEllipsisHorizontal } from 'react-icons/io5';
import { IoSettingsOutline } from 'react-icons/io5';
import { FiKey, FiCopy, FiZap, FiStar, FiActivity, FiSettings } from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';
import { MdOutlineViewModule } from 'react-icons/md';
import { RiText } from 'react-icons/ri';

export default function Sidebar({ activePage = 'home' }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: AiOutlineHome, href: '/dashboard' },
    { id: 'properties', label: 'Properties', icon: BsBuilding, href: '/properties' },
    { id: 'templates', label: 'Template Gallery', icon: MdOutlineViewModule, href: '/templates' },
    { id: 'my-templates', label: 'My Templates', icon: FiCopy, href: '/my-templates' },
    { id: 'caption', label: 'Caption Generator', icon: RiText, href: '/caption', isNew: false },
    { id: 'reviews', label: 'Review Generator', icon: FiStar, href: '/review-generator' },
    { id: 'tips-generator', label: 'Tip Generator', icon: FiZap, href: '/tips-generator', isNew: true },
    { id: 'activity', label: 'Activity Feed', icon: FiActivity, href: '/activity-feed' },
    { id: 'settings', label: 'Settings', icon: FiSettings, href: '/dashboard/settings' },
  ];

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

      <div className="user-profile">
        <div className="avatar">P</div>
        <span className="username">presidentialideas</span>
        <button className="menu-button">
          <IoEllipsisHorizontal />
        </button>
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
          gap: 0.25rem;
          padding: 0 0.75rem;
          flex: 1;
        }

        :global(.nav-item) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s ease;
          font-size: 0.9375rem;
          position: relative;
        }

        :global(.nav-item:hover) {
          background: rgba(0, 0, 0, 0.04);
          color: #1a1a1a;
        }

        :global(.nav-item.active) {
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

        .user-profile {
          margin: 0.75rem;
          padding: 0.5rem 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          margin-top: 0.75rem;
        }

        .avatar {
          width: 24px;
          height: 24px;
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
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4A5568;
          cursor: pointer;
          opacity: 0.75;
          transition: opacity 0.2s ease;
        }

        .menu-button:hover {
          opacity: 1;
        }

        :global(.menu-button svg) {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </aside>
  );
}