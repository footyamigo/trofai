import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title = 'Trofai', description = 'Property image generator for social media', activePage = 'home' }) {
  return (
    <div className="container">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header activePage={activePage} />

      <main className="main">
        {children}
      </main>

      <Footer />

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
          background: #f5f5f5;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
} 