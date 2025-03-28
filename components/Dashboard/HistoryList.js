import HistoryItem from './HistoryItem';

export default function HistoryList({ history, onViewItem }) {
  return (
    <div className="history-list-container">
      <h2>History</h2>
      
      <div className="history-list">
        {history.length > 0 ? (
          history.map(item => (
            <HistoryItem 
              key={item.id} 
              item={item} 
              onView={onViewItem}
            />
          ))
        ) : (
          <p className="empty-message">No history yet</p>
        )}
      </div>

      <style jsx>{`
        .history-list-container {
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
        
        .history-list {
          display: flex;
          flex-direction: column;
        }
        
        .empty-message {
          color: #666;
          text-align: center;
          padding: 2rem 0;
        }
      `}</style>
    </div>
  );
} 