export default function HistoryItem({ item, onView }) {
  return (
    <div className="history-item">
      <div className="history-image">
        <img src={item.imageUrl} alt={item.title} />
      </div>
      <div className="history-details">
        <h3>{item.title}</h3>
        <p>{item.price}</p>
        <p className="history-date">Generated on {item.date}</p>
      </div>
      <div className="history-actions">
        <button 
          className="action-button"
          onClick={() => onView(item)}
        >
          View
        </button>
      </div>

      <style jsx>{`
        .history-item {
          display: flex;
          gap: 1.5rem;
          border-bottom: 1px solid #eee;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        
        .history-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .history-image {
          width: 100px;
          height: 100px;
          flex-shrink: 0;
        }
        
        .history-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 4px;
        }
        
        .history-details {
          flex: 1;
        }
        
        .history-details h3 {
          margin: 0 0 0.5rem 0;
        }
        
        .history-details p {
          margin: 0 0 0.5rem 0;
        }
        
        .history-date {
          color: #666;
          font-size: 0.9rem;
        }
        
        .history-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .action-button {
          padding: 0.5rem 1rem;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        @media (max-width: 600px) {
          .history-item {
            flex-direction: column;
            gap: 1rem;
          }
          
          .history-image {
            width: 100%;
            height: auto;
            aspect-ratio: 16/9;
          }
          
          .history-actions {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
} 