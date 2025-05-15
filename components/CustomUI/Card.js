export default function Card({ children, title }) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      {children}

      <style jsx>{`
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          margin-bottom: 2rem;
          width: 100%;
          border: 1px solid #eaeaea;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-weight: 600;
          font-size: 1.3rem;
          color: #333;
        }
      `}</style>
    </div>
  );
} 