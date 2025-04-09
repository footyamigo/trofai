import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function S3Test() {
  const [s3Files, setS3Files] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchS3Files() {
      try {
        const folderName = 'templateset1';
        const response = await fetch(`/api/s3-template-previews?folderName=${folderName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch S3 files: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.templates && data.templates.length > 0) {
          setS3Files(data.templates);
        } else {
          setError('No files found in S3 bucket folder');
        }
      } catch (err) {
        console.error('Error fetching S3 files:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchS3Files();
  }, []);

  // Direct S3 URLs for testing
  const directUrls = [
    'https://trofai.s3.us-east-1.amazonaws.com/templateset1/0eb715rd3zLomO7AYBPpEmKay.png',
    'https://trofai.s3.us-east-1.amazonaws.com/templateset1/0Mn5r3E1XY027PgZ6WPoD9kg7.png',
    'https://trofai.s3.us-east-1.amazonaws.com/templateset1/5nDZ3xmVezbDMPOpQy2qpdWj9.png'
  ];

  return (
    <div className="container">
      <Head>
        <title>S3 Image Test</title>
      </Head>

      <main>
        <h1>S3 Image Loading Test</h1>
        
        <section className="test-section">
          <h2>Direct URL Test</h2>
          <p>Testing directly loading from hardcoded S3 URLs:</p>
          
          <div className="image-grid">
            {directUrls.map((url, index) => (
              <div key={index} className="image-item">
                <img 
                  src={url}
                  alt={`Direct S3 Test ${index + 1}`}
                  onLoad={() => console.log(`Direct image ${index + 1} loaded successfully`)}
                  onError={() => console.error(`Direct image ${index + 1} failed to load`)}
                />
                <p>Image {index + 1}</p>
              </div>
            ))}
          </div>
        </section>
        
        <section className="test-section">
          <h2>API Test</h2>
          <p>Testing loading from S3 via API endpoint:</p>
          
          {loading && <p>Loading...</p>}
          
          {error && (
            <div className="error">
              <p>Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="image-grid">
              {s3Files.map((file, index) => (
                <div key={index} className="image-item">
                  <img 
                    src={file.url}
                    alt={file.name}
                    onLoad={() => console.log(`API image ${index + 1} loaded successfully`)}
                    onError={() => console.error(`API image ${index + 1} failed to load`)}
                  />
                  <p>{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .test-section {
          margin-bottom: 3rem;
          padding: 1.5rem;
          border: 1px solid #eaeaea;
          border-radius: 8px;
        }
        
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .image-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .image-item img {
          max-width: 100%;
          height: 200px;
          object-fit: contain;
          border: 1px solid #eaeaea;
          border-radius: 4px;
          background-color: #f9f9f9;
        }
        
        .image-item p {
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        
        .error {
          color: #d32f2f;
          padding: 1rem;
          background-color: #ffebee;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 