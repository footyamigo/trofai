import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ResultsContainer from '../components/Results/ResultsContainer';

export default function DirectCollection() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collectionUid, setCollectionUid] = useState('Mg31VBprYDkA4NYm');
  
  // Collection UIDs from the screenshots
  const collections = [
    { id: 'Mg31VBprYDkA4NYm', label: 'Most Recent (Mg31VBprYDkA4NYm)' },
    { id: 'v91ma071D911A4drQX', label: 'Previously Created (v91ma071D911A4drQX)' },
    { id: 'N052OZWljn417Pwbxj', label: 'Older Collection (N052OZWljn417Pwbxj)' },
    { id: 'on98ymlOAQyMokD9QvM5pkw3R', label: 'Single Image (from screenshot)' }
  ];
  
  useEffect(() => {
    async function loadDirectData() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching collection: ${collectionUid}`);
        const response = await fetch(`/api/direct-collection?uid=${collectionUid}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch collection (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        setResults({
          bannerbear: data,
          caption: "This stunning 1 bedroom property offers modern living at its finest with 1 bathroom. Brand New One Bedroom Apartment in Fountain Park Way, London, W12!"
        });
      } catch (error) {
        console.error('Error loading collection data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDirectData();
  }, [collectionUid]);

  return (
    <Layout title="Direct Collection - Trofai">
      <h1 className="title">Direct Bannerbear Collection</h1>
      
      <p className="description">
        This page demonstrates loading collection data directly from Bannerbear API 
        without using webhooks. Select a collection to view:
      </p>
      
      <div className="collection-selector">
        {collections.map(collection => (
          <button 
            key={collection.id}
            className={`collection-button ${collectionUid === collection.id ? 'active' : ''}`}
            onClick={() => setCollectionUid(collection.id)}
          >
            {collection.label}
          </button>
        ))}
      </div>
      
      {isLoading && <p className="loading">Loading collection data directly from Bannerbear...</p>}
      
      {error && (
        <div className="error">
          <h3>Error loading collection</h3>
          <p>{error}</p>
        </div>
      )}
      
      {results && <ResultsContainer results={results} isLoading={false} />}
      
      <div className="cta-container">
        <a href="/dashboard" className="cta-button">Go to Dashboard</a>
      </div>
      
      <style jsx>{`
        .title {
          margin-bottom: 1rem;
        }
        
        .description {
          margin-bottom: 1.5rem;
          color: #666;
        }
        
        .collection-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        
        .collection-button {
          padding: 0.5rem 1rem;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .collection-button.active {
          background-color: #0070f3;
          color: white;
          border-color: #0070f3;
        }
        
        .loading {
          margin: 2rem 0;
          font-style: italic;
          color: #666;
        }
        
        .error {
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #fff0f0;
          border-left: 4px solid #ff3333;
          border-radius: 4px;
        }
        
        .error h3 {
          margin-top: 0;
          color: #cc0000;
        }
        
        .cta-container {
          margin-top: 2rem;
          text-align: center;
        }
        
        .cta-button {
          display: inline-block;
          background-color: #0070f3;
          color: white;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          font-weight: bold;
          text-decoration: none;
        }
        
        .cta-button:hover {
          background-color: #0051cc;
        }
      `}</style>
    </Layout>
  );
} 