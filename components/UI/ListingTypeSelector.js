import { useState } from 'react';

export default function ListingTypeSelector({ selectedType, onSelect }) {
  const listingTypes = [
    { id: 'Just Listed', label: 'Just Listed' },
    { id: 'Just Sold', label: 'Just Sold' },
    { id: 'For Rent', label: 'For Rent' },
    { id: 'Let Agreed', label: 'Let Agreed' }
  ];

  return (
    <div className="listing-type-selector">
      <div className="selector-header">
        <h3 className="selector-title">
          Listing Type: <span className="selected-type">{selectedType || "Select Type"}</span>
        </h3>
      </div>
      
      <div className="listing-types-grid">
        {listingTypes.map((type) => (
          <div 
            key={type.id} 
            className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => onSelect(type.id)} 
          >
            <div className="type-header">
              <h4 className="type-name">{type.label}</h4>
              {selectedType === type.id && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .listing-type-selector {
          margin-bottom: 1.5rem;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .selector-title {
          font-size: 1rem;
          margin: 0;
          color: #333;
          font-weight: 600;
        }
        
        .selected-type {
          color: #62d76b;
          font-weight: 700;
        }
        
        .listing-types-grid {
          display: flex;
          align-items: stretch;
          padding: 1rem;
          gap: 1rem;
        }
        
        .type-card {
          flex: 1;
          padding: 1.2rem 1rem;
          border: 1px solid #eaeaea;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        
        .type-card:hover {
          border-color: #62d76b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .type-card.selected {
          border-color: #62d76b;
          background: rgba(98, 215, 107, 0.05);
        }
        
        .type-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        
        .type-name {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }
        
        .selected-indicator {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #62d76b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.7rem;
        }
        
        @media (max-width: 768px) {
          .listing-types-grid {
            flex-wrap: wrap;
          }
          
          .type-card {
            min-width: calc(50% - 0.5rem);
            flex: 0 0 calc(50% - 0.5rem);
          }
        }
      `}</style>
    </div>
  );
} 