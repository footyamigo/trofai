import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { FiChevronDown, FiChevronUp, FiPlus, FiCheck } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaTiktok, FaTwitter } from 'react-icons/fa'; // Update social icon imports
import Button from '../components/UI/Button';
import FrontendHeader from '../components/Layout/FrontendHeader';
import Footer from '../components/Layout/Footer';

// Reference colors (can be refined)
const darkGreen = '#1A4D2E'; // Dark green background
const lightContrast = '#F0FFF0'; // Light text/accents (Honeydew)
const accentGreen = '#62D76B'; // Accent green from buttons

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const templateScrollRef = useRef(null);
  const testimonialScrollRef = useRef(null); // Add ref for testimonials
  
  // Function to handle horizontal scrolling with mouse wheel
  const handleWheel = (e, ref) => { // Modify to accept ref
    if (ref.current) {
      ref.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };
  
  // Auto scroll templates carousel with continuous loop effect
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (templateScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = templateScrollRef.current;
        const newScrollLeft = scrollLeft + 5.5;
        if (scrollLeft > (scrollWidth / 2)) {
          templateScrollRef.current.style.scrollBehavior = 'auto';
          templateScrollRef.current.scrollLeft = 0;
          setTimeout(() => {
            templateScrollRef.current.style.scrollBehavior = 'smooth';
          }, 50);
        } else {
          templateScrollRef.current.scrollLeft = newScrollLeft;
        }
      }
    }, 10);
    return () => clearInterval(scrollInterval);
  }, []);

  // Auto scroll testimonials carousel with continuous loop effect
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      if (testimonialScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = testimonialScrollRef.current;
        // Use the exact same increment as the template scroll
        const newScrollLeft = scrollLeft + 5.5; 
        if (scrollLeft > (scrollWidth / 2)) {
          testimonialScrollRef.current.style.scrollBehavior = 'auto';
          testimonialScrollRef.current.scrollLeft = 0;
          setTimeout(() => {
            testimonialScrollRef.current.style.scrollBehavior = 'smooth';
          }, 50);
        } else {
          testimonialScrollRef.current.scrollLeft = newScrollLeft;
        }
      }
    }, 10); // Use the exact same interval delay as the template scroll
    return () => clearInterval(scrollInterval);
  }, []);
  
  // Redirect authenticated users to the dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      <Head>
        <title>Trofai - Listing Designs That Get Results</title>
        <meta name="description" content="Turn your property listings into scroll-stopping social media content in seconds." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <FrontendHeader scrollToSection={scrollToSection} />

      <main className="main">
        <div className="hero-section">
        <div className="hero">
            <div className="hero-text">
              <h1 className="title">
                The secret to better marketing?<br />
                Stop <span className="hero-italic">doing it all by yourself.</span>
              </h1>
          <p className="subtitle">
                Stop guessing what to post or how to grow your business online.
                With customizable templates, done-for-you campaigns, and strategic
                tools, we make marketing seamless—and seriously effective.
              </p>
              
              {/* Review Summary Component */}
              <div className="hero-review-summary">
                <div className="review-avatars">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Reviewer 1" className="review-avatar" />
                  <img src="https://randomuser.me/api/portraits/men/43.jpg" alt="Reviewer 2" className="review-avatar" />
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Reviewer 3" className="review-avatar" />
                  <img src="https://randomuser.me/api/portraits/men/61.jpg" alt="Reviewer 4" className="review-avatar" />
                </div>
                <div className="review-rating">
                  <div className="hero-stars">
                    <span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span><span className="star">★</span>
                  </div>
                  <p className="review-count">from 84 reviews</p>
                </div>
              </div>
              
              {/* Removed CTA button */}
              {/* 
          <div className="cta-buttons">
            <Link href="/auth/signup">
                  <Button fullWidth>Your Free Marketing Plan</Button>
            </Link>
              </div>
              */}
            </div>
            
            <div className="browser-container">
              <div className="browser-frame">
                <div className="browser-header">
                  <div className="browser-actions">
                    <span className="browser-action close"></span>
                    <span className="browser-action minimize"></span>
                    <span className="browser-action expand"></span>
                  </div>
                  <div className="browser-address-bar">
                    <div className="browser-url">trofai.com/property-designs</div>
                  </div>
                  <div className="browser-controls">
                    <span className="browser-control"></span>
                  </div>
                </div>
                <div className="browser-content">
                  <iframe 
                    src="https://player.vimeo.com/video/1033460614?h=e8c0107071&title=0&byline=0&portrait=0&autoplay=0" 
                    frameBorder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowFullScreen
                    title="Trofai Demo Video">
                  </iframe>
                </div>
              </div>
              
              <div className="browser-shadow"></div>
            </div>
          </div>
        </div>

        {/* Templates Showcase Section */}
        <div id="templates-showcase" className="templates-showcase-section">
          <div className="container">
            <h2 className="templates-title">
              The secret to better marketing?<br />
              Stop <span className="templates-italic">doing it all by yourself.</span>
            </h2>
            <p className="templates-description">
              Stop guessing what to post or how to grow your business online.
              With customizable templates, done-for-you campaigns, and strategic
              tools, we make marketing seamless—and seriously effective.
            </p>
            
            <div className="templates-actions">
              <Link href="/auth/signup">
                <button className="template-action-button primary">Join Today</button>
              </Link>
              <Link href="/templates">
                <button className="template-action-button secondary">
                  Search our content <span className="arrow-icon">→</span>
                </button>
            </Link>
          </div>
        </div>

          <div 
            className="templates-carousel" 
            ref={templateScrollRef}
            onWheel={(e) => handleWheel(e, templateScrollRef)}
          >
            {/* Original template items */}
            <div className="template-category">
              <h3 className="category-title">POST TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/post-template-example.jpg" alt="Social media post template" className="template-image" />
          </div>
          </div>
            
            <div className="template-category">
              <h3 className="category-title">MARKETING GUIDES</h3>
              <div className="template-image-container">
                <img src="/images/marketing-guide-example.jpg" alt="Marketing guide example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">REEL TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/reel-template-example.jpg" alt="Reel template example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">EVENTS & TRAININGS</h3>
              <div className="template-image-container">
                <img src="/images/events-example.jpg" alt="Events and trainings example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">EMAIL MARKETING</h3>
              <div className="template-image-container">
                <img src="/images/email-template-example.jpg" alt="Email marketing template" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">POST TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/post-template-example2.jpg" alt="Social media post template" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">MARKETING GUIDES</h3>
              <div className="template-image-container">
                <img src="/images/marketing-guide-example2.jpg" alt="Marketing guide example" className="template-image" />
              </div>
            </div>
            
            {/* Duplicated items for continuous scrolling illusion */}
            <div className="template-category">
              <h3 className="category-title">POST TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/post-template-example.jpg" alt="Social media post template" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">MARKETING GUIDES</h3>
              <div className="template-image-container">
                <img src="/images/marketing-guide-example.jpg" alt="Marketing guide example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">REEL TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/reel-template-example.jpg" alt="Reel template example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">EVENTS & TRAININGS</h3>
              <div className="template-image-container">
                <img src="/images/events-example.jpg" alt="Events and trainings example" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">EMAIL MARKETING</h3>
              <div className="template-image-container">
                <img src="/images/email-template-example.jpg" alt="Email marketing template" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">POST TEMPLATES</h3>
              <div className="template-image-container">
                <img src="/images/post-template-example2.jpg" alt="Social media post template" className="template-image" />
              </div>
            </div>
            
            <div className="template-category">
              <h3 className="category-title">MARKETING GUIDES</h3>
              <div className="template-image-container">
                <img src="/images/marketing-guide-example2.jpg" alt="Marketing guide example" className="template-image" />
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div id="testimonials" className="testimonials-section">
          <div className="testimonial-top-border"></div>
          <div className="container">
            <div className="testimonials-container">
              <div className="testimonial-column">
                <div className="testimonial-avatar-wrapper">
                  <img src="https://randomuser.me/api/portraits/men/42.jpg" alt="Giovanni Ruiz" className="testimonial-avatar" />
                </div>
                <div className="testimonial-stars">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <div className="testimonial-content">
                  <p className="testimonial-text">
                    "Best money I've ever spent in real estate. I love the content and it's changed my social media presence into something I'm proud of."
                  </p>
                  <p className="testimonial-author">Giovanni Ruiz</p>
                </div>
              </div>
              
              <div className="testimonial-column">
                <div className="testimonial-avatar-wrapper">
                  <img src="https://randomuser.me/api/portraits/women/33.jpg" alt="Brittany Richards" className="testimonial-avatar" />
                </div>
                <div className="testimonial-stars">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <div className="testimonial-content">
                  <p className="testimonial-text">
                    "I used this yesterday and got a $700k listing!!! So excited!! &lt;3 Thank you for everything you provide for us."
                  </p>
                  <p className="testimonial-author">Brittany Richards</p>
                </div>
              </div>
              
              <div className="testimonial-column">
                <div className="testimonial-avatar-wrapper">
                  <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Marie Lee" className="testimonial-avatar" />
                </div>
                <div className="testimonial-stars">
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                  <span className="star">★</span>
                </div>
                <div className="testimonial-content">
                  <p className="testimonial-text">
                    "C&C is single-handedly the most valuable resource I invest in that has the biggest ROI for my business"
                  </p>
                  <p className="testimonial-author">Marie Lee</p>
                </div>
              </div>
            </div>
          </div>
          <div className="testimonial-bottom-border"></div>
        </div>

        {/* New marketing section - text on left, app screenshot on right */}
        <div className="marketing-section">
          <div className="container">
            <div className="marketing-content">
              <div className="marketing-text">
                <h2 className="marketing-title">
                  Start creating <span className="accent">stunning</span> property designs today
                </h2>
                <p className="marketing-description">
                  Your first 3 designs are on us! No credit card needed. Simply paste your property listing URL and we'll transform it into professional marketing content in seconds.
                </p>
                <div className="marketing-cta">
                  <Link href="/auth/signup">
                    <Button className="cta-light-contrast">Get Started Today</Button>
                  </Link>
                </div>
              </div>

              <div className="marketing-visual">
                <div className="video-wrapper">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    src="https://www.nejo.ai/vid1.mp4" 
                    className="video-player"
                  />
                  {/* Add subtle glow effect div */}
                  <div className="video-glow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Features Section with Green Background */}
        <div className="features-section">
          <div className="container">
            <div className="features-grid">
              {/* Video on Left */}
              <div className="feature-visual">
                <div className="video-wrapper">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    src="https://www.nejo.ai/vid1.mp4" 
                    className="video-player"
                  />
                  {/* Add subtle glow effect div */}
                  <div className="video-glow"></div>
                </div>
              </div>
              
              {/* Text on Right */}
              <div className="feature-details">
                <h2 className="feature-title">
                  Transform your <span className="accent">listings</span> into engaging content
                </h2>
                
                <p className="feature-description">
                  Our powerful AI tools make it effortless to create professional marketing materials for your properties. Simply paste a property URL, and we'll automatically extract all the key information, generate beautiful designs, and craft engaging captions that highlight the best features.
                </p>
                
                <div className="feature-cta">
                  <Link href="/auth/signup">
                    <Button>Get Started Today</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Green Section with Video Right */}
        <div className="secondary-features-section">
          <div className="container">
            <div className="secondary-features-grid">
              {/* Text on Left */}
              <div className="secondary-feature-details">
                <h2 className="secondary-feature-title">
                  Elevate your <span className="accent">marketing</span> effortlessly
                </h2>
                <p className="secondary-feature-description">
                  Our platform provides advanced tools to enhance your listings. Create stunning visuals, track performance, and engage clients like never before. 
                </p>
                <div className="secondary-feature-cta">
                  <Link href="/auth/signup">
                    <Button className="cta-light-contrast">Explore Features</Button>
                  </Link>
                </div>
              </div>
              
              {/* Video on Right */}
              <div className="secondary-feature-visual">
                <div className="video-wrapper">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    src="https://www.nejo.ai/vid2.mp4" /* Different video source */
                    className="video-player"
                  />
                  <div className="video-glow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="social-proof-section">
          <div className="container">
            <h2 className="section-title">
              See why agents like you<br /> choose Trofai
            </h2>
            
            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-card">
                <h3 className="stat-number">1000+</h3>
                <p className="stat-label">Properties Transformed</p>
              </div>
              
              <div className="stat-card">
                <h3 className="stat-number">200%</h3>
                <p className="stat-label">Engagement Increase</p>
              </div>
              
              <div className="stat-card">
                <h3 className="stat-number">5.0 <span className="stars">★★★★★</span></h3>
                <p className="stat-label">Agents love Trofai</p>
              </div>
            </div>
            
            {/* Testimonials Carousel */}
            <div 
              className="social-proof-testimonials-carousel"
              ref={testimonialScrollRef}
              onWheel={(e) => handleWheel(e, testimonialScrollRef)} // Pass the ref
            >
              {/* Original 6 Testimonials */}
              <div className="social-testimonial-card">
                <div className="testimonial-header">
                  <div className="avatar" style={{ backgroundColor: "#6366F1" }}>JD</div>
                  <div className="user-info">
                    <h4>John D.</h4>
                    <p>Real Estate Agent, London</p>
                  </div>
                </div>
                <p className="testimonial-text">
                  Since I started using Trofai, my engagement has increased dramatically. I can create stunning property listings in seconds that used to take me hours with a designer. The AI captions are professional and engaging.
                </p>
              </div>
              <div className="social-testimonial-card">
                <div className="testimonial-header">
                  <div className="avatar" style={{ backgroundColor: "#F43F5E" }}>SL</div>
                  <div className="user-info">
                    <h4>Sarah L.</h4>
                    <p>Broker, New York</p>
                  </div>
                </div>
                <p className="testimonial-text">
                  Trofai has completely changed how I market properties. I used to struggle to create eye-catching content, but now I can generate beautiful designs in minutes. My clients are impressed with the professional quality.
                </p>
              </div>
              <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#10B981" }}>MK</div>
                   <div className="user-info">
                     <h4>Mike K.</h4>
                     <p>Property Manager, Sydney</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   I love how easy Trofai makes it to create professional marketing materials. Just paste in a listing URL and it does all the work. The social media posts get significantly more engagement than my old content.
                 </p>
              </div>
              <div className="social-testimonial-card">
                <div className="testimonial-header">
                  <div className="avatar" style={{ backgroundColor: "#EC4899" }}>JT</div>
                  <div className="user-info">
                    <h4>Jennifer T.</h4>
                    <p>Real Estate Photographer</p>
                  </div>
                </div>
                <p className="testimonial-text">
                  As a photographer, I was skeptical about AI-generated designs, but Trofai exceeded my expectations. It enhances my photos and creates stunning layouts that showcase properties perfectly. It's now an essential part of my workflow.
                </p>
              </div>
              <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#F59E0B" }}>RM</div>
                   <div className="user-info">
                     <h4>Robert M.</h4>
                     <p>Agency Owner, Toronto</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   My entire team now uses Trofai. It's saved us countless hours and improved our brand consistency. The designs are modern and eye-catching, and we've seen a measurable increase in listing inquiries.
                 </p>
              </div>
              <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#8B5CF6" }}>AL</div>
                   <div className="user-info">
                     <h4>Amy L.</h4>
                     <p>Luxury Real Estate Specialist</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   Trofai helps me create luxury marketing content that matches the high-end properties I sell. The AI captions are sophisticated and the designs are elegant. My social media presence has never been stronger.
                 </p>
              </div>

              {/* Duplicated Testimonials for Continuous Scroll */}
              <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#6366F1" }}>JD</div>
                   <div className="user-info">
                     <h4>John D.</h4>
                     <p>Real Estate Agent, London</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   Since I started using Trofai, my engagement has increased dramatically. I can create stunning property listings in seconds that used to take me hours with a designer. The AI captions are professional and engaging.
                 </p>
              </div>
               <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#F43F5E" }}>SL</div>
                   <div className="user-info">
                     <h4>Sarah L.</h4>
                     <p>Broker, New York</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   Trofai has completely changed how I market properties. I used to struggle to create eye-catching content, but now I can generate beautiful designs in minutes. My clients are impressed with the professional quality.
                 </p>
              </div>
               <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#10B981" }}>MK</div>
                   <div className="user-info">
                     <h4>Mike K.</h4>
                     <p>Property Manager, Sydney</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   I love how easy Trofai makes it to create professional marketing materials. Just paste in a listing URL and it does all the work. The social media posts get significantly more engagement than my old content.
                 </p>
              </div>
               <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#EC4899" }}>JT</div>
                   <div className="user-info">
                     <h4>Jennifer T.</h4>
                     <p>Real Estate Photographer</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   As a photographer, I was skeptical about AI-generated designs, but Trofai exceeded my expectations. It enhances my photos and creates stunning layouts that showcase properties perfectly. It's now an essential part of my workflow.
                 </p>
              </div>
               <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#F59E0B" }}>RM</div>
                   <div className="user-info">
                     <h4>Robert M.</h4>
                     <p>Agency Owner, Toronto</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   My entire team now uses Trofai. It's saved us countless hours and improved our brand consistency. The designs are modern and eye-catching, and we've seen a measurable increase in listing inquiries.
                 </p>
              </div>
               <div className="social-testimonial-card">
                 <div className="testimonial-header">
                   <div className="avatar" style={{ backgroundColor: "#8B5CF6" }}>AL</div>
                   <div className="user-info">
                     <h4>Amy L.</h4>
                     <p>Luxury Real Estate Specialist</p>
                   </div>
                 </div>
                 <p className="testimonial-text">
                   Trofai helps me create luxury marketing content that matches the high-end properties I sell. The AI captions are sophisticated and the designs are elegant. My social media presence has never been stronger.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="pricing-section">
          <div className="container">
            <h3 className="pricing-subtitle">OUR PRICING</h3>
            <h2 className="pricing-title">
              Your marketing solution<br />
              that won't <span className="pricing-italic">break the bank</span>
            </h2>
            
            <div className="billing-toggle">
              <button 
                className={`toggle-option ${!isYearlyBilling ? 'active' : ''}`}
                onClick={() => setIsYearlyBilling(false)}
              >
                Billed Monthly
              </button>
              <button 
                className={`toggle-option ${isYearlyBilling ? 'active' : ''}`}
                onClick={() => setIsYearlyBilling(true)}
              >
                Billed Yearly
              </button>
            </div>
            
            <div className="pricing-cards">
              <div className="pricing-card agent-card">
                <div className="plan-badge agent">Agent</div>
                <h3 className="price">
                  ${isYearlyBilling ? '59' : '74'} <span className="price-period">/mo</span>
                </h3>
                <div className="price-divider"></div>
                <ul className="feature-list">
                  <li>
                    <span className="feature-icon-wrapper agent">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>One usage license</span>
                  </li>
                  <li>
                    <span className="feature-icon-wrapper agent">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Access to all C&C Content</span>
                  </li>
                  <li>
                    <span className="feature-icon-wrapper agent">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Members-Only Facebook Group</span>
                  </li>
                </ul>
                <Link href="/auth/signup">
                  <button className="pricing-cta">Join Today</button>
                </Link>
              </div>
              
              <div className="pricing-card team-card">
                <div className="plan-badge team">Team</div>
                <h3 className="price">
                  ${isYearlyBilling ? '43' : '54'} <span className="price-period">/user a month</span>
                </h3>
                <div className="price-divider"></div>
                <ul className="feature-list">
                  <li>
                    <span className="feature-icon-wrapper team">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Individual logins for each agent</span>
                  </li>
                  <li>
                    <span className="feature-icon-wrapper team">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Discounted multi-usage license</span>
                  </li>
                  <li>
                    <span className="feature-icon-wrapper team">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Access to all C&C Content</span>
                  </li>
                  <li>
                    <span className="feature-icon-wrapper team">
                      <FiCheck className="feature-icon" />
                    </span>
                    <span>Members only Facebook Group</span>
                  </li>
                </ul>
                <Link href="/auth/signup">
                  <button className="pricing-cta">Join Today</button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="faq-section">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>

            <div className="faq-container">
              <FaqItem 
                question="Do you post on my social media for me?" 
                answer="No, we don't post directly to your social media accounts. Trofai creates the content for you, and then you can download and share it yourself. This gives you complete control over when and where your listings are shared."
              />
              
              <FaqItem 
                question="How much time is Trofai going to save me?" 
                answer="Our users report saving 3-4 hours per week on content creation. What would typically take 30-45 minutes per property listing can be done in just 2-3 minutes with Trofai, allowing you to focus more on client relationships and closing deals."
              />
              
              <FaqItem 
                question="What if I want to cancel?" 
                answer="You can cancel your subscription at any time with no questions asked. There are no long-term contracts, and you won't be charged any cancellation fees. Simply go to your account settings and click on 'Cancel Subscription'."
              />
              
              <FaqItem 
                question="How do I know if Trofai is right for me?" 
                answer="If you're a real estate professional who wants to save time on marketing, increase engagement on social media, and present your listings in a professional way, Trofai is designed for you. You can try our free plan with 3 property designs to see if it meets your needs before committing to a subscription."
              />
              
              <FaqItem 
                question="Will Trofai help me know what to post?" 
                answer="Yes! Trofai not only creates the visual content but also generates engaging captions that highlight the best features of your property. Our AI analyzes the listing and creates content that's optimized for engagement on social media platforms."
              />
              
              <FaqItem 
                question="Is Trofai free to use?" 
                answer="You can get started for free with our basic plan that includes 3 property designs. Premium plans with more features and unlimited designs are available starting at a low monthly fee."
              />
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="final-cta-section">
          <div className="cta-content">
            <h2 className="cta-title">
              Ready to transform<br /> your property listings?
            </h2>
            <p className="cta-description">Turn your property listings into scroll-stopping social media content in minutes.</p>
            
            <div className="cta-button-container">
              <Link href="/auth/signup">
                <Button>Get started now</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer scrollToSection={scrollToSection} />

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: ${darkGreen};
          color: ${lightContrast};
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: transparent;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: ${lightContrast};
          font-family: 'Jost', sans-serif;
          letter-spacing: 0;
        }
        
        .nav-and-auth {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-menu {
          display: flex;
          gap: 1.5rem;
        }

        .nav-link {
          color: ${lightContrast};
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .nav-link:hover {
          opacity: 0.8;
        }

        .auth-buttons {
          display: flex;
          gap: 0.75rem;
        }
        
        /* Style for outline button in header */
        :global(.outline) {
          background: transparent !important;
          border: 1px solid #4CAF50 !important;
          color: #4CAF50 !important;
          box-shadow: none !important;
        }
        
        :global(.outline:hover) {
          background: rgba(76, 175, 80, 0.1) !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .button {
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          text-decoration: none;
          font-size: 0.85rem;
        }

        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0;
        }
        
        .hero-section {
          width: 100%;
          background-color: rgba(26, 77, 46, 0.05); /* Very light green */
          padding: 2rem 2rem 4rem; /* Reduced top padding from 4rem to 2rem */
        }

        .hero {
          text-align: center;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .hero-text {
          margin-bottom: 1.5rem; /* Reduced from 3rem to 1.5rem */
        }

        .title {
          font-size: 3.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: ${lightContrast};
          line-height: 1.2;
          font-family: 'Jost', sans-serif;
          letter-spacing: -0.01em;
        }

        .hero-italic {
          font-style: italic;
        }

        .subtitle {
          font-size: 1.1rem;
          color: rgba(240, 255, 240, 0.8);
          margin-bottom: 1.25rem; /* Reduced from 2rem to 1.25rem */
          line-height: 1.6;
          max-width: 650px;
          margin-left: auto;
          margin-right: auto;
          font-weight: 400;
          font-family: 'Inter', sans-serif;
        }

        .cta-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .browser-container {
          position: relative;
          width: 90%;
          max-width: 1100px;
          margin: 0 auto 2rem; /* Reduced from 3rem to 2rem */
          z-index: 10;
        }
        
        .browser-frame {
          background: #1E1E1E;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 20px 40px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .browser-header {
          background: #2D2D2D;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .browser-actions {
          display: flex;
          gap: 8px;
          margin-right: 15px;
        }
        
        .browser-action {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .browser-action.close {
          background: #FF5F57;
        }
        
        .browser-action.minimize {
          background: #FEBC2E;
        }
        
        .browser-action.expand {
          background: #28C840;
        }
        
        .browser-address-bar {
          flex: 1;
          background: #1E1E1E;
          border-radius: 4px;
          height: 28px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          color: #AAA;
          font-size: 12px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        .browser-url {
          width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .browser-controls {
          margin-left: 15px;
        }
        
        .browser-content {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
        }
        
        .browser-content iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .browser-shadow {
          position: absolute;
          top: 0;
          right: -80px;
          bottom: 0;
          width: 160px;
          border-radius: 50%;
          background: rgba(49, 189, 82, 0.25);
          filter: blur(60px);
          z-index: -1;
          opacity: 0.8;
          pointer-events: none;
        }

        /* New Footer Styles */
        .new-footer {
          padding: 4rem 2rem;
          background-color: ${darkGreen}; /* Changed background to darkGreen */
          color: rgba(240, 255, 240, 0.7); /* Default light text color */
          border-top: 1px solid rgba(240, 255, 240, 0.2); /* Lighter border */
        }

        .footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr); /* 4 columns */
          gap: 2rem;
        }

        .footer-column {
          /* Styles for each column */
        }
        
        .social-column {
          justify-self: end; /* Align social icons to the right */
        }

        .footer-title {
          font-family: 'Times New Roman', Times, serif; /* Example serif font */
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 1.5rem;
          color: ${lightContrast}; /* Light title color */
        }

        .footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-link-list li {
          margin-bottom: 0.75rem;
        }

        .footer-link-list a,
        .footer-link-list span { /* For non-link items if any */
          color: rgba(240, 255, 240, 0.8); /* Light link color */
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: color 0.2s ease;
        }

        .footer-link-list a:hover {
          color: ${lightContrast}; /* Brighter hover color */
        }

        .footer-social-icons {
          display: flex;
          gap: 1rem; /* Adjusted gap */
          align-items: center; /* Center icons vertically */
        }

        .social-icon-link {
          display: inline-flex; /* Use flexbox for centering */
          align-items: center;
          justify-content: center;
          width: 40px; /* Set fixed width */
          height: 40px; /* Set fixed height */
          border-radius: 50%; /* Make it circular */
          color: rgba(240, 255, 240, 0.8); /* Light icon color */
          font-size: 1.1rem; /* Adjusted icon size */
          transition: all 0.3s ease;
          background-color: transparent; /* Default transparent background */
          border: 1px solid transparent; /* Placeholder for potential border */
        }

        .social-icon-link:hover {
          color: ${darkGreen}; /* Dark icon color on hover */
          background-color: ${lightContrast}; /* Light background on hover */
          transform: scale(1.1); /* Slightly larger on hover */
          border-color: ${lightContrast};
        }

        /* Responsive adjustments */
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 3rem;
          }
          .social-column {
             grid-column: 1 / -1; /* Span full width */
             justify-self: center; /* Center icons */
             margin-top: 1rem;
          }
        }

        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr; /* Stack columns */
            gap: 2rem;
          }
          .footer-column {
             text-align: center;
          }
           .social-column {
             margin-top: 1.5rem;
          }
        }

        @media (max-width: 1024px) {
          .title {
            font-size: 3.5rem;
          }
          
          .browser-container {
            width: 95%;
          }
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.8rem;
          }
          .subtitle {
            font-size: 1rem;
            max-width: 90%;
          }
          .header {
            padding: 1rem 1.5rem;
          }
          .auth-buttons {
            gap: 0.5rem;
          }
          .button {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
          .button.cta, .button.secondary {
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
          }
          .browser-container {
            width: 100%;
            margin-bottom: 2rem;
          }
          .browser-header {
            padding: 8px 10px;
          }
          .browser-actions {
            margin-right: 10px;
          }
          .browser-action {
            width: 10px;
            height: 10px;
          }
          .hero-section {
            padding: 3rem 1.5rem;
          }
          
          .browser-shadow {
            right: -40px;
            width: 100px;
          }
        }

        @media (max-width: 480px) {
          .header {
            flex-direction: column;
            gap: 1rem;
          }
          .auth-buttons {
            width: 100%;
          justify-content: center;
        }
          .title {
            font-size: 2rem;
          }
          .cta-buttons {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .button.cta, .button.secondary {
            width: 80%;
            justify-content: center;
          }
          .browser-header {
            padding: 6px 10px;
          }
          .browser-address-bar {
            height: 24px;
            font-size: 10px;
          }
          .browser-container {
            margin-left: -1rem;
            margin-right: -1rem;
            width: calc(100% + 2rem);
            border-radius: 0;
          }
          .browser-frame {
            border-radius: 0;
          }
          .hero-section {
            padding: 2rem 1rem;
          }
          
          .browser-shadow {
            right: -20px;
            width: 80px;
            opacity: 0.6;
          }
        }

        /* New marketing section styles */
        .marketing-section {
          width: 100%;
          padding: 6rem 2rem;
          background-color: ${darkGreen};
          color: ${lightContrast};
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .marketing-content {
          display: flex;
          align-items: center;
          gap: 3rem;
        }
        
        .marketing-text {
          flex: 0 0 45%;
          text-align: left;
        }
        
        .marketing-title {
          font-size: 3.2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: ${lightContrast};
          line-height: 1.1;
          font-family: 'Jost', sans-serif;
        }
        
        .accent {
          color: ${accentGreen};
        }
        
        .marketing-description {
          font-size: 1.2rem;
          color: rgba(240, 255, 240, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .marketing-cta {
          margin-top: 2rem;
        }
        
        .marketing-visual {
          flex: 0 0 55%;
        }
        
        /* Video wrapper and player styles */
        .video-wrapper {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .video-player {
          width: 100%;
          display: block;
          border-radius: 12px;
        }
        
        /* Glow effect for video */
        .video-glow {
          position: absolute;
          top: 0;
          right: -60px;
          bottom: 0;
          width: 120px;
          border-radius: 50%;
          background: rgba(49, 189, 82, 0.2);
          filter: blur(50px);
          z-index: -1;
          opacity: 0.8;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          /* Additional responsive styles for video */
          .video-glow {
            right: -40px;
            width: 80px;
          }
        }
        
        @media (max-width: 480px) {
          /* Mobile video styles */
          .video-glow {
            right: -20px;
            width: 60px;
            opacity: 0.6;
          }
        }

        /* Social Proof Section Styles */
        .social-proof-section {
          padding: 6rem 2rem;
          background-color: #f9fafb;
          width: 100%;
        }
        
        .section-title {
          text-align: center;
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 3rem;
          color: #333;
          font-family: 'Jost', sans-serif;
        }
        
        /* Stats Row Styles */
        .stats-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        
        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          flex: 0 0 30%;
          text-align: center;
        }
        
        .stat-number {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: ${accentGreen};
          font-family: 'Jost', sans-serif;
        }
        
        .stars {
          color: #FFD700;
          font-size: 1.8rem;
        }
        
        .stat-label {
          font-size: 1.2rem;
          color: #666;
        }
        
        /* Testimonials Carousel */
        .social-proof-testimonials-carousel {
          display: flex;
          overflow-x: auto;
          padding: 1rem 0 2rem;
          scroll-behavior: smooth;
          -ms-overflow-style: none;  /* Hide scrollbar IE/Edge */
          scrollbar-width: none;  /* Hide scrollbar Firefox */
          margin: 0 -100vw; /* Allow scrolling outside container bounds */
          padding-left: calc(50vw - 600px + 1rem); /* Center first item approx */
          padding-right: calc(50vw - 600px + 1rem);
        }

        .social-proof-testimonials-carousel::-webkit-scrollbar {
          display: none; /* Hide scrollbar Chrome/Safari */
        }

        /* Update testimonial card class name and styles */
        .social-testimonial-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          flex: 0 0 380px; /* Fixed width for each card */
          margin-right: 1.5rem;
          display: flex;
          flex-direction: column; /* Ensure vertical layout inside card */
        }

        .testimonial-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 0.75rem;
        }

        .user-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .user-info p {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
        }

        .testimonial-text {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #444;
          flex-grow: 1; /* Allow text to take space */
        }

        /* Remove old row styles */
        .testimonials-row {
          display: none; 
        }

        /* Responsive adjustments for carousel */
        @media (max-width: 768px) {
          .social-proof-testimonials-carousel {
            padding-left: 1.5rem; /* Adjust padding for mobile */
            padding-right: 1.5rem;
            margin: 0 -1.5rem;
          }
          .social-testimonial-card {
            flex: 0 0 300px; /* Smaller cards on mobile */
          }
        }

        @media (max-width: 480px) {
          .social-testimonial-card {
            flex: 0 0 260px; /* Even smaller cards */
          }
        }

        /* Features Section Styles */
        .features-section {
          padding: 6rem 2rem;
          background-color: white;
          color: #333;
          width: 100%;
        }
        
        .features-grid {
          display: flex;
          align-items: center;
          gap: 4rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        
        .feature-visual {
          flex: 0 0 50%;
        }
        
        .feature-details {
          flex: 0 0 45%;
          text-align: left;
        }
        
        .feature-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #333;
          line-height: 1.2;
          font-family: 'Jost', sans-serif;
        }
        
        .feature-description {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .feature-cta {
          margin-top: 2rem;
        }
        
        /* Button styles that were accidentally removed */
        .button {
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          text-decoration: none;
        }

        .button.signin {
          background: transparent;
          color: ${lightContrast};
          border-color: ${lightContrast};
        }

        .button.signin:hover {
          background: rgba(240, 255, 240, 0.1);
        }

        .button.signup {
          background: ${accentGreen};
          color: ${darkGreen};
          border-color: ${accentGreen};
        }

        .button.signup:hover {
          background: #56c15f;
          border-color: #56c15f;
        }

        .button.cta {
          background: ${accentGreen};
          color: ${darkGreen};
          border-color: ${accentGreen};
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }

        .button.cta:hover {
          background: #56c15f;
          border-color: #56c15f;
          transform: translateY(-2px);
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .features-grid {
            gap: 2rem;
          }
          
          .feature-title {
            font-size: 2.4rem;
          }
          
          .feature-description {
            font-size: 1.2rem;
          }
        }
        
        @media (max-width: 768px) {
          .features-section {
            padding: 4rem 1.5rem;
          }
          
          .features-grid {
            flex-direction: column;
            gap: 3rem;
          }
          
          .feature-visual, 
          .feature-details {
            flex: 0 0 100%;
            width: 100%;
          }
          
          .feature-description {
            font-size: 1.2rem;
          }
          
          .feature-title {
          text-align: center;
            font-size: 2.2rem;
            margin-bottom: 2rem;
          }
          
          .feature-cta {
            display: flex;
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .features-section {
            padding: 3rem 1rem;
          }
          
          .feature-title {
            font-size: 1.8rem;
          }
          
          .feature-description {
            font-size: 1.2rem;
          }
        }

        /* FAQ Section Styles */
        .faq-section {
          padding: 6rem 2rem 3rem;
          background-color: white;
          width: 100%;
        }

        .faq-container {
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
        }

        .faq-item {
          padding: 1.5rem;
          background-color: #f0f5f0; /* Very light shade of green */
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
          font-size: 1.2rem;
          color: #333;
          font-family: 'Jost', sans-serif;
        }

        .faq-answer {
          margin-top: 1rem;
          color: #666;
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .faq-icon {
          font-size: 1.5rem;
          color: #333;
        }

        /* Final CTA Section Styles */
        .final-cta-section {
          padding: 5rem 2rem;
          background-color: #2A6E3F; /* Lighter shade of green than darkGreen */
          width: 100%;
          text-align: center;
          color: white;
        }

        .cta-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
          line-height: 1.2;
          font-family: 'Jost', sans-serif;
        }

        .cta-description {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 2.5rem;
          line-height: 1.6;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-button-container button {
          background-color: ${accentGreen};
          color: ${darkGreen};
          border: none;
          font-weight: 600;
          padding: 0.8rem 2.5rem;
          font-size: 1.1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .cta-button-container button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .final-cta-section {
            padding: 4rem 1.5rem;
          }
          
          .cta-title {
            font-size: 2.2rem;
          }
          
          .cta-description {
            font-size: 1.1rem;
            margin-bottom: 2rem;
          }
        }
        
        @media (max-width: 480px) {
          .final-cta-section {
            padding: 3rem 1rem;
          }
          
          .cta-title {
            font-size: 1.8rem;
          }
          
          .cta-description {
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
        }

        /* Pricing Section Styles */
        .pricing-section {
          padding: 6rem 2rem 3rem;
          background-color: white;
          width: 100%;
        }

        .pricing-subtitle {
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 1rem;
          color: #666;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .pricing-title {
          text-align: center;
          font-size: 3.2rem;
          font-weight: 600;
          margin-bottom: 3rem;
          color: #333;
          font-family: 'Jost', sans-serif;
          line-height: 1.2;
        }

        .pricing-italic {
          font-style: italic;
        }

        .billing-toggle {
          display: flex;
          justify-content: center;
          background: #fff;
          border-radius: 30px;
          padding: 0.35rem;
          margin: 0 auto 3rem;
          width: fit-content;
          border: 1px solid #e2e8f0;
        }

        .toggle-option {
          padding: 0.75rem 1.5rem;
          border-radius: 30px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: #666;
          transition: all 0.3s ease;
        }

        .toggle-option.active {
          background: #111;
          color: #fff;
        }

        .pricing-cards {
          display: flex;
          justify-content: center;
          gap: 2.5rem; /* Increased gap */
          margin-bottom: 2rem;
        }

        .pricing-card {
          background: #fff;
          border-radius: 16px; /* Slightly larger radius */
          padding: 2.5rem; /* Increased padding */
          width: 100%;
          max-width: 450px; /* Increased max-width */
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.07);
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .plan-badge {
          position: absolute;
          top: 0;
          left: 2.5rem;
          transform: translateY(-50%);
          padding: 0.6rem 1.75rem; /* Adjusted padding */
          border-radius: 30px;
          font-weight: 500;
          font-size: 1rem;
        }

        .plan-badge.agent {
          background-color: #f0e6ff;
          color: #7950f2;
        }

        .plan-badge.team {
          background-color: #d8e4bc;
          color: #5a733c;
        }

        .price {
          font-size: 4rem; /* Increased price font size */
          font-weight: 700;
          margin: 2rem 0 1.5rem;
          color: #222;
          font-family: 'Jost', sans-serif;
        }

        .price-period {
          font-size: 1.3rem;
          font-weight: 400;
          color: #888;
          margin-left: 0.25rem;
        }

        .price-divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 1.5rem 0;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0 0 2.5rem; /* Increased bottom margin */
          flex-grow: 1; /* Allow list to take available space */
        }

        .feature-list li {
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem; /* Increased spacing */
          color: #555;
          font-size: 1.05rem; /* Slightly larger font */
        }

        .feature-icon-wrapper {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
        }

        .feature-icon-wrapper.agent {
          background-color: #f0e6ff;
        }

        .feature-icon-wrapper.team {
          background-color: #d8e4bc;
        }

        .feature-icon {
          font-size: 0.9rem;
        }

        .feature-icon-wrapper.agent .feature-icon {
          color: #7950f2;
        }

        .feature-icon-wrapper.team .feature-icon {
          color: #5a733c;
        }

        .pricing-cta {
          width: 100%;
          padding: 1rem 1.5rem; /* Larger padding */
          border-radius: 30px; /* Fully rounded */
          background-color: #111;
          color: #fff;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-size: 1.1rem; /* Larger font size */
          transition: all 0.2s ease;
          margin-top: auto; /* Push button to bottom */
        }

        .pricing-cta:hover {
          background-color: #000;
        }

        @media (max-width: 992px) { /* Adjust breakpoint */
          .pricing-cards {
            gap: 1.5rem;
          }
          .pricing-card {
            max-width: 400px;
          }
        }

        @media (max-width: 768px) {
          .pricing-title {
            font-size: 2.5rem;
          }

          .pricing-cards {
            flex-direction: column;
            align-items: center;
            gap: 3rem; /* Add gap for stacked cards */
          }
          
          .pricing-card {
            max-width: 450px; /* Consistent width */
          }
        }

        @media (max-width: 480px) {
          .pricing-section {
            padding: 4rem 1rem 2rem;
          }
          
          .pricing-title {
            font-size: 2rem;
          }
          
          .toggle-option {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
        }

        /* Templates Showcase Section Styles */
        .templates-showcase-section {
          padding: 5rem 0 0;
          background-color: #f9f9f7;
          width: 100%;
          position: relative;
        }

        .templates-showcase-section .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          width: 100%;
        }

        .templates-title {
          text-align: center;
          font-size: 3.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #333;
          font-family: 'Jost', sans-serif;
          line-height: 1.2;
        }

        .templates-italic {
          font-style: italic;
        }

        .templates-description {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 2.5rem;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #555;
        }

        .templates-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .template-action-button {
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .template-action-button.primary {
          background-color: #111;
          color: white;
          border: none;
        }

        .template-action-button.secondary {
          background-color: transparent;
          color: #111;
          border: 1px solid #ddd;
        }

        .template-action-button.primary:hover {
          background-color: #000;
        }

        .template-action-button.secondary:hover {
          border-color: #111;
        }

        .arrow-icon {
          display: inline-block;
          margin-left: 0.5rem;
          transition: transform 0.2s ease;
        }

        .template-action-button.secondary:hover .arrow-icon {
          transform: translateX(3px);
        }

        .divider-line {
          display: none; /* Hide the red divider line */
        }

        .templates-carousel {
          display: flex;
          overflow-x: auto;
          width: 100%;
          padding: 0 0 3rem;
          scroll-behavior: smooth;
          -ms-overflow-style: none;  /* Hide scrollbar for IE and Edge */
          scrollbar-width: none;  /* Hide scrollbar for Firefox */
        }

        .templates-carousel::-webkit-scrollbar {
          display: none; /* Hide scrollbar for Chrome, Safari and Opera */
        }

        .template-category {
          flex: 0 0 auto;
          width: 300px;
          margin-right: 1.5rem;
          padding-left: 0.5rem;
        }

        .template-category:first-child {
          margin-left: 2rem;
        }

        .template-category:last-child {
          margin-right: 2rem;
          padding-right: 0.5rem;
        }

        .category-title {
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          color: #666;
          text-transform: uppercase;
        }

        .template-image-container {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          aspect-ratio: 4 / 5;
          background-color: #eee;
        }

        .template-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .template-image-container:hover .template-image {
          transform: scale(1.03);
        }

        @media (max-width: 768px) {
          .templates-showcase-section {
            padding: 4rem 0 0;
          }
          
          .templates-title {
            font-size: 2.5rem;
          }

          .templates-description {
            font-size: 1rem;
            padding: 0 1rem;
          }

          .templates-actions {
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
          }
          
          .template-action-button {
            width: 100%;
            max-width: 300px;
            text-align: center;
          }
          
          .template-category {
            width: 240px;
          }
        }

        @media (max-width: 480px) {
          .templates-showcase-section {
            padding: 3rem 0 0;
          }
          
          .templates-title {
            font-size: 2rem;
          }
          
          .template-category {
            width: 200px;
          }
          
          .template-category:first-child {
            margin-left: 1rem;
          }
          
          .template-category:last-child {
            margin-right: 1rem;
          }
        }

        /* Testimonials Section Styles */
        .testimonials-section {
          padding: 0;
          background-color: white;
          width: 100%;
          position: relative;
        }

        .testimonial-top-border,
        .testimonial-bottom-border {
          height: 1px;
          background-color: #e1e1e1;
          width: 100%;
        }

        .testimonials-section .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem;
          width: 100%;
        }

        .testimonials-container {
          display: flex;
          justify-content: space-between;
          margin: 0 auto;
          max-width: 1000px;
        }

        .testimonial-column {
          width: 30%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .testimonial-avatar-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .testimonial-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .testimonial-stars {
          margin-bottom: 1.5rem;
          color: #FFD700;
          font-size: 1.2rem;
          letter-spacing: 0.1rem;
        }

        .star {
          display: inline-block;
        }

        .testimonial-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #333;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .testimonial-author {
          font-size: 1rem;
          color: #777;
          font-weight: 400;
        }

        @media (max-width: 768px) {
          .testimonials-container {
            gap: 2rem;
          }
          
          .testimonial-card {
            max-width: 100%;
            width: 100%;
            margin-bottom: 2rem;
          }
          
          .testimonial-card:last-child {
            margin-bottom: 0;
          }
        }

        /* New Green Section with Video Right */
        .secondary-features-section {
          padding: 6rem 2rem;
          background-color: ${darkGreen};
          color: ${lightContrast};
          width: 100%;
        }

        .secondary-features-grid {
          display: flex;
          align-items: center;
          gap: 4rem;
          max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
          width: 100%;
        }

        .secondary-feature-details {
          flex: 0 0 45%;
          text-align: left;
        }

        .secondary-feature-visual {
          flex: 0 0 50%;
        }

        .secondary-feature-title {
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: ${lightContrast};
          line-height: 1.2;
          font-family: 'Jost', sans-serif;
        }

        .secondary-feature-description {
          font-size: 1.2rem;
          color: rgba(240, 255, 240, 0.8);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .secondary-feature-cta {
          margin-top: 2rem;
        }

        /* Reusing video styles - ensure these are defined or copy them */
        .secondary-feature-visual .video-wrapper {
          position: relative;
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .secondary-feature-visual .video-player {
          width: 100%;
          display: block;
          border-radius: 12px;
        }

        .secondary-feature-visual .video-glow {
          position: absolute;
          top: 0;
          right: -60px;
          bottom: 0;
          width: 120px;
          border-radius: 50%;
          background: rgba(49, 189, 82, 0.2);
          filter: blur(50px);
          z-index: -1;
          opacity: 0.8;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .secondary-features-section {
            padding: 4rem 1.5rem;
          }
          
          .secondary-features-grid {
            flex-direction: column-reverse; /* Video first on mobile */
            gap: 3rem;
          }
          
          .secondary-feature-visual,
          .secondary-feature-details {
            flex: 0 0 100%;
            width: 100%;
          }
          
          .secondary-feature-title {
            font-size: 2.2rem;
            text-align: center;
          }
          
          .secondary-feature-description {
            font-size: 1.1rem;
            text-align: center;
          }
          
          .secondary-feature-cta {
            display: flex;
            justify-content: center;
          }
          
          .secondary-feature-visual .video-glow {
            right: -40px;
            width: 80px;
          }
        }

        @media (max-width: 480px) {
          .secondary-features-section {
            padding: 3rem 1rem;
          }
          
          .secondary-feature-title {
            font-size: 1.8rem;
          }
          
          .secondary-feature-description {
            font-size: 1rem;
          }
          
          .secondary-feature-visual .video-glow {
            right: -20px;
            width: 60px;
            opacity: 0.6;
          }
        }

        /* Hero Review Summary Styles */
        .hero-review-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem; /* Reduced from 1.5rem to 0.5rem to bring video up higher */
          padding: 0.4rem 0.8rem;
          background-color: transparent; /* Removed white background */
          border-radius: 6px;
          border: none; /* Removed border */
          box-shadow: none; /* Removed shadow */
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          color: ${lightContrast}; /* Changed text color for dark background */
        }

        .review-avatars {
          display: flex;
        }

        .review-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none; /* Removed border */
          margin-left: -8px;
          object-fit: cover;
        }

        .review-avatar:first-child {
          margin-left: 0;
        }

        .review-rating {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .hero-stars {
          color: #FFC107;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }

        .review-count {
          font-size: 0.7rem;
          color: rgba(240, 255, 240, 0.8); /* Light contrast for dark background */
          font-weight: 500;
          margin: 0;
        }
      `}</style>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        /* Jost Font Declarations */
        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Thin.woff') format('woff');
          font-weight: 100;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-ThinItalic.woff') format('woff');
          font-weight: 100;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-ExtraLight.woff') format('woff');
          font-weight: 200;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-ExtraLightItalic.woff') format('woff');
          font-weight: 200;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Light.woff') format('woff');
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-LightItalic.woff') format('woff');
          font-weight: 300;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Regular.woff') format('woff');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Italic.woff') format('woff');
          font-weight: 400;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Medium.woff') format('woff');
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-MediumItalic.woff') format('woff');
          font-weight: 500;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-SemiBold.woff') format('woff');
          font-weight: 600;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-SemiBoldItalic.woff') format('woff');
          font-weight: 600;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Bold.woff') format('woff');
          font-weight: 700;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-BoldItalic.woff') format('woff');
          font-weight: 700;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-ExtraBold.woff') format('woff');
          font-weight: 800;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-ExtraBoldItalic.woff') format('woff');
          font-weight: 800;
          font-style: italic;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-Black.woff') format('woff');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'Jost';
          src: url('/fonts/Jost-BlackItalic.woff') format('woff');
          font-weight: 900;
          font-style: italic;
          font-display: swap;
        }

        html,
        body {
          padding: 0;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: 'Jost', sans-serif;
        }
      `}</style>
    </div>
  );
}

// FAQ Item Component
function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="faq-item">
      <div className="faq-question" onClick={() => setIsOpen(!isOpen)}>
        <span>{question}</span>
        <span className="faq-icon">
          {<FiPlus />}
        </span>
      </div>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
      
      <style jsx>{`
        .faq-item {
          padding: 1.5rem;
          background-color: #f0f5f0; /* Very light shade of green */
          border-radius: 12px;
          margin-bottom: 1rem;
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
          font-size: 1.2rem;
          color: #333;
          font-family: 'Jost', sans-serif;
        }

        .faq-answer {
          margin-top: 1rem;
          color: #666;
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .faq-icon {
          font-size: 1.5rem;
          color: #333;
        }
      `}</style>
    </div>
  );
} 