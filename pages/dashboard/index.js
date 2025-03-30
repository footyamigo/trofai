import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import PropertyURLForm from '../../components/Forms/PropertyURLForm';
import ResultsContainer from '../../components/Results/ResultsContainer';
import HistoryList from '../../components/Dashboard/HistoryList';
import Card from '../../components/UI/Card';
import ErrorDisplay from '../../components/UI/ErrorDisplay';

export default function Dashboard() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([
    {
      id: '1',
      url: 'https://www.rightmove.co.uk/properties/123456789',
      date: '2025-03-27',
      status: 'completed',
      title: 'Schooner Road, London, E16',
      price: '£1,150,000',
      imageUrl: '/images/demo-image.jpg',
      caption: "✨ **Your New Home Awaits!** ✨\n\nThis stunning property offers modern living at its finest. With spacious rooms and excellent location, it's perfect for your next chapter!\n\n#PropertyListing #DreamHome"
    },
    {
      id: '2',
      url: 'https://www.rightmove.co.uk/properties/987654321',
      date: '2025-03-26',
      status: 'completed',
      title: 'York Road, Acton, London, W3',
      price: '£2,000 pcm',
      imageUrl: '/images/demo-image.jpg',
      caption: "✨ **Your New Home Awaits!** ✨\n\nThis stunning property offers modern living at its finest. With spacious rooms and excellent location, it's perfect for your next chapter!\n\n#PropertyListing #DreamHome"
    }
  ]);

  const handleSubmit = async (url) => {
    try {
      // Clear previous results and errors
      setResults(null);
      setError(null);
      
      // Make API call to process the URL
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (!response.ok) {
        console.error('API Error:', responseData);
        throw new Error(responseData.error || responseData.message || responseData.details || 'Failed to process URL');
      }
      
      // Check if data has the expected structure
      if (!responseData || !responseData.data) {
        console.error('Missing data structure in API response', responseData);
        throw new Error('Invalid API response format');
      }
      
      // Set results with the complete data structure
      setResults({
        bannerbear: responseData.data.bannerbear || null,
        caption: responseData.data.caption || "No caption available"
      });
    } catch (error) {
      console.error('Error processing URL:', error);
      setError({
        message: error.message || 'An unexpected error occurred',
        details: error.stack || ''
      });
    }
  };

  const handleViewHistoryItem = (item) => {
    setResults(item);
    setError(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <Layout title="Dashboard - Trofai" activePage="dashboard">
      <h1 className="title">Dashboard</h1>

      <Card title="Create New">
        <PropertyURLForm onSubmit={handleSubmit} />
      </Card>

      {error && (
        <ErrorDisplay 
          message={error.message} 
          details={error.details} 
          onDismiss={() => setError(null)} 
        />
      )}

      {results && <ResultsContainer results={results} />}

      <HistoryList history={history} onViewItem={handleViewHistoryItem} />
    </Layout>
  );
} 