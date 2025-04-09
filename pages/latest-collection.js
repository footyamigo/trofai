import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ResultsContainer from '../components/Results/ResultsContainer';

export default function LatestCollection() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadLatestData() {
      try {
        // This is the UID from the most recent Pipedream webhook
        const uid = 'v91ma071D911A4drQX';
        
        const response = await fetch(`/api/webhook-history?uid=${uid}`);
        const data = await response.json();
        
        if (response.ok) {
          setResults({
            bannerbear: data,
            caption: "Located in Fountain Park Way, London, W12, you'll enjoy easy access to local amenities and excellent transportation links. Nestled in the vibrant area of Fountain Park Way, London, this charming apartment offers a delightful living experience for those seeking comfort and convenience."
          });
        } else {
          console.error('Error loading collection:', data);
        }
      } catch (error) {
        console.error('Error loading test data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadLatestData();
  }, []);

  return (
    <Layout title="Latest Collection - Trofai">
      <h1 className="title">Latest Collection from Webhook</h1>
      
      <p className="description">
        This page demonstrates the most recent collection from your Pipedream webhook (UID: v91ma071D911A4drQX)
      </p>
      
      {isLoading && <p>Loading latest collection data...</p>}
      
      {results && <ResultsContainer results={results} isLoading={false} />}
      
      <div className="cta-container">
        <a href="/dashboard" className="cta-button">Go to Dashboard</a>
      </div>
      
      <style jsx>{`
        .title {
          margin-bottom: 1rem;
        }
        
        .description {
          margin-bottom: 2rem;
          color: #666;
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