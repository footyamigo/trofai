import ImageDisplay from './ImageDisplay';
import CaptionDisplay from './CaptionDisplay';

export default function ResultsContainer({ results }) {
  if (!results) return null;
  
  const { bannerbear, caption } = results;
  const isCollection = bannerbear?.type === 'collection';
  
  return (
    <div className="results-container">
      <h2>Generated Results</h2>
      <div className="results">
        <div className="images-section">
          <h3>{isCollection ? 'Generated Collection' : 'Generated Image'}</h3>
          <ImageDisplay 
            bannerbear={bannerbear}
            isCollection={isCollection}
          />
        </div>
        <CaptionDisplay caption={caption} />
      </div>

      <style jsx>{`
        .results-container {
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

        h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        
        .results {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .images-section {
          flex: 1;
        }
        
        @media (min-width: 768px) {
          .results {
            flex-direction: row;
            align-items: flex-start;
          }
          
          .results > :global(*) {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
} 