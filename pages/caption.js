import { useState } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Layout/Sidebar';
import MobileMenu from '../components/Layout/MobileMenu';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ProtectedRoute from '../src/components/ProtectedRoute';
import PropertyURLForm from '../components/Forms/PropertyURLForm';
import Button from '../components/UI/Button';
import { FiRefreshCw, FiCopy, FiMapPin, FiHome, FiUser } from 'react-icons/fi';
import { FaBed, FaBath } from 'react-icons/fa';
import Modal from '../components/UI/Modal';
import { FiPlayCircle } from 'react-icons/fi';

const CAPTION_STYLES = [
  { value: 'luxury', label: 'Luxury' },
  { value: 'fun', label: 'Fun' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'professional', label: 'Professional' },
  { value: 'quirky', label: 'Quirky' },
];

export default function CaptionGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [caption, setCaption] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [property, setProperty] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [captionStyle, setCaptionStyle] = useState(CAPTION_STYLES[0].value);
  const [currentStep, setCurrentStep] = useState(0);
  const [agent, setAgent] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleSubmit = async (url) => {
    setError(null);
    setLoading(true);
    setCurrentStep(1); // Step 1: Scraping Property Details
    setCaption(null);
    setProperty(null);
    setAgent(null);
    setCopied(false);
    setSelectedImageIdx(0);
    try {
      // Step 1: Scraping
      const res = await fetch('/api/caption-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, style: captionStyle })
      });
      setCurrentStep(2); // Step 2: Extracting Information
      const data = await res.json();
      setCurrentStep(3); // Step 3: Creating Caption
      if (!data.success) throw new Error(data.message || 'Failed to generate caption');
      setCaption(data.caption);
      setEditedCaption(data.caption);
      setProperty(data.property);
      setAgent(data.agent);
      setLoading(false);
      setCurrentStep(0);
    } catch (err) {
      setError(err.message || 'Error generating caption');
      setLoading(false);
      setCurrentStep(0);
    }
  };

  const handleCopy = () => {
    if (editedCaption) {
      navigator.clipboard.writeText(editedCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleRegenerate = async () => {
    if (!property) return;
    setIsRegenerating(true);
    setCopied(false);
    try {
      const res = await fetch('/api/regenerate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property,
          style: captionStyle,
          currentCaption: editedCaption
        }),
      });
      const data = await res.json();
      if (!data.caption) throw new Error(data.message || 'Failed to regenerate caption');
      setCaption(data.caption);
      setEditedCaption(data.caption);
    } catch (err) {
      setError(err.message || 'Error regenerating caption');
    } finally {
      setIsRegenerating(false);
    }
  };

  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  // Gallery logic
  const images =
    (property?.galleryImages && property.galleryImages.length > 0 && property.galleryImages) ||
    (property?.allImages && property.allImages.length > 0 && property.allImages) ||
    (property?.mainImage ? [property.mainImage] : []);
  const mainImage = images[selectedImageIdx] || '/images/placeholder.jpg';

  // Steps for the progress UI
  const steps = [
    { label: 'Scraping Property Details', icon: '🏠', description: 'Fetching all property information and images from the listing' },
    { label: 'Extracting information', icon: '📊', description: 'Processing and organizing the property data' },
    { label: 'Creating Caption', icon: '✍️', description: 'Generating engaging captions for your property' }
  ];

  // --> START CHANGE: Add console logs for debugging images <--
  console.log('Rendering CaptionGenerator...');
  console.log('Property state:', property);
  console.log('Calculated images array:', images);
  console.log('Calculated images length:', images.length);
  // --> END CHANGE <--

  return (
    <ProtectedRoute>
      <div className="dashboard">
        <Head>
          <title>Caption Generator - Trofai</title>
        </Head>
        <MobileMenu activePage="caption" />
        <Sidebar activePage="caption" />
        <div className="dashboard-container">
          <DashboardHeader />
          <main className="main">
            <div className="content">
              <div className="dashboard-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <h1 className="title">Caption Generator</h1>
                  <FiPlayCircle 
                    onClick={openVideoModal}
                    style={{ 
                      fontSize: '1.5rem',
                      color: '#62d76b',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#56c15f'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#62d76b'}
                    title="Watch How-To Video"
                  />
                </div>
                <p className="subtitle">Paste a Rightmove, OnTheMarket or Zillow property link. Get a beautiful caption that sells.</p>
              </div>
              <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <PropertyURLForm onSubmit={handleSubmit} buttonText={loading ? 'Generating...' : 'Make it Happen'} />
              </div>
              {error && <div className="error-message">{error}</div>}
              {loading && (
                <div className="cg-progress-inline">
                  <div className="steps-container">
                    {steps.map((step, idx) => (
                      <div key={step.label} className={`step ${currentStep === idx + 1 ? 'active' : ''}`}>
                        <div className="step-number">
                          <div className={currentStep === idx + 1 ? 'step-active' : 'step-inactive'}>{idx + 1}</div>
                        </div>
                        <div className="step-content">
                          <div className="step-info">
                            <div className="step-header">
                              <span className="step-emoji">{step.icon}</span>
                              <span className="step-label">{step.label}</span>
                            </div>
                            <div className="step-description">{step.description}</div>
                          </div>
                          {currentStep === idx + 1 && (
                            <div className="progress-bar"><div className="progress-fill"></div></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {caption && property && (
                <>
                  <div className="cg-row-layout">
                    <div className="cg-gallery-col">
                      <div className="main-image-wrapper">
                        <img
                          src={typeof mainImage === 'string' ? mainImage : mainImage.url || '/images/placeholder.jpg'}
                          alt="Property"
                          className="main-image"
                        />
                      </div>
                      {images.length > 1 && (
                        <div className="thumbnails-row">
                          {images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url || img}
                              alt={`Property ${idx + 1}`}
                              className={`thumbnail${selectedImageIdx === idx ? ' selected' : ''}`}
                              onClick={() => setSelectedImageIdx(idx)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="cg-details-col">
                      <div className="cg-details-card">
                        <div className="cg-details-title">Property Details</div>
                        <div className="cg-details-list">
                          {property.address && (
                            <div className="cg-detail-row"><FiMapPin className="cg-detail-icon" /> <span>{property.address}</span></div>
                          )}
                          {property.price && (
                            <div className="cg-detail-row"><FiHome className="cg-detail-icon" /> <span>{property.price}</span></div>
                          )}
                          {Number(property.bedrooms) > 0 && (
                            <div className="cg-detail-row"><FaBed className="cg-detail-icon" /> <span>{property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}</span></div>
                          )}
                          {property.bathrooms && (
                            <div className="cg-detail-row"><FaBath className="cg-detail-icon" /> <span>{property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}</span></div>
                          )}
                          {property.square_ft && (
                            <div className="cg-detail-row"><FiHome className="cg-detail-icon" /> <span>{property.square_ft} sq ft</span></div>
                          )}
                          {property.propertyType && (
                            <div className="cg-detail-row"><FiHome className="cg-detail-icon" /> <span>{property.propertyType}</span></div>
                          )}
                          {(property.estateAgent?.name || property.estate_agent?.name || property.agent?.name) && (
                            <div className="cg-detail-row"><FiUser className="cg-detail-icon" /> <span>{property.estateAgent?.name || property.estate_agent?.name || property.agent?.name}</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="cg-caption-section">
                    <div className="caption-edit-box">
                      <div className="caption-header-row">
                        <span className="caption-label">Instagram Caption</span>
                        <div className="caption-actions">
                          <button 
                            className="caption-action regenerate" 
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                          >
                            <FiRefreshCw className={`icon ${isRegenerating ? 'spinning' : ''}`} />
                            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                          </button>
                          <button 
                            className="caption-action" 
                            onClick={handleCopy}
                          >
                            <FiCopy className="icon" />
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="caption-style-row">
                        <label htmlFor="caption-style-select" className="caption-style-label">Caption Style:</label>
                        <select
                          id="caption-style-select"
                          className="caption-style-select"
                          value={captionStyle}
                          onChange={e => setCaptionStyle(e.target.value)}
                        >
                          {CAPTION_STYLES.map(style => (
                            <option key={style.value} value={style.value}>{style.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        className="caption-textarea"
                        value={editedCaption}
                        onChange={e => setEditedCaption(e.target.value)}
                        rows={10}
                        placeholder="Your caption will appear here for editing..."
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
        <Modal 
          isOpen={isVideoModalOpen} 
          onClose={closeVideoModal} 
          title="How to Use the Caption Generator"
        >
          <div style={{ 
            padding: 0, 
            margin: '-1.5rem', 
            overflow: 'hidden',
            borderRadius: '0 0 12px 12px' 
          }}>
            <div style={{ 
              position: 'relative', 
              paddingBottom: '56.25%',
              height: 0, 
              overflow: 'hidden', 
              maxWidth: '100%', 
              background: '#000'
            }}>
              <iframe 
                src="https://player.vimeo.com/video/1068879779?autoplay=1&title=0&byline=0&portrait=0" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
                title="Caption Generator Tutorial"
              ></iframe>
            </div>
          </div>
        </Modal>
        <style jsx>{`
          .dashboard {
            min-height: 100vh;
            background: linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
          }
          .dashboard-container {
            margin-left: 240px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .main {
            flex: 1;
            padding: 2rem;
          }
          .content {
            max-width: 1100px;
            margin: 0 auto;
          }
          .dashboard-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .title {
            margin: 0;
            line-height: 1.15;
            font-size: 3.5rem;
            font-weight: 900;
            color: #111;
          }
          .subtitle {
            line-height: 1.5;
            font-size: 1.2rem;
            margin: 1rem 0 0;
            color: #333;
          }
          .cg-row-layout {
            display: flex;
            flex-direction: column;
            gap: 2.5rem;
            margin-top: 2.5rem;
            align-items: stretch;
          }
          @media (min-width: 1100px) {
            .cg-row-layout {
              flex-direction: row;
              gap: 2.5rem;
              align-items: flex-start;
              justify-content: center;
            }
            .cg-gallery-col {
              flex: 0 0 60%;
              max-width: 60%;
              min-width: 340px;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            .cg-details-col {
              flex: 0 0 25%;
              max-width: 25%;
              min-width: 220px;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
            }
          }
          @media (max-width: 1099px) {
            .cg-gallery-col, .cg-details-col {
              max-width: 100%;
              min-width: 0;
              align-items: stretch;
            }
          }
          .cg-gallery-col {
            width: 100%;
            margin-bottom: 0;
          }
          .main-image-wrapper {
            width: 100%;
            aspect-ratio: 16/10;
            background: #fff;
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.9rem;
            border: 2px solid #e2e8f0;
            box-shadow: 0 4px 24px rgba(98, 215, 107, 0.13);
            min-height: 320px;
            max-height: 440px;
          }
          .main-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 16px;
            background: #f8fafc;
          }
          .thumbnails-row {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.3rem;
            overflow-x: auto;
            width: 100%;
            justify-content: flex-start;
            padding-bottom: 2px;
          }
          .thumbnail {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 9px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: border 0.2s, box-shadow 0.2s;
            background: #f3f3f3;
            box-shadow: 0 1px 6px rgba(98, 215, 107, 0.10);
          }
          .thumbnail.selected {
            border: 2.5px solid #62d76b;
            box-shadow: 0 2px 12px rgba(98, 215, 107, 0.18);
          }
          .cg-details-col {
            width: 100%;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
          }
          .cg-details-card {
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 12px rgba(98, 215, 107, 0.10);
            padding: 1.1rem 1.5rem 1.1rem 1.5rem;
            margin-bottom: 0.5rem;
            min-width: 200px;
            max-width: 350px;
          }
          .cg-details-title {
            font-size: 1.15rem;
            font-weight: 700;
            color: #276749;
            margin-bottom: 1.1rem;
            letter-spacing: 0.01em;
          }
          .cg-details-list {
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
          }
          .cg-detail-row {
            display: flex;
            align-items: center;
            gap: 0.7rem;
            font-size: 1.04rem;
            color: #222;
            font-weight: 500;
          }
          .cg-detail-icon {
            color: #62d76b;
            font-size: 1.1rem;
            flex-shrink: 0;
          }
          .cg-caption-section {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-top: 3.5rem;
            margin-bottom: 2rem;
          }
          .caption-edit-box {
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 2px 16px rgba(98, 215, 107, 0.13);
            padding: 2.5rem 3.5rem 2.7rem 3.5rem;
            display: flex;
            flex-direction: column;
            min-width: 0;
            max-width: 900px;
            width: 100%;
          }
          .caption-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.1rem;
            gap: 1.5rem;
          }
          .caption-label {
            font-size: 1.18rem;
            font-weight: 600;
            color: #276749;
            letter-spacing: 0.01em;
          }
          .caption-actions {
            display: flex;
            gap: 0.7rem;
          }
          .caption-action {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: #62d76b;
            color: black;
            border: 2px solid black;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
            white-space: nowrap;
          }
          
          .caption-action:hover {
            background: #56c15f;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }
          
          .caption-action:active {
            transform: translateY(1px);
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          }
          
          .caption-action:disabled {
            background: #ccc;
            cursor: not-allowed;
            opacity: 0.7;
            transform: none;
            box-shadow: none;
            border-color: #999;
          }
          
          .caption-action.regenerate {
            background: #e2e8f0;
          }
          
          .caption-action.regenerate:hover {
            background: #cbd5e1;
            box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
            transform: translateY(-1px);
          }
          
          .caption-action.regenerate:active {
            transform: translateY(1px);
            box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
          }
          
          .icon {
            font-size: 1.1rem;
          }
          
          .icon.spinning {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .error-message {
            color: #e53e3e;
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          @media (max-width: 1100px) {
            .cg-row-layout {
              flex-direction: column;
              gap: 1.5rem;
            }
            .cg-gallery-col, .cg-details-col {
              max-width: 100%;
              min-width: 0;
              align-items: stretch;
            }
            .cg-caption-section {
              margin-top: 2.2rem;
              padding-left: 0.5rem;
              padding-right: 0.5rem;
            }
            .caption-edit-box {
              padding: 1.5rem 1rem 1.5rem 1rem;
              border-radius: 12px;
            }
          }
          @media (max-width: 600px) {
            .main {
              padding: 1rem;
            }
            .content {
              max-width: 100%;
            }
            .cg-row-layout {
              flex-direction: column;
              gap: 1.1rem;
            }
            .cg-gallery-col, .cg-details-col {
              max-width: 100%;
              padding: 0;
            }
            .main-image-wrapper {
              border-radius: 10px;
              min-height: 180px;
              max-height: 260px;
            }
            .caption-edit-box {
              padding: 1rem 0.2rem 1.2rem 0.2rem;
              border-radius: 10px;
            }
            .cg-details-card {
              padding: 1rem 0.7rem 1rem 0.7rem;
              border-radius: 10px;
            }
            .cg-caption-section {
              margin-top: 1.2rem;
            }
          }
          .caption-style-row {
            display: flex;
            align-items: center;
            gap: 0.7rem;
            margin-bottom: 1.1rem;
          }
          .caption-style-label {
            font-size: 1rem;
            color: #276749;
            font-weight: 500;
          }
          .caption-style-select {
            font-size: 1rem;
            padding: 0.5rem 1.2rem 0.5rem 0.7rem;
            border-radius: 7px;
            border: 1.5px solid #e2e8f0;
            background: #f8fafc;
            color: #222;
            outline: none;
            transition: border 0.2s;
          }
          .caption-style-select:focus {
            border-color: #62d76b;
          }
          .grey-btn {
            background: #f3f3f3 !important;
            color: #333 !important;
            border: 1.5px solid #bdbdbd !important;
            box-shadow: none !important;
          }
          .grey-btn:hover {
            background: #e2e8e0 !important;
            color: #222 !important;
            border-color: #a0aec0 !important;
          }
          .caption-textarea {
            width: 100%;
            min-height: 220px;
            padding: 1.3rem;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-family: inherit;
            font-size: 1.13rem;
            resize: vertical;
            background: #f8fafc;
            color: #222;
            margin-top: 0.7rem;
            box-shadow: 0 1px 8px rgba(98, 215, 107, 0.09);
          }
          .caption-textarea:focus {
            outline: none;
            border-color: #62d76b;
            box-shadow: 0 0 0 2px rgba(98, 215, 107, 0.15);
          }
          .cg-progress-inline {
            margin-top: 2rem;
            background: linear-gradient(to top, #f2fbf3, #f5fcf6, #ffffff);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid #e2e8f0;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }
          .steps-container {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
          }
          .step {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 0.75rem;
            border-radius: 8px;
            background: white;
            border: 1px solid #e2e8f0;
          }
          .step.active {
            border-color: #62d76b;
            background: rgba(98, 215, 107, 0.05);
          }
          .step-number {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
          }
          .step-active, .step-inactive {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .step-active {
            background: #62d76b;
            color: white;
          }
          .step-inactive {
            background: #e2e8f0;
            color: #4a5568;
          }
          .step-content {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }
          .step-info {
            flex: 1;
          }
          .step-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
          }
          .step-emoji {
            font-size: 1.25rem;
          }
          .step-label {
            font-weight: 500;
            color: #2d3748;
          }
          .step-description {
            color: #718096;
            font-size: 0.875rem;
          }
          .progress-bar {
            width: 200px;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            overflow: hidden;
            flex-shrink: 0;
          }
          .progress-fill {
            height: 100%;
            background: #62d76b;
            animation: progress 2s ease-in-out infinite;
          }
          @keyframes progress {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
} 