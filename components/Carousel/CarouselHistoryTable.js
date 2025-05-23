import React from 'react';
import { FiTrash2 } from 'react-icons/fi';

export default function CarouselHistoryTable({
  carousels,
  isLoading,
  onView,
  onDelete,
  deletingId,
  selectedCarouselIds,
  onSelectCarousel,
  onSelectAllCarousels,
  onDeleteSelected,
  selectedCount,
  isBulkDeleting
}) {
  const allVisibleSelected = carousels.length > 0 && carousels.every(item => selectedCarouselIds.includes(item.id));

  return (
    <div className="history-section">
      <div className="history-header">
        <h2 className="history-title">History</h2>
        {selectedCount > 0 && (
          <button
            className={`bulk-delete-button ${isBulkDeleting ? 'loading' : ''}`}
            onClick={onDeleteSelected}
            disabled={isBulkDeleting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isBulkDeleting ? '#fcc2c2' : '#fee2e2',
              color: isBulkDeleting ? '#a03030' : '#e53e3e',
              border: '1px solid #e53e3e',
              borderRadius: '6px',
              cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isBulkDeleting ? (
              <>
                <span className="delete-spinner" style={{
                  width: 16, height: 16, border: '2px solid #e53e3e', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite'
                }}></span>
                Deleting...
              </>
            ) : (
              <>Delete Selected ({selectedCount})</>
            )}
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="loading-placeholder">Loading history...</div>
      ) : carousels.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No carousels generated yet</h3>
          <p>Generate your first carousel to see it here.</p>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => onSelectAllCarousels(e.target.checked)}
                      disabled={isLoading || carousels.length === 0}
                    />
                    <span className="checkmark"></span>
                  </label>
                </th>
                <th>Carousel Title</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {carousels.map((item, idx) => (
                <tr key={item.id || idx} className="history-row">
                  <td className="checkbox-cell">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedCarouselIds.includes(item.id)}
                        onChange={() => onSelectCarousel(item.id)}
                        disabled={isLoading}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td>{item.title}</td>
                  <td>{item.date}</td>
                  <td className="action-cell">
                    <div className="action-buttons">
                      <button
                        className="view-button"
                        onClick={() => onView(item)}
                        title="View Carousel"
                      >
                        View
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => onDelete(item)}
                        title="Delete Carousel"
                        disabled={deletingId === item.id}
                        style={{ marginLeft: 4 }}
                      >
                        {deletingId === item.id ? (
                          <span className="loading-spinner" style={{ width: 16, height: 16, border: '2px solid #e53e3e', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <FiTrash2 size={18} color="#e53e3e" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style jsx>{`
        .history-section {
          margin-top: 2rem;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .history-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }
        .loading-placeholder {
          text-align: center;
          padding: 3rem 1rem;
          color: #6b7280;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #9ca3af;
        }
        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #334155;
        }
        .empty-state p {
          margin: 0;
          color: #64748b;
        }
        .history-table-container {
          overflow-x: auto;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
        }
        .history-table th,
        .history-table td {
          padding: 1rem;
          text-align: left;
          vertical-align: middle;
          border-bottom: 1px solid #e2e8f0;
        }
        .history-table th {
          font-weight: 600;
          color: #4a5568;
          font-size: 0.875rem;
          border-bottom-width: 2px;
        }
        .history-row:hover {
          background-color: #f7fafc;
        }
        .checkbox-cell {
          width: 40px;
          text-align: center;
          padding-right: 0;
        }
        .checkbox-container {
          display: inline-block;
          position: relative;
          cursor: pointer;
          user-select: none;
          height: 18px;
          width: 18px;
          vertical-align: middle;
        }
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 18px;
          width: 18px;
          background-color: #fff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          transition: all 0.15s ease;
        }
        .checkbox-container:hover input ~ .checkmark {
          background-color: #f3f4f6;
        }
        .checkbox-container input:checked ~ .checkmark {
          background-color: #62d76b;
          border-color: #62d76b;
        }
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }
        .checkbox-container .checkmark:after {
          left: 6px;
          top: 2px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .action-cell {
          width: 160px;
          text-align: center;
        }
        .action-buttons {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          align-items: center;
        }
        .view-button {
          padding: 0.5rem 1rem;
          background: #62d76b;
          color: #1a1a1a;
          border: 2px solid #1a1a1a;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          position: relative;
          overflow: hidden;
        }
        .view-button:hover {
          background: #56c15f;
          box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
          transform: translateY(-1px);
        }
        .view-button:active, .view-button.clicked {
          transform: translateY(2px);
          box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
          background: #4caf50;
        }
        .delete-button {
          padding: 0.5rem 1rem;
          background: #fff5f5;
          color: #e53e3e;
          border: 2px solid #e53e3e;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 2px 2px 0 rgba(229, 62, 62, 0.2);
          position: relative;
          overflow: hidden;
        }
        .delete-button:hover {
          background: #fed7d7;
          box-shadow: 3px 3px 0 rgba(229, 62, 62, 0.2);
          transform: translateY(-1px);
        }
        .delete-button:active {
          background: #fee2e2;
          transform: translateY(1px);
        }
        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading-spinner {
          display: inline-block;
          border: 2px solid #e53e3e;
          border-top: 2px solid #fff;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 