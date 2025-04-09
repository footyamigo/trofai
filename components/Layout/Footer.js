export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Trofai</p>
      </div>

      <style jsx>{`
        .footer {
          padding: 1.5rem 0;
          border-top: 1px solid #eaeaea;
          color: #666;
          font-size: 0.9rem;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          text-align: center;
        }
      `}</style>
    </footer>
  );
} 