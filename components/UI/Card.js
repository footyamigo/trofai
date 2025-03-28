export default function Card({ children, title }) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      {children}

      <style jsx>{`
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
        }
      `}</style>
    </div>
  );
} 