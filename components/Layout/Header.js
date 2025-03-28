import Link from 'next/link';

export default function Header({ activePage = 'home' }) {
  return (
    <header className="header">
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

      <style jsx>{`
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .logo span {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0070f3;
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
          color: #0070f3;
          font-weight: bold;
        }
        
        @media (max-width: 600px) {
          .header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </header>
  );
} 