import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import PropertyURLForm from '../../components/Forms/PropertyURLForm';
import ResultsContainer from '../../components/Results/ResultsContainer';
import HistoryList from '../../components/Dashboard/HistoryList';
import Card from '../../components/UI/Card';

export default function Dashboard() {
  const [results, setResults] = useState(null);
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
      // Make API call to process the URL
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.message || errorData.details || 'Failed to process URL');
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Set results with the complete data structure
      setResults({
        bannerbear: data.data.bannerbear,
        caption: data.data.caption
      });
    } catch (error) {
      console.error('Error processing URL:', error);
      throw error;
    }
  };

  const handleViewHistoryItem = (item) => {
    setResults(item);
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

      {results && <ResultsContainer results={results} />}

      <HistoryList history={history} onViewItem={handleViewHistoryItem} />
    </Layout>
  );
} 