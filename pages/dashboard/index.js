import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import PropertyURLForm from '../../components/Forms/PropertyURLForm';
import ResultsContainer from '../../components/Results/ResultsContainer';
import HistoryList from '../../components/Dashboard/HistoryList';
import Card from '../../components/UI/Card';
import ErrorDisplay from '../../components/UI/ErrorDisplay';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Dashboard() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);
  const [currentType, setCurrentType] = useState(null);
  
  const pollIntervalRef = useRef(null);

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

  useEffect(() => {
    const pollStatus = async () => {
      if (!currentUid || !currentType) return;

      console.log(`Polling status for UID: ${currentUid}, Type: ${currentType}`);
      try {
        const response = await fetch(`/api/pipedream-status?uid=${currentUid}&type=${currentType}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Failed to fetch status (${response.status})`);
        }

        console.log('Poll Response:', data);

        if (data.status === 'completed') {
          console.log('Processing completed!');
          setResults({
            bannerbear: data,
            caption: results?.caption || "Caption generated earlier"
          });
          setIsLoading(false);
          setCurrentUid(null);
          setCurrentType(null);
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          
          if (data.status === 'completed') {
            const newHistoryItem = {
              id: Date.now().toString(),
              date: new Date().toISOString().split('T')[0],
              status: 'completed',
              title: results?.metadata?.property_title || 'Property',
              price: results?.metadata?.property_price || '',
              uid: data.uid,
              bannerbear: data,
              caption: results?.caption || ''
            };
            
            setHistory(prev => [newHistoryItem, ...prev.slice(0, 4)]);
          }
        } else if (data.status === 'failed') {
          console.error('Processing failed:', data);
          setError({ message: 'Image/Collection generation failed.', details: JSON.stringify(data) });
          setIsLoading(false);
          setCurrentUid(null);
          setCurrentType(null);
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        } else {
          console.log('Status still pending...');
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError({ message: 'Error checking status.', details: err.message });
        setIsLoading(false);
        setCurrentUid(null);
        setCurrentType(null);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    if (currentUid && isLoading && !pollIntervalRef.current) {
      pollStatus(); 
      pollIntervalRef.current = setInterval(pollStatus, 5000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        console.log('Polling interval cleared.');
      }
    };
  }, [currentUid, currentType, isLoading, results?.caption, results?.metadata]);

  const handleSubmit = async (url) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
      
    setResults(null);
    setError(null);
    setCurrentUid(null);
    setCurrentType(null);
    setIsLoading(true); 
    
    let initialCaption = "Generating caption...";

    try {      
      let responseData;
      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
        
        console.log('Initial API Response:', responseData);
        
        if (!response.ok) {
          console.error('API Error:', responseData);
          throw new Error(responseData.error || responseData.message || responseData.details || 'Failed to process URL');
        }
      } catch (jsonError) {
        if (jsonError.name === 'SyntaxError' && jsonError.message.includes('JSON')) {
          console.error('JSON Parse Error:', jsonError);
          throw new Error('Error parsing JSON response from server. The Rightmove scraper may be encountering issues.');
        }
        throw jsonError;
      }

      if (!responseData || !responseData.data || !responseData.data.bannerbear || !responseData.data.bannerbear.uid) {
        console.error('Missing uid or expected structure in API response', responseData);
        throw new Error('Invalid API response format from /api/process');
      }
      
      initialCaption = responseData.data.caption || "Caption generation pending...";

      setCurrentUid(responseData.data.bannerbear.uid);
      setCurrentType(responseData.data.bannerbear.type || 'collection');
      
      setResults({
        bannerbear: {
           uid: responseData.data.bannerbear.uid,
           status: 'pending',
           type: responseData.data.bannerbear.type || 'collection' 
        },
        caption: initialCaption
      });

    } catch (error) {
      console.error('Error processing URL:', error);
      setError({
        message: error.message || 'An unexpected error occurred during initial processing',
        details: error.stack || '',
        code: error.code
      });
      setIsLoading(false);
      setCurrentUid(null);
      setCurrentType(null);
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

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorDisplay 
          message={error.message} 
          details={error.details} 
          code={error.code}
          onDismiss={() => setError(null)} 
        />
      )}

      {results && <ResultsContainer results={results} isLoading={isLoading} />}

      <HistoryList history={history} onViewItem={handleViewHistoryItem} />
    </Layout>
  );
} 