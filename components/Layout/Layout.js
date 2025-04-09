import Head from 'next/head';
import Sidebar from './Sidebar';

export default function Layout({ children, title = 'Trofai', description = 'Property image generator for social media', activePage = 'home' }) {
  return (
    <div className="layout">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Sidebar activePage={activePage} />

      <main className="main">
        {children}
      </main>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
        }

        .main {
          margin-left: 240px;
          min-height: 100vh;
          padding: 2rem;
          max-width: 1200px;
        }

        @media (max-width: 768px) {
          .main {
            margin-left: 0;
            padding: 1rem;
          }
        }
      `}</style>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
        }

        * {
          box-sizing: border-box;
        }

        .card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          padding: 1.5rem;
        }

        .button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #276749;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .button:hover {
          background: #2f855a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(39, 103, 73, 0.2);
        }

        .button:active {
          transform: translateY(1px);
        }

        .button.secondary {
          background: transparent;
          border: 2px solid #276749;
          color: #276749;
        }

        .button.secondary:hover {
          background: rgba(39, 103, 73, 0.1);
        }

        input, textarea {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          width: 100%;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #38a169;
          box-shadow: 0 0 0 3px rgba(56, 161, 105, 0.1);
        }
      `}</style>
    </div>
  );
} 