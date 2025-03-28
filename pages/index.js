import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import PropertyURLForm from '../components/Forms/PropertyURLForm';
import ResultsContainer from '../components/Results/ResultsContainer';
import Card from '../components/UI/Card';

export default function Home() {
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (url) => {
    try {
      // Make API call to process the URL
      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
      
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to process URL');
        }
        
        const data = await response.json();
        
        // Create preview from the response data
        setPreview({
          imageUrl: data.data.bannerbear?.image_url || '/images/demo-image.jpg',
          caption: data.data.caption
        });
      } catch (error) {
        console.error('API error:', error);
        
        // Fallback to demo data for now
        setTimeout(() => {
          setPreview({
            imageUrl: '/images/demo-image.jpg',
            caption: "✨ **Your New Home Awaits!** ✨\n\nThis stunning property offers modern living at its finest. With spacious rooms and excellent location, it's perfect for your next chapter!\n\n#PropertyListing #DreamHome"
          });
        }, 2000);
      }
    } catch (err) {
      throw err;
    }
  };

  return (
    <Layout title="Trofai - Property Image Generator" activePage="home">
      <div className="hero">
        <h1 className="title">
          Welcome to <span className="highlight">Trofai</span>
        </h1>

        <p className="description">
          Transform property listings into captivating social media content
        </p>
      </div>

      <Card title="Generate Content">
        <PropertyURLForm onSubmit={handleSubmit} />
      </Card>

      {preview && <ResultsContainer results={preview} />}

      <div className="link-container">
        <Link href="/dashboard">
          <span className="link">Go to Dashboard →</span>
        </Link>
      </div>

      <style jsx>{`
        .hero {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }
        
        .highlight {
          color: #0070f3;
        }
        
        .description {
          line-height: 1.5;
          font-size: 1.5rem;
          margin: 1rem 0;
        }
        
        .link-container {
          text-align: center;
          margin-top: 2rem;
        }
        
        .link {
          color: #0070f3;
          text-decoration: none;
          font-weight: bold;
          cursor: pointer;
        }
      `}</style>
    </Layout>
  );
} 