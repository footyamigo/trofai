export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Trofai. All rights reserved.</p>

      <style jsx>{`
        .footer {
          padding: 2rem;
          background: white;
          border-top: 1px solid #eee;
          text-align: center;
        }
      `}</style>
    </footer>
  );
} 