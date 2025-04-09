import Link from 'next/link';

export default function Header({ activePage = 'home' }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Link href="/">
            <span>Trofai</span>
          </Link>
        </div>
        <nav className="nav">
          <Link href="/">
            <span className={activePage === 'home' ? 'active' : ''}>Home</span>
          </Link>
          <Link href="/dashboard">
            <span className={activePage === 'dashboard' ? 'active' : ''}>Dashboard</span>
          </Link>
        </nav>
      </div>

      <style jsx>{`
        .header {
          padding: 1rem 0;
          border-bottom: 1px solid #eaeaea;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo span {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
          text-decoration: none;
          cursor: pointer;
        }
        
        .nav {
          display: flex;
          gap: 1.5rem;
        }
        
        .nav span {
          color: #666;
          text-decoration: none;
          cursor: pointer;
        }
        
        .nav span.active {
          color: #4CAF50;
          font-weight: bold;
        }
        
        @media (max-width: 600px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
} 