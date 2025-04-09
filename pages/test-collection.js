import { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import ResultsContainer from '../components/Results/ResultsContainer';

export default function TestCollection() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadTestData() {
      try {
        const response = await fetch('/api/test-webhook-collection');
        const data = await response.json();
        
        if (response.ok) {
          setResults({
            bannerbear: data,
            caption: "Located in Fountain Park Way, London, W12, you'll enjoy easy access to local amenities and excellent transportation links. Nestled in the vibrant area of Fountain Park Way, London, this charming apartment offers a delightful living experience for those seeking comfort and convenience."
          });
        }
      } catch (error) {
        console.error('Error loading test data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTestData();
  }, []);

  return (
    <Layout title="Test Collection - Trofai">
      <h1 className="title">Test Collection</h1>
      
      <p className="description">
        This page demonstrates a completed collection from the webhook. The images are loaded directly from Bannerbear.
      </p>
      
      {isLoading && <p>Loading test data...</p>}
      
      {results && <ResultsContainer results={results} isLoading={false} />}
      
      <style jsx>{`
        .title {
          margin-bottom: 1rem;
        }
        
        .description {
          margin-bottom: 2rem;
          color: #666;
        }
      `}</style>
    </Layout>
  );
} 