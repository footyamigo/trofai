import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Layout/Sidebar';
import MobileMenu from '../components/Layout/MobileMenu';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ProtectedRoute from '../src/components/ProtectedRoute';
import Button from '../components/UI/Button';
import { Country, City } from 'country-state-city';
import BlopSVG from '../components/BackgroundSvgs/BlopSVG';
import CirclesSVG from '../components/BackgroundSvgs/CirclesSVG';
import LineSVG from '../components/BackgroundSvgs/LineSVG';
import TopDotsSVG from '../components/BackgroundSvgs/TopDotsSVG';
import InlineTextEditor from '../components/InlineTextEditor';
import { usePreviewModal } from '../src/context/PreviewModalContext';
import domtoimage from 'dom-to-image-more';
import ReactDOM from 'react-dom';

// Example template data (add more as needed)
// REMOVE OLD TEMPLATES
// const CAROUSEL_TEMPLATES = [ ... ];

// NEW: Define Color Palettes
const PREDEFINED_COLOR_PALETTES = {
  'palette1': { name: 'Rose Taupe', primary: '#DE3163', secondary: '#FFBF00', background: '#F8F0E3', text: '#202020' },
  'palette2': { name: 'Steel Blue', primary: '#4682B4', secondary: '#AED6F1', background: '#EBF5FB', text: '#1A5276' },
  'palette3': { name: 'Forest Green', primary: '#2ECC71', secondary: '#ABEBC6', background: '#EAFAF1', text: '#186A3B' },
  'palette4': { name: 'Royal Purple', primary: '#8A2BE2', secondary: '#D8BFD8', background: '#F3E5F5', text: '#4B0082' },
  'palette5': { name: 'Sunset Orange', primary: '#FF7F50', secondary: '#FFDAB9', background: '#FFF5EE', text: '#A0522D' },
  'palette6': { name: 'Charcoal Green', primary: '#62d76b', secondary: '#B0BEC5', background: '#37474F', text: '#ECEFF1' },
  'palette7': { name: 'Teal Aqua', primary: '#008080', secondary: '#AFEEEE', background: '#E0FFFF', text: '#004D4D' },
  'palette8': { name: 'Crimson Red', primary: '#DC143C', secondary: '#FFB6C1', background: '#FFF0F5', text: '#8B0000' },
  'palette9': { name: 'Goldenrod Yellow', primary: '#DAA520', secondary: '#FFFACD', background: '#FFFFF0', text: '#554200' },
  'palette10': { name: 'Lavender Bliss', primary: '#9370DB', secondary: '#E6E6FA', background: '#FAF0E6', text: '#483D8B' },
  'palette11': { name: 'Mint Fresh', primary: '#3EB489', secondary: '#F5FFFA', background: '#E0FFF0', text: '#2F4F4F' },
  'palette12': { name: 'Warm Sand', primary: '#C19A6B', secondary: '#F5F5DC', background: '#FAF0E6', text: '#8B4513' },
  'palette13': { name: 'Deep Indigo', primary: '#4B0082', secondary: '#7B68EE', background: '#E6E6FA', text: '#FFFFFF' },
  'palette14': { name: 'Coral Pink', primary: '#FF7F50', secondary: '#FFEFD5', background: '#FFF8DC', text: '#8B4513' },
  'palette15': { name: 'Sky Blue', primary: '#87CEEB', secondary: '#F0F8FF', background: '#E6F7FF', text: '#003366' },
  'palette16': { name: 'Olive Drab', primary: '#6B8E23', secondary: '#FFFFE0', background: '#F5F5DC', text: '#556B2F' },
  'palette17': { name: 'Maroon Velvet', primary: '#800000', secondary: '#FFE4E1', background: '#FFF0F5', text: '#FFFFFF' },
  'palette18': { name: 'Slate Gray', primary: '#708090', secondary: '#D3D3D3', background: '#F5F5F5', text: '#2F4F4F' },
  'palette19': { name: 'Electric Lime', primary: '#AEFF00', secondary: '#F0FFF0', background: '#FFFFF0', text: '#385400' },
  'palette20': { name: 'Hot Pink', primary: '#FF69B4', secondary: '#FFB6C1', background: '#FFF0F5', text: '#8B0A50' },
  'palette21': { name: 'Ocean Deep', primary: '#191970', secondary: '#B0C4DE', background: '#F0F8FF', text: '#FFFFFF' },
  'palette22': { name: 'Terracotta', primary: '#E2725B', secondary: '#FFE4C4', background: '#FAF0E6', text: '#8B4513' },
  'palette23': { name: 'Emerald City', primary: '#2E8B57', secondary: '#98FB98', background: '#F0FFF0', text: '#FFFFFF' },
  // Adding ~15 more
  'palette24': { name: 'Cool Stone', primary: '#A9A9A9', secondary: '#E0E0E0', background: '#F8F8F8', text: '#404040' },
  'palette25': { name: 'Mustard Field', primary: '#FFDB58', secondary: '#FFF8DC', background: '#FFFFF0', text: '#8B4513' },
  'palette26': { name: 'Dusty Rose', primary: '#D8BFD8', secondary: '#FFE4E1', background: '#FAF0E6', text: '#8B4513' },
  'palette27': { name: 'Midnight Blue', primary: '#2C3E50', secondary: '#BDC3C7', background: '#ECF0F1', text: '#FFFFFF' },
  'palette28': { name: 'Sage Green', primary: '#8FBC8F', secondary: '#F0FFF0', background: '#F5F5F5', text: '#2F4F2F' },
  'palette29': { name: 'Burnt Sienna', primary: '#E97451', secondary: '#FFE4C4', background: '#FFF5EE', text: '#8B4513' },
  'palette30': { name: 'Periwinkle', primary: '#CCCCFF', secondary: '#E6E6FA', background: '#F0F8FF', text: '#483D8B' },
  'palette31': { name: 'Forest Floor', primary: '#556B2F', secondary: '#F5F5DC', background: '#FAF0E6', text: '#FFFFFF' },
  'palette32': { name: 'Lilac Haze', primary: '#C8A2C8', secondary: '#E6E6FA', background: '#FFF0F5', text: '#483D8B' },
  'palette33': { name: 'Robin Egg Blue', primary: '#00CCCC', secondary: '#E0FFFF', background: '#F0FFFF', text: '#004D4D' },
  'palette34': { name: 'Clay Brown', primary: '#B87333', secondary: '#FFEBCD', background: '#FAF0E6', text: '#FFFFFF' },
  'palette35': { name: 'Seafoam Green', primary: '#98FB98', secondary: '#F0FFF0', background: '#F5FFFA', text: '#2E8B57' },
  'palette36': { name: 'Plum Perfect', primary: '#8E4585', secondary: '#DDA0DD', background: '#F3E5F5', text: '#FFFFFF' },
  'palette37': { name: 'Desert Sun', primary: '#FFCC33', secondary: '#FFF8DC', background: '#FFFACD', text: '#8B4513' },
  'palette38': { name: 'Arctic White', primary: '#778899', secondary: '#E6E6FA', background: '#F8F8FF', text: '#2F4F4F' },
};

// NEW: Define Background Designs
const BACKGROUND_DESIGNS = [
  { label: 'None', value: 'none' },
  { label: 'Blop', value: 'blop' },
  { label: 'Circles', value: 'circles' },
  { label: 'Line', value: 'line' },
  { label: 'Top Dots', value: 'top dots' },
];

const CONTENT_THEMES = [
  'Home Buying Tips', 'Home Selling Tips', 'Investment Insights', 'Home Maintenance Tips', 'Mortgage & Financing Advice', 'Real Estate Terminology', 'Staging & Design', 'Legal Aspects', 'Renovation Ideas', 'Sustainability & Green Homes', /*'Local Market Statistics',*/ 'Local Business Spotlights', 'Local Lifestyle & Activities', 'Neighborhood Comparisons'
];
const LOCAL_FOCUS = [
  'Best Neighborhoods', 'Top-Rated Schools', 'Hidden Gems', 'Parks & Outdoor Spaces', 'Community Events', 'Historic Landmarks', 'Public Transport', 'Family-Friendly Spots', 'Local Businesses', 'Unique Architecture'
];
const AUDIENCE_APPEAL = [
  'First-time Buyers', 'Homeowners', 'Sellers', 'Renters', 'Investors', 'Downsizers', 'Upsizers', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'
];
const TONE_STYLE = [
  'Friendly & Approachable', 'Professional & Authoritative', 'Fun & Playful', 'Inspirational & Motivational', 'Educational & Informative', 'Storytelling/Personal', 'Visual/Infographic', 'Conversational/Q&A'
];

const LOCAL_FOCUS_THEMES = [
  'Local Market Statistics',
  'Neighborhood Comparisons',
  'Local Business Spotlights',
  'Local Lifestyle & Activities',
  'Best Neighborhoods',
  'Top-Rated Schools',
  'Hidden Gems',
  'Parks & Outdoor Spaces',
  'Community Events',
  'Historic Landmarks',
  'Public Transport',
  'Family-Friendly Spots',
  'Unique Architecture',
];

// Mapping of Content Theme to relevant Audience Appeal options
const AUDIENCE_APPEAL_MAP = {
  'Home Buying Tips': ['First-time Buyers', 'Homeowners', 'Investors', 'Renters', 'Upsizers', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'],
  'Home Selling Tips': ['Sellers', 'Homeowners', 'Investors', 'Downsizers', 'Upsizers', 'Families', 'Retirees', 'General Public'],
  'Investment Insights': ['Investors', 'Homeowners', 'Sellers', 'General Public'],
  'Home Maintenance Tips': ['Homeowners', 'Sellers', 'Renters', 'Families', 'Retirees', 'General Public'],
  'Mortgage & Financing Advice': ['First-time Buyers', 'Homeowners', 'Investors', 'Sellers', 'Renters', 'General Public'],
  'Real Estate Terminology': ['First-time Buyers', 'Homeowners', 'Sellers', 'Investors', 'Renters', 'General Public'],
  'Staging & Design': ['Sellers', 'Homeowners', 'Investors', 'General Public'],
  'Legal Aspects': ['Homeowners', 'Sellers', 'Investors', 'Renters', 'General Public'],
  'Renovation Ideas': ['Homeowners', 'Sellers', 'Investors', 'Families', 'General Public'],
  'Sustainability & Green Homes': ['Homeowners', 'Investors', 'Renters', 'Families', 'General Public'],
  'Local Market Statistics': ['Homeowners', 'Sellers', 'Investors', 'General Public'],
  'Local Business Spotlights': ['Homeowners', 'Sellers', 'Investors', 'General Public'],
  'Local Lifestyle & Activities': ['Homeowners', 'Sellers', 'Investors', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'],
  'Neighborhood Comparisons': ['First-time Buyers', 'Homeowners', 'Sellers', 'Investors', 'Renters', 'Families', 'General Public'],
};

// Exact font pairings from user screenshot
const FONT_PAIRINGS = [
  { label: 'DM Serif Display + DM Sans', heading: 'DM Serif Display', paragraph: 'DM Sans' },
  { label: 'Ultra + PT Serif', heading: 'Ultra', paragraph: 'PT Serif' },
  { label: 'Oswald + Source Sans 3', heading: 'Oswald', paragraph: 'Source Sans 3' },
  { label: 'Big Shoulders Display + Inter', heading: 'Big Shoulders Display', paragraph: 'Inter' },
  { label: 'Stint Ultra Expanded + Pontano Sans', heading: 'Stint Ultra Expanded', paragraph: 'Pontano Sans' },
  { label: 'Fjalla One + Cantarell', heading: 'Fjalla One', paragraph: 'Cantarell' },
  { label: 'Syne + Inter', heading: 'Syne', paragraph: 'Inter' },
  { label: 'Yellowtail + Lato', heading: 'Yellowtail', paragraph: 'Lato' },
  { label: 'Rubik + Roboto Mono', heading: 'Rubik', paragraph: 'Roboto Mono' },
  { label: 'League Spartan + Work Sans', heading: 'League Spartan', paragraph: 'Work Sans' },
  { label: 'Anton + Roboto', heading: 'Anton', paragraph: 'Roboto' },
  { label: 'Teko + Ubuntu', heading: 'Teko', paragraph: 'Ubuntu' },
  { label: 'Philosopher + Mulish', heading: 'Philosopher', paragraph: 'Mulish' },
  { label: 'Alfa Slab One + Gentium Plus', heading: 'Alfa Slab One', paragraph: 'Gentium Plus' },
  { label: 'Archivo Black + Archivo', heading: 'Archivo Black', paragraph: 'Archivo' },
  { label: 'Della Respira + Open Sans', heading: 'Della Respira', paragraph: 'Open Sans' },
  { label: 'Rozha One + Questrial', heading: 'Rozha One', paragraph: 'Questrial' },
  { label: 'Bangers + Oswald', heading: 'Bangers', paragraph: 'Oswald' },
  { label: 'Bebas + Lato', heading: 'Bebas Neue', paragraph: 'Lato' },
  { label: 'League Gothic + Poppins', heading: 'League Gothic', paragraph: 'Poppins' },
  { label: 'Poppins + Inter', heading: 'Poppins', paragraph: 'Inter' },
  { label: 'Space Mono + Rubik', heading: 'Space Mono', paragraph: 'Rubik' },
  { label: 'Lora + Ubuntu', heading: 'Lora', paragraph: 'Ubuntu' },
  { label: 'Montserrat + Work Sans', heading: 'Montserrat', paragraph: 'Work Sans' },
  { label: 'Playfair Display + Chivo', heading: 'Playfair Display', paragraph: 'Chivo' },
  { label: 'Bricolage Grotesque + Lato', heading: 'Bricolage Grotesque', paragraph: 'Lato' },
];

// Set the default font pairing to 'Bricolage Grotesque + Lato'
const DEFAULT_FONT_PAIRING = FONT_PAIRINGS.find(f => f.label === 'Bricolage Grotesque + Lato') || FONT_PAIRINGS[0];

// Set the default background design to 'Top Dots'
const DEFAULT_BACKGROUND_DESIGN = 'top dots';

// Replace the entire SearchableDropdown component with this simpler version
const ModernSelect = React.memo(({ 
  label, 
  value, 
  onChange, 
  options, 
  valueKey, 
  labelKey, 
  placeholder = "Select an option...",
  disabled = false
}) => {
  return (
    <div>
      <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 13,
          background: disabled ? '#f5f5f5' : '#f9fafb',
          color: '#333',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px top 50%',
          backgroundSize: '10px auto',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option, index) => {
          const optionLabel = labelKey ? option[labelKey] : option;
          const optionValue = valueKey ? option[valueKey] : option;
          return (
            <option key={index} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
});

// Predictive City Input Component
const PredictiveCityInput = React.memo(({ label, value, onChange, allCities }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (inputValue.length < 2) {
      setFilteredCities([]);
      return;
    }
    const matches = allCities
      .filter(cityObj => cityObj.name.toLowerCase().startsWith(inputValue.toLowerCase()))
      .slice(0, 10);
    setFilteredCities(matches);
  }, [inputValue, allCities]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
    onChange(e.target.value);
  };

  const handleSuggestionClick = (cityName) => {
    setInputValue(cityName);
    setShowSuggestions(false);
    onChange(cityName);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100); // Delay to allow click
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        placeholder="Enter your city..."
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 13,
          background: '#f9fafb',
          color: '#333',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        autoComplete="off"
      />
      {showSuggestions && filteredCities.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0,
          width: '100%',
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 10,
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
        }}>
          {filteredCities.map((cityObj, idx) => (
            <div
              key={cityObj.name + idx}
              onMouseDown={() => handleSuggestionClick(cityObj.name)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: inputValue === cityObj.name ? '#f3f4f6' : 'transparent',
                color: '#333',
                fontSize: 13,
                borderBottom: idx !== filteredCities.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}
            >
              {cityObj.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Helper to ensure heading ends with a period
function withPeriod(text) {
  if (!text) return '';
  const trimmed = text.trim();
  // If ends with ., !, ?, …, or ... do not add a period
  if (/[.!?…]$/.test(trimmed) || trimmed.endsWith('...')) return trimmed;
  return trimmed + '.';
}

// Modern Chevron Icon for collapsible sections
const ChevronIcon = ({ rotated = false, size = 18, color = "#222" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    style={{
      display: 'inline-block',
      transition: 'transform 0.2s',
      transform: rotated ? 'rotate(90deg)' : 'rotate(0deg)',
      verticalAlign: 'middle'
    }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      points="6 8 10 12 14 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// --- ExportSlide: Hidden export version for PNG generation ---
function ExportSlide({ slide, index, userName, userEmail, userHeadshot, activeColorPalette, selectedBackground, selectedFontPairing, slidesLength }) {
  // Inline SVG backgrounds for export
  const SVGBackground = () => {
    if (!selectedBackground) return null;
    const style = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 };
    if (selectedBackground.value === 'blop') return <BlopSVG fill={activeColorPalette.primary} style={style} />;
    if (selectedBackground.value === 'circles') return <CirclesSVG fill={activeColorPalette.primary} style={style} />;
    if (selectedBackground.value === 'line') return <LineSVG fill={activeColorPalette.primary} style={style} />;
    if (selectedBackground.value === 'top dots') return <TopDotsSVG fill={activeColorPalette.primary} style={style} />;
    return null;
  };
  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background: activeColorPalette.background,
        color: activeColorPalette.text,
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        boxSizing: 'border-box',
        fontFamily: selectedFontPairing.heading + ', sans-serif',
      }}
      className="export-slide-root"
    >
      <SVGBackground />
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: index === 0 ? 'flex-start' : 'center',
        justifyContent: 'center',
        flexGrow: 1,
        textAlign: index === 0 ? 'left' : (slide?.textAlign || 'center'),
        zIndex: 1,
      }}>
        <span
          style={{
            fontSize: index === 0 ? (slide.heading.length > 38 ? 80 : 110) : 80,
            fontWeight: 'bold',
            color: activeColorPalette.primary,
            fontFamily: selectedFontPairing.heading + ', sans-serif',
            lineHeight: 1.1,
            marginBottom: 40,
            display: 'block',
            wordBreak: 'break-word',
          }}
        >
          {withPeriod(slide.heading)}
        </span>
        {index !== 0 && (
          <span
            style={{
              fontSize: 38,
              fontWeight: 'normal',
              color: activeColorPalette.text,
              fontFamily: selectedFontPairing.paragraph + ', sans-serif',
              lineHeight: 1.3,
              marginTop: 10,
              display: 'block',
              wordBreak: 'break-word',
            }}
          >
            {slide.paragraph}
          </span>
        )}
      </div>
      {/* Profile and badge */}
      {(index === 0 || index === slidesLength - 1) && userName && (
        <div style={{ position: 'absolute', bottom: 60, left: 60, display: 'flex', alignItems: 'center', gap: 24, zIndex: 2 }}>
          {userHeadshot && (
            <img src={userHeadshot} alt={userName} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${activeColorPalette.primary}` }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: activeColorPalette.text }}>{userName}</div>
            {userEmail && (
              <div style={{ fontSize: 24, color: activeColorPalette.text, opacity: 0.8 }}>{userEmail}</div>
            )}
          </div>
        </div>
      )}
      {/* Swipe badge */}
      {index === 0 && (
        <div style={{ position: 'absolute', bottom: 120, right: 60, background: activeColorPalette.primary, color: '#fff', borderRadius: 40, padding: '18px 48px', fontWeight: 700, fontSize: 38, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 3 }}>
          Swipe <span style={{ fontSize: 44 }}>→</span>
        </div>
      )}
      {/* Slide count */}
      <span style={{ position: 'absolute', bottom: 60, right: 60, color: activeColorPalette.text, fontSize: 28, fontWeight: 600, opacity: 0.7, background: 'rgba(0,0,0,0.08)', padding: '6px 18px', borderRadius: '8px', zIndex: 2 }}>{index + 1} / {slidesLength}</span>
    </div>
  );
}

export default function CarouselGeneratorPage() {
  // --- OPTIONS STATE ---
  const [city, setCity] = useState('');
  const [contentTheme, setContentTheme] = useState('Home Buying Tips');
  const [localFocus, setLocalFocus] = useState('Best Neighborhoods');
  const [audienceAppeal, setAudienceAppeal] = useState('First-time Buyers');
  const [toneStyle, setToneStyle] = useState('Friendly & Approachable');
  
  // --- EDITOR STATE ---
  const [activeEditorTab, setActiveEditorTab] = useState('Content'); // 'Content', 'Settings', 'Theme'
  const [mainTitle, setMainTitle] = useState('Buying Property in London'); // Global Title
  const [mainSubtitle, setMainSubtitle] = useState('Your Ultimate Guide to Real Estate in the UK Capital'); // Global Subtitle
  const [currentSlide, setCurrentSlide] = useState(0); // 0-7 (or more if needed)
  const [slides, setSlides] = useState([
    {
      heading: 'Buying Property in London',
      paragraph: 'Your Ultimate Guide to Real Estate in the UK Capital',
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
    },
    ...Array(6).fill(null).map((_, i) => ({
      heading: `Key Tip #${i + 1}`,
      paragraph: `Insightful advice or information for slide ${i + 2}.`,
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
    })),
    {
      heading: 'Ready to Take the Next Step?',
      paragraph: 'Contact me today to start your property journey!',
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
    }
  ]);

  // --- SETTINGS STATE ---
  const [userHeadshot, setUserHeadshot] = useState(''); // URL
  const [userName, setUserName] = useState('Your Name');
  const [userEmail, setUserEmail] = useState('');

  // Fetch agent profile on mount
  useEffect(() => {
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
    if (!sessionToken) return;
    fetch('/api/agent/profile', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setUserName(data.profile.agentName || 'Your Name');
          setUserHeadshot(data.profile.agentPhotoUrl || '');
          setUserEmail(data.profile.agentEmail || '');
        }
      })
      .catch(() => {});
  }, []);

  // --- THEME STATE ---
  const [backgroundDesign, setBackgroundDesign] = useState(DEFAULT_BACKGROUND_DESIGN); // Default to 'Top Dots'
  const [selectedColorPaletteKey, setSelectedColorPaletteKey] = useState(Object.keys(PREDEFINED_COLOR_PALETTES)[0]);
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customColors, setCustomColors] = useState({ primary: '#62d76b', secondary: '#cccccc', background: '#ffffff', text: '#1a1a1a' }); // Default custom
  
  // --- DERIVED STATE ---
  const allCities = City.getAllCities();
  const activeColorPalette = useCustomColors ? customColors : PREDEFINED_COLOR_PALETTES[selectedColorPaletteKey];

  // REMOVE OLD TEMPLATE FINDER
  // const selectedTemplate = CAROUSEL_TEMPLATES.find(t => t.id === selectedTemplateId);

  // Function to add a new slide
  const addSlide = () => {
    setSlides(prev => [
      ...prev.slice(0, prev.length),
      {
        heading: `New Slide ${prev.length + 1}`,
        paragraph: 'New slide content.',
        textAlign: 'left',
    fontStyle: 'normal',
    textDecoration: 'none',
        textEffect: 'none',
      }
    ]);
    setCurrentSlide(slides.length); // Focus the new slide
  };

  // Refined generation logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [lastGenerationOptions, setLastGenerationOptions] = useState(null);
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    
    // Gather current options
    const currentOptions = {
      city,
      contentTheme,
      localFocus,
      audienceAppeal,
      toneStyle,
      mainTitle,
      mainSubtitle
    };

    // Compare to lastGenerationOptions
    const isRegeneration =
      lastGenerationOptions &&
      Object.keys(currentOptions).every(
        key => currentOptions[key] === lastGenerationOptions[key]
      ) &&
      slides && slides.length > 0;

    const previousSlides = isRegeneration
      ? slides.map(({ heading, paragraph }) => ({ heading, paragraph }))
      : undefined;

    // Use the selected city if available, otherwise use country
    const locationName = city || 'London';
    
    // Create a title based on selected content theme and location
    const generatedTitle = `${contentTheme} in ${locationName}`;
    
    // Create default slides that incorporate the selected location
    let defaultSlides = [];
    
    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
      const res = await fetch('/api/generate-carousel-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({
          contentTheme,
          localFocus,
          audienceAppeal,
          toneStyle,
          mainTitle: generatedTitle, // Send the location-specific title
          mainSubtitle,
          country: 'UK',
          city: city,
          location: locationName,
          useLocationInContent: true,
          isRegeneration,
          previousSlides
        })
      });
      
      const data = await res.json();
      if (!data.success || !Array.isArray(data.slides)) {
        throw new Error(data.message || 'Failed to generate slides');
      }
      
      // Add default styles to each slide
      const styledSlides = data.slides.map((slide, i) => ({
        ...slide,
        textAlign: 'center',
        fontStyle: 'normal',
        textDecoration: 'none',
        textEffect: 'none',
      }));
      
      // Use all generated slides including the intro slide
      setSlides(styledSlides);
      
      // Update mainTitle and mainSubtitle to match the first slide (intro slide)
      setMainTitle(styledSlides[0]?.heading || generatedTitle);
      setMainSubtitle(styledSlides[0]?.paragraph || mainSubtitle);
      
      setCurrentSlide(0); // Show the intro slide first so user can see it's been updated

      // After successful generation, update lastGenerationOptions
      setLastGenerationOptions(currentOptions);
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate slides');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSlideTextChange = (field, value) => {
    setSlides(prev => prev.map((slide, idx) => 
      idx === currentSlide ? { ...slide, [field]: value } : slide
    ));
  };

  // Keep style change handler if managing styles per slide
  const handleSlideStyleChange = (property, value) => {
    setSlides(prev => prev.map((slide, idx) => 
      idx === currentSlide ? { ...slide, [property]: value } : slide
    ));
  };
  
  // Navigation handlers
  const goToPrevSlide = () => setCurrentSlide(s => (s > 0 ? s - 1 : slides.length - 1));
  const goToNextSlide = () => setCurrentSlide(s => (s < slides.length - 1 ? s + 1 : 0));
  
  // Ensure Title/Subtitle updates affect slide 0 immediately
  const handleMainTitleChange = (value) => {
      setMainTitle(value);
      setSlides(prev => prev.map((slide, idx) => idx === 0 ? { ...slide, heading: value } : slide));
  };
  const handleMainSubtitleChange = (value) => {
      setMainSubtitle(value);
      setSlides(prev => prev.map((slide, idx) => idx === 0 ? { ...slide, paragraph: value } : slide));
  };

  // Helper function to handle custom color changes
  const handleCustomColorChange = (colorName, value) => {
      setCustomColors(prev => ({ ...prev, [colorName]: value }));
      // Ensure we are using custom colors when one is changed
      if (!useCustomColors) {
          setUseCustomColors(true);
      }
  };

  // Helper to apply styles - potentially update with theme colors
  const getTextStyle = (slide) => {
    if (!slide) return {};
    return {
      textAlign: slide.textAlign,
      fontStyle: slide.fontStyle,
      textDecoration: slide.textDecoration,
      textShadow: slide.textEffect === 'shadow' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
      wordBreak: 'break-word', // Keep wordBreak
      color: activeColorPalette.text // Use theme text color
    };
  };
  
  // Helper for slide background - SIMPLIFIED
  const getSlideBackgroundStyle = (slideIndex) => {
      // Use the active palette's background and text color
      return {
          backgroundColor: activeColorPalette.background,
          color: activeColorPalette.text, // Ensure text contrast
          // Remove placeholder backgroundImage for now
          // backgroundImage: `url('/placeholder-design-${backgroundDesign.toLowerCase()}.svg')`, 
          // backgroundSize: 'cover',
          // backgroundPosition: 'center',
    };
  };

  const selectedBackground = BACKGROUND_DESIGNS.find(d => d.value === backgroundDesign);

  // --- FONT PAIRING STATE ---
  const [selectedFontPairing, setSelectedFontPairing] = useState(DEFAULT_FONT_PAIRING);
  const [showTypography, setShowTypography] = useState(false);
  const [fontSizePreset, setFontSizePreset] = useState('small'); // 'small' or 'large'
  const [lineHeightPreset, setLineHeightPreset] = useState('compact'); // 'compact' or 'relaxed'
  const LINE_HEIGHTS = { compact: 1.1, relaxed: 1.3 };

  // Dynamically inject Google Fonts link for selected pairing
  useEffect(() => {
    const fonts = [selectedFontPairing.heading, selectedFontPairing.paragraph]
      .map(f => f.replace(/ /g, '+'))
      .join('&family=');
    const linkId = 'carousel-google-fonts';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`;
    return () => {};
  }, [selectedFontPairing]);

  const relevantAudienceAppeal = AUDIENCE_APPEAL_MAP[contentTheme] || AUDIENCE_APPEAL;

  // Add state for theme section collapse
  const [showTheme, setShowTheme] = useState(false);

  // --- Add the usePreviewModal hook ---
  const { openPreviewModal } = usePreviewModal();
  
  // --- Add state for preview generation ---
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
  // --- Add refs for slide elements ---
  const slideRefs = useRef([]);

  // --- Add function to generate PNG images from slides ---
  const handlePreviewCarousel = async () => {
    if (slides.length === 0) {
      setPreviewError('No slides to preview.');
      return;
    }

    setIsGeneratingPreview(true);
    setPreviewError(null);

    try {
      // Wait for Google Fonts to load
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Get all .main-preview elements
      const slideElements = slideRefs.current.filter(Boolean).map(el => el.querySelector('.main-preview'));
      if (slideElements.length === 0) {
        throw new Error('No slide elements found.');
      }

      // Add .exporting class to hide UI-only elements
      slideElements.forEach(el => el && el.classList.add('exporting'));

      // Export each slide as PNG
      const slidePromises = slideElements.map(async (el, index) => {
        try {
          const dataUrl = await domtoimage.toPng(el, {
            quality: 1.0,
            bgcolor: activeColorPalette.background,
            width: 1080,
            height: 1350,
            cacheBust: true
          });
          return {
            id: index,
            imageUrl: dataUrl,
            heading: slides[index].heading,
            caption: slides[index].paragraph,
            isStoryFormat: false
          };
        } catch (error) {
          console.error(`Error generating PNG for slide ${index}:`, error);
          return {
            id: index,
            imageUrl: `https://via.placeholder.com/1080x1350.png?text=Slide+${index+1}+(Error)`,
            heading: slides[index].heading,
            caption: slides[index].paragraph,
            isStoryFormat: false
          };
        }
      });

      const slideImages = await Promise.all(slidePromises);

      // Remove .exporting class after export
      slideElements.forEach(el => el && el.classList.remove('exporting'));

      const carouselData = {
        slides: slideImages,
        globalCaption: `${mainTitle} - ${mainSubtitle}`
      };
      openPreviewModal(carouselData);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewError(error.message || 'Failed to generate preview.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Ensure slideRefs array is updated when slides change
  useEffect(() => {
    // Reset the refs array when slides change
    slideRefs.current = slideRefs.current.slice(0, slides.length);
    
    // Ensure the array has the correct length
    while (slideRefs.current.length < slides.length) {
      slideRefs.current.push(null);
    }
  }, [slides.length]);

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%)' }}>
        <Head>
          <title>Carousel Generator - Trofai</title>
        </Head>
        <MobileMenu activePage="carousel-generator" />
        <Sidebar activePage="carousel-generator" />
        <div className="dashboard-container" style={{ marginLeft: 240, padding: '0.5rem 0', minHeight: '100vh' }}>
          {/* Keep Dashboard Header? */}
          {/* <DashboardHeader /> */}
          <DashboardHeader />
          
          {/* Main Content Area */}
          {/* Reduce main padding */}
          <main className="main" style={{ padding: '2rem 1rem' /* Increased top padding */ }}>
            {/* NEW Three-Column Layout */}
            {/* Reduce gap between columns */}
            <div className="carousel-generator-layout" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
              
              {/* === Left Panel: Options === */}
              {/* Adjust width and padding slightly */}
              <div className="carousel-options-panel" style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 10, boxShadow: '0 1px 5px rgba(0,0,0,0.05)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}> 
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>Generation Options</h2>
                {/* City predictive input at the top */}
                <PredictiveCityInput
                  label="City"
                    value={city}
                  onChange={setCity}
                  allCities={allCities}
                />
                {/* Content Theme dropdown */}
                <div>
                  <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Content Theme</label>
                  <select value={contentTheme} onChange={e => setContentTheme(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}>
                    {CONTENT_THEMES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {/* Conditionally show Local Focus */}
                {LOCAL_FOCUS_THEMES.includes(contentTheme) && (
                <div>
                    <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Local Focus</label>
                    <select value={localFocus} onChange={e => setLocalFocus(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}>
                    {LOCAL_FOCUS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                )}
                <div>
                   <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Audience Appeal</label>
                   <select value={audienceAppeal} onChange={e => setAudienceAppeal(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}>
                    {relevantAudienceAppeal.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                   <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Tone/Style</label>
                   <select value={toneStyle} onChange={e => setToneStyle(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}>
                    {TONE_STYLE.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                {/* Typography Section: Font Pairing Dropdown */}
                <div style={{ marginTop: 18, marginBottom: showTypography ? 8 : 2 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setShowTypography(v => !v)}
                  >
                    <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Typography</span>
                    <ChevronIcon rotated={showTypography} />
              </div>
                  {showTypography && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                      {/* Font Pairing Dropdown */}
                      <div>
                        <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Font Pairing</label>
                        <select
                          value={selectedFontPairing.label}
                          onChange={e => {
                            const pairing = FONT_PAIRINGS.find(p => p.label === e.target.value);
                            if (pairing) setSelectedFontPairing(pairing);
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}
                        >
                          {FONT_PAIRINGS.map(pairing => (
                            <option key={pairing.label} value={pairing.label}>{pairing.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* In the left panel, after Typography section, add Theme section */}
                <div style={{ marginTop: showTypography ? 8 : 2, marginBottom: showTheme ? 8 : 2 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setShowTheme(v => !v)}
                  >
                    <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>Theme</span>
                    <ChevronIcon rotated={showTheme} />
                  </div>
                  {showTheme && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                      <div>
                        <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>Background Design Elements</label>
                        <select value={backgroundDesign} onChange={e => setBackgroundDesign(e.target.value)} style={{ width: '100%', padding: '6px 8px', borderRadius: 5, border: '1px solid #d1d5db', fontSize: 13, background: '#f9fafb' }}>
                          {BACKGROUND_DESIGNS.map(design => <option key={design.value} value={design.value}>{design.label}</option>)}
                        </select>
                        <p style={{fontSize: 11, color: '#6b7280', margin: '4px 0 0 0'}}>Note: Design elements are visual placeholders for now.</p>
                      </div>
                      <div>
                        <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 6 }}>Color Palette</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '1rem' }}>
                          {Object.entries(PREDEFINED_COLOR_PALETTES).map(([key, palette]) => (
                            <div key={key} onClick={() => { setSelectedColorPaletteKey(key); setUseCustomColors(false); }}
                              title={palette.name}
                              style={{
                                height: 25,
                                borderRadius: 5,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: `linear-gradient(to right, ${palette.primary} 33%, ${palette.secondary} 33%, ${palette.secondary} 66%, ${palette.background} 66%)`,
                                border: !useCustomColors && selectedColorPaletteKey === key ? `2px solid ${palette.primary}` : '2px solid transparent',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                position: 'relative'
                              }}
                            >
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
                          <input type="checkbox" id="useCustomColorCheck" checked={useCustomColors} onChange={(e) => setUseCustomColors(e.target.checked)} style={{ height: 14, width: 14 }}/>
                          <label htmlFor="useCustomColorCheck" style={{ fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Use Custom Colors</label>
                          </div>
                        {useCustomColors && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {Object.keys(customColors).map(colorName => (
                              <div key={colorName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ fontWeight: 500, fontSize: 12, textTransform: 'capitalize' }}>{colorName}</label>
                                <input 
                                  type="color" 
                                  value={customColors[colorName]} 
                                  onChange={(e) => handleCustomColorChange(colorName, e.target.value)}
                                  style={{ width: '100%', height: '35px', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px', cursor: 'pointer' }}
                                />
                              </div>
                            ))}
                              </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Error and Loading Feedback for Generation */}
                {generateError && (
                  <div style={{ color: 'red', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{generateError}</div>
                )}
                {isGenerating && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <span className="spinner" style={{ width: 18, height: 18, border: '2px solid #ccc', borderTop: `2px solid #62d76b`, borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 8 }} />
                    <span style={{ fontSize: 13, color: '#666' }}>Generating slides...</span>
                  </div>
                )}
                <Button onClick={handleGenerate} style={{ width: '100%', marginTop: 6, fontSize: 14, padding: '8px 0', borderRadius: 6 }} disabled={isGenerating}> 
                  {isGenerating ? 'Generating...' : 'Generate Content Ideas'}
                </Button>
                
                {/* Add Preview button */}
                {previewError && (
                  <div style={{ color: 'red', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{previewError}</div>
                )}
                {isGeneratingPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                    <span className="spinner" style={{ width: 18, height: 18, border: '2px solid #ccc', borderTop: `2px solid #62d76b`, borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 8 }} />
                    <span style={{ fontSize: 13, color: '#666' }}>Preparing preview...</span>
                    </div>
                )}
                <Button 
                  onClick={handlePreviewCarousel} 
                  style={{ 
                    width: '100%', 
                    marginTop: 10, 
                    fontSize: 14, 
                    padding: '8px 0', 
                    borderRadius: 6,
                    background: '#e2e8f0',
                    color: 'black',
                    border: '2px solid black',
                    boxShadow: '2px 2px 0 rgba(0, 0, 0, 0.8)'
                  }} 
                  disabled={isGeneratingPreview || slides.length === 0}
                >
                  {isGeneratingPreview ? 'Preparing...' : 'Preview Carousel'}
                </Button>
                    </div>

              {/* === Center Panel: Focused Slide Preview === */}
              {/* Reduce gap */}
              <div className="focused-slide-preview-container" style={{
                display: 'flex',
                flexDirection: 'row', // Arrange slides in a row
                alignItems: 'center', // Vertically center slides if they have different heights (they shouldn't)
                overflowX: 'auto',   // Enable horizontal scrolling
                gap: '1rem',         // Space between slides
                padding: '0 1rem 2rem 1rem', // Adjusted top padding from 2rem to 0
                width: '100%',       // Take available width
                justifyContent: 'flex-start' // Align slides to the start
              }}>
                {slides.map((slide, index) => (
                  // Each slide gets its own preview-frame and main-preview structure
                  <div
                    key={index}
                    ref={el => slideRefs.current[index] = el}
                    className="preview-frame"
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '20px',
                      borderRadius: 16,
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                      flexShrink: 0, // Prevent slides from shrinking
                    }}
                  >
                    <div className="main-preview" style={{
                        width: 450,
                        aspectRatio: '4 / 5',
                        maxWidth: 450,
                        minWidth: 450,
                        height: 562.5, // 450 * (5/4) = 562.5, maintaining 4:5 aspect ratio
                        borderRadius: 6,
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '25px',
                        ...getSlideBackgroundStyle(index), // Use index for background
                    }}>
                      {/* Conditional SVG backgrounds - ensure they use 'index' not 'currentSlide' */}
                      {selectedBackground && selectedBackground.value === 'blop' && (
                          <BlopSVG fill={activeColorPalette.primary} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />
                      )}
                      {selectedBackground && selectedBackground.value === 'circles' && (
                          <CirclesSVG fill={activeColorPalette.primary} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />
                      )}
                      {selectedBackground && selectedBackground.value === 'line' && (
                          <LineSVG fill={activeColorPalette.primary} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />
                      )}
                      {selectedBackground && selectedBackground.value === 'top dots' && (
                          <TopDotsSVG fill={activeColorPalette.primary} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />
                      )}
                      <div style={{
                        ...getTextStyle(slide), // Use 'slide' object directly
                        width: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: index === 0 ? 'flex-start' : 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        textAlign: index === 0 ? 'left' : (slide?.textAlign || 'center')
                      }}>
                        <InlineTextEditor
                          value={withPeriod(slide.heading)} // Use 'slide.heading'
                          // Important: onChange needs to correctly identify the slide being edited
                          onChange={val => {
                            const newSlides = [...slides];
                            newSlides[index].heading = val.replace(/\.$/, '');
                            setSlides(newSlides);
                            if(index === 0) setMainTitle(val.replace(/\.$/, ''));
                          }}
                          placeholder={index === 0 ? 'Add a catchy title...' : 'Slide Heading'}
                          align="left"
                          fontSize={
                            index === 0
                              ? slide.heading.length > 38 ? 32 : 44
                              : 32
                          }
                          fontWeight="bold"
                          color={activeColorPalette.primary}
                          singleLine={true}
                          fontFamily={selectedFontPairing.heading}
                          lineHeight={1.1}
                        />
                        {index !== 0 && (
                          <InlineTextEditor
                            value={slide.paragraph} // Use 'slide.paragraph'
                            onChange={val => {
                              const newSlides = [...slides];
                              newSlides[index].paragraph = val;
                              setSlides(newSlides);
                              if(index === 0) setMainSubtitle(val);
                            }}
                            placeholder="Add supporting text..."
                            align="left"
                            fontSize={16} // Consistent paragraph font size
                            fontWeight="normal"
                            color={activeColorPalette.text}
                            singleLine={false}
                            fontFamily={selectedFontPairing.paragraph}
                            lineHeight={1.3}
                          />
                        )}
                      </div>
                      <span style={{ position: 'absolute', bottom: 8, right: 12, color: activeColorPalette.text, fontSize: 12, fontWeight: 500, opacity: 0.7, background: 'rgba(0,0,0,0.1)', padding: '1px 5px', borderRadius: '3px' }}>{index + 1} / {slides.length}</span>
                      {index === 0 && (
                        <div style={{ position: 'absolute', bottom: 48, right: 25, background: activeColorPalette.primary, color: '#fff', borderRadius: 20, padding: '4px 12px', fontWeight: 600, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 2, zIndex: 3 }}>
                          Swipe <span style={{ fontSize: 15 }}>→</span>
                        </div>
                      )}
                      {(index === 0 || index === slides.length - 1) && userName && (
                        <div style={{ position: 'absolute', bottom: 25, left: 25, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                          {userHeadshot && (
                            <img src={userHeadshot} alt={userName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${activeColorPalette.primary}` }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: activeColorPalette.text }}>{userName}</div>
                            {userEmail && (
                              <div style={{ fontSize: 12, color: activeColorPalette.text, opacity: 0.8 }}>{userEmail}</div>
                            )}
                          </div>
                      </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Add slide button as the last slide */}
                <div
                  className="preview-frame"
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: 16,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 450,
                    height: 562.5, // 450 * (5/4) = 562.5, maintaining 4:5 aspect ratio
                    minWidth: 450,
                    maxWidth: 450,
                    aspectRatio: '4 / 5',
                    position: 'relative',
                    border: '2px dashed #e5e7eb',
                    color: '#62d76b',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => addSlide()}
                  title="Add new slide"
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    fontSize: 60,
                    fontWeight: 400,
                    color: '#62d76b',
                    opacity: 0.7,
                    userSelect: 'none',
                  }}>
                    <span style={{ fontSize: 80, lineHeight: 1, marginBottom: 8 }}>+</span>
                    <span style={{ fontSize: 18, color: '#62d76b', opacity: 0.7 }}>Add Slide</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Spinner animation for global use */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .main-preview.exporting span[style*='position: absolute'][style*='right: 12px'][style*='bottom: 8px'] {
          display: none !important;
        }
      `}</style>
    </ProtectedRoute>
  );
} 