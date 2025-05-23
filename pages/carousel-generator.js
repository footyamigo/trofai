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
import TopDotsSVG from '../components/BackgroundSvgs/TopDotsSVG';
import InlineTextEditor from '../components/InlineTextEditor';
import { usePreviewModal } from '../src/context/PreviewModalContext';
import domtoimage from 'dom-to-image-more';
import ReactDOM from 'react-dom';
import HistoryList from '../components/Dashboard/HistoryList';
import CarouselPreviewModal from '../components/Carousel/CarouselPreviewModal';
import CarouselHistoryTable from '../components/Carousel/CarouselHistoryTable';
import { FiTrash2, FiPlayCircle, FiImage, FiX } from 'react-icons/fi';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import CarouselLoadingModal from '../components/Carousel/CarouselLoadingModal';
import html2canvas from 'html2canvas';
import Modal from '../components/UI/Modal';
import ExportSlide from '../components/Carousel/ExportSlide';
import {
  PREDEFINED_COLOR_PALETTES,
  BACKGROUND_DESIGNS,
  CONTENT_THEMES,
  LOCAL_FOCUS,
  AUDIENCE_APPEAL,
  LOCAL_FOCUS_THEMES,
  AUDIENCE_APPEAL_MAP,
  FONT_PAIRINGS,
  DEFAULT_FONT_PAIRING,
  DEFAULT_BACKGROUND_DESIGN,
  DEFAULT_COLOR_PALETTE_KEY,
  TONE_STYLES, // Import TONE_STYLES
  DEFAULT_TONE_STYLE // Import DEFAULT_TONE_STYLE
} from '../constants/carouselConstants';
import ModernSelect from '../components/Carousel/ModernSelect';
import PredictiveLocationInput from '../components/Carousel/PredictiveLocationInput';
import ChevronIcon from '../components/Carousel/ChevronIcon';
import { swipeButtonStyleBase, swipeButtonArrowStyleBase } from '../components/Carousel/carouselStyles';
import { withPeriod } from '../utils/carouselHelpers';
import useAgentProfile from '../hooks/useAgentProfile';
import WavesSVG from '../components/BackgroundSvgs/WavesSVG';
import AbstractBlobSVG from '../components/BackgroundSvgs/AbstractBlobSVG';
import FluidShapesSVG from '../components/BackgroundSvgs/FluidShapesSVG';
import SubtleGradientLinesSVG from '../components/BackgroundSvgs/SubtleGradientLinesSVG';
import DotScatterBottomRightSVG from '../components/BackgroundSvgs/DotScatterBottomRightSVG';

// Example template data (add more as needed)
// REMOVE OLD TEMPLATES
// const CAROUSEL_TEMPLATES = [ ... ];

// NEW: Define Color Palettes
// const PREDEFINED_COLOR_PALETTES = {
//   'palette1': { name: 'Rose Taupe', primary: '#DE3163', secondary: '#FFBF00', background: '#F8F0E3', text: '#202020' },
//   'palette2': { name: 'Steel Blue', primary: '#4682B4', secondary: '#AED6F1', background: '#EBF5FB', text: '#1A5276' },
//   'palette3': { name: 'Forest Green', primary: '#2ECC71', secondary: '#ABEBC6', background: '#EAFAF1', text: '#186A3B' },
//   'palette4': { name: 'Royal Purple', primary: '#8A2BE2', secondary: '#D8BFD8', background: '#F3E5F5', text: '#4B0082' },
//   'palette5': { name: 'Sunset Orange', primary: '#FF7F50', secondary: '#FFDAB9', background: '#FFF5EE', text: '#A0522D' },
//   'palette6': { name: 'Charcoal Green', primary: '#62d76b', secondary: '#B0BEC5', background: '#37474F', text: '#ECEFF1' },
//   'palette7': { name: 'Teal Aqua', primary: '#008080', secondary: '#AFEEEE', background: '#E0FFFF', text: '#004D4D' },
//   'palette8': { name: 'Crimson Red', primary: '#DC143C', secondary: '#FFB6C1', background: '#FFF0F5', text: '#8B0000' },
//   'palette9': { name: 'Goldenrod Yellow', primary: '#DAA520', secondary: '#FFFACD', background: '#FFFFF0', text: '#554200' },
//   'palette10': { name: 'Lavender Bliss', primary: '#9370DB', secondary: '#E6E6FA', background: '#FAF0E6', text: '#483D8B' },
//   'palette11': { name: 'Mint Fresh', primary: '#3EB489', secondary: '#F5FFFA', background: '#E0FFF0', text: '#2F4F4F' },
//   'palette12': { name: 'Warm Sand', primary: '#C19A6B', secondary: '#F5F5DC', background: '#FAF0E6', text: '#8B4513' },
//   'palette13': { name: 'Deep Indigo', primary: '#4B0082', secondary: '#7B68EE', background: '#E6E6FA', text: '#FFFFFF' },
//   'palette14': { name: 'Coral Pink', primary: '#FF7F50', secondary: '#FFEFD5', background: '#FFF8DC', text: '#8B4513' },
//   'palette15': { name: 'Sky Blue', primary: '#87CEEB', secondary: '#F0F8FF', background: '#E6F7FF', text: '#003366' },
//   'palette16': { name: 'Olive Drab', primary: '#6B8E23', secondary: '#FFFFE0', background: '#F5F5DC', text: '#556B2F' },
//   'palette17': { name: 'Maroon Velvet', primary: '#800000', secondary: '#FFE4E1', background: '#FFF0F5', text: '#FFFFFF' },
//   'palette18': { name: 'Slate Gray', primary: '#708090', secondary: '#D3D3D3', background: '#F5F5F5', text: '#2F4F4F' },
//   'palette19': { name: 'Electric Lime', primary: '#AEFF00', secondary: '#F0FFF0', background: '#FFFFF0', text: '#385400' },
//   'palette20': { name: 'Hot Pink', primary: '#FF69B4', secondary: '#FFB6C1', background: '#FFF0F5', text: '#8B0A50' },
//   'palette21': { name: 'Ocean Deep', primary: '#191970', secondary: '#B0C4DE', background: '#F0F8FF', text: '#FFFFFF' },
//   'palette22': { name: 'Terracotta', primary: '#E2725B', secondary: '#FFE4C4', background: '#FAF0E6', text: '#8B4513' },
//   'palette23': { name: 'Emerald City', primary: '#2E8B57', secondary: '#98FB98', background: '#F0FFF0', text: '#FFFFFF' },
//   // Adding ~15 more
//   'palette24': { name: 'Cool Stone', primary: '#A9A9A9', secondary: '#E0E0E0', background: '#F8F8F8', text: '#404040' },
//   'palette25': { name: 'Mustard Field', primary: '#FFDB58', secondary: '#FFF8DC', background: '#FFFFF0', text: '#8B4513' },
//   'palette26': { name: 'Dusty Rose', primary: '#D8BFD8', secondary: '#FFE4E1', background: '#FAF0E6', text: '#8B4513' },
//   'palette27': { name: 'Midnight Blue', primary: '#2C3E50', secondary: '#BDC3C7', background: '#ECF0F1', text: '#FFFFFF' },
//   'palette28': { name: 'Sage Green', primary: '#8FBC8F', secondary: '#F0FFF0', background: '#F5F5F5', text: '#2F4F2F' },
//   'palette29': { name: 'Burnt Sienna', primary: '#E97451', secondary: '#FFE4C4', background: '#FFF5EE', text: '#8B4513' },
//   'palette30': { name: 'Periwinkle', primary: '#CCCCFF', secondary: '#E6E6FA', background: '#F0F8FF', text: '#483D8B' },
//   'palette31': { name: 'Forest Floor', primary: '#556B2F', secondary: '#F5F5DC', background: '#FAF0E6', text: '#FFFFFF' },
//   'palette32': { name: 'Lilac Haze', primary: '#C8A2C8', secondary: '#E6E6FA', background: '#FFF0F5', text: '#483D8B' },
//   'palette33': { name: 'Robin Egg Blue', primary: '#00CCCC', secondary: '#E0FFFF', background: '#F0FFFF', text: '#004D4D' },
//   'palette34': { name: 'Clay Brown', primary: '#B87333', secondary: '#FFEBCD', background: '#FAF0E6', text: '#FFFFFF' },
//   'palette35': { name: 'Seafoam Green', primary: '#98FB98', secondary: '#F0FFF0', background: '#F5FFFA', text: '#2E8B57' },
//   'palette36': { name: 'Plum Perfect', primary: '#8E4585', secondary: '#DDA0DD', background: '#F3E5F5', text: '#FFFFFF' },
//   'palette37': { name: 'Desert Sun', primary: '#FFCC33', secondary: '#FFF8DC', background: '#FFFACD', text: '#8B4513' },
//   'palette38': { name: 'Arctic White', primary: '#778899', secondary: '#E6E6FA', background: '#F8F8FF', text: '#2F4F4F' },
// };

// NEW: Define Background Designs
// const BACKGROUND_DESIGNS = [
//   { label: 'None', value: 'none' },
//   { label: 'Blop', value: 'blop' },
//   { label: 'Circles', value: 'circles' },
//   { label: 'Line', value: 'line' },
//   { label: 'Top Dots', value: 'top dots' },
// ];

// const CONTENT_THEMES = [
//   'Home Buying Tips', 'Home Selling Tips', 'Investment Insights', 'Home Maintenance Tips', 'Mortgage & Financing Advice', 'Real Estate Terminology', 'Staging & Design', 'Legal Aspects', 'Renovation Ideas', 'Sustainability & Green Homes', /*'Local Market Statistics',*/ 'Local Business Spotlights', 'Local Lifestyle & Activities', 'Neighborhood Comparisons'
// ];
// const LOCAL_FOCUS = [
//   'Best Neighborhoods', 'Top-Rated Schools', 'Hidden Gems', 'Parks & Outdoor Spaces', 'Community Events', 'Historic Landmarks', 'Public Transport', 'Family-Friendly Spots', 'Local Businesses', 'Unique Architecture'
// ];
// const AUDIENCE_APPEAL = [
//   'First-time Buyers', 'Homeowners', 'Sellers', 'Renters', 'Investors', 'Downsizers', 'Upsizers', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'
// ];
// const TONE_STYLE = [
//   'Friendly & Approachable', 'Professional & Authoritative', 'Fun & Playful', 'Inspirational & Motivational', 'Educational & Informative', 'Storytelling/Personal', 'Visual/Infographic', 'Conversational/Q&A'
// ];

// const LOCAL_FOCUS_THEMES = [
//   'Local Market Statistics',
//   'Neighborhood Comparisons',
//   'Local Business Spotlights',
//   'Local Lifestyle & Activities',
//   'Best Neighborhoods',
//   'Top-Rated Schools',
//   'Hidden Gems',
//   'Parks & Outdoor Spaces',
//   'Community Events',
//   'Historic Landmarks',
//   'Public Transport',
//   'Family-Friendly Spots',
//   'Unique Architecture',
// ];

// // Mapping of Content Theme to relevant Audience Appeal options
// const AUDIENCE_APPEAL_MAP = {
//   'Home Buying Tips': ['First-time Buyers', 'Homeowners', 'Investors', 'Renters', 'Upsizers', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'],
//   'Home Selling Tips': ['Sellers', 'Homeowners', 'Investors', 'Downsizers', 'Upsizers', 'Families', 'Retirees', 'General Public'],
//   'Investment Insights': ['Investors', 'Homeowners', 'Sellers', 'General Public'],
//   'Home Maintenance Tips': ['Homeowners', 'Sellers', 'Renters', 'Families', 'Retirees', 'General Public'],
//   'Mortgage & Financing Advice': ['First-time Buyers', 'Homeowners', 'Investors', 'Sellers', 'Renters', 'General Public'],
//   'Real Estate Terminology': ['First-time Buyers', 'Homeowners', 'Sellers', 'Investors', 'Renters', 'General Public'],
//   'Staging & Design': ['Sellers', 'Homeowners', 'Investors', 'General Public'],
//   'Legal Aspects': ['Homeowners', 'Sellers', 'Investors', 'Renters', 'General Public'],
//   'Renovation Ideas': ['Homeowners', 'Sellers', 'Investors', 'Families', 'General Public'],
//   'Sustainability & Green Homes': ['Homeowners', 'Investors', 'Renters', 'Families', 'General Public'],
//   'Local Market Statistics': ['Homeowners', 'Sellers', 'Investors', 'General Public'],
//   'Local Business Spotlights': ['Homeowners', 'Sellers', 'Investors', 'General Public'],
//   'Local Lifestyle & Activities': ['Homeowners', 'Sellers', 'Investors', 'Families', 'Singles/Young Professionals', 'Retirees', 'General Public'],
//   'Neighborhood Comparisons': ['First-time Buyers', 'Homeowners', 'Sellers', 'Investors', 'Renters', 'Families', 'General Public'],
// };

// // Exact font pairings from user screenshot
// const FONT_PAIRINGS = [
//   { label: 'DM Serif Display + DM Sans', heading: 'DM Serif Display', paragraph: 'DM Sans' },
//   { label: 'Ultra + PT Serif', heading: 'Ultra', paragraph: 'PT Serif' },
//   { label: 'Oswald + Source Sans 3', heading: 'Oswald', paragraph: 'Source Sans 3' },
//   { label: 'Big Shoulders Display + Inter', heading: 'Big Shoulders Display', paragraph: 'Inter' },
//   { label: 'Stint Ultra Expanded + Pontano Sans', heading: 'Stint Ultra Expanded', paragraph: 'Pontano Sans' },
//   { label: 'Fjalla One + Cantarell', heading: 'Fjalla One', paragraph: 'Cantarell' },
//   { label: 'Syne + Inter', heading: 'Syne', paragraph: 'Inter' },
//   { label: 'Yellowtail + Lato', heading: 'Yellowtail', paragraph: 'Lato' },
//   { label: 'Rubik + Roboto Mono', heading: 'Rubik', paragraph: 'Roboto Mono' },
//   { label: 'League Spartan + Work Sans', heading: 'League Spartan', paragraph: 'Work Sans' },
//   { label: 'Anton + Roboto', heading: 'Anton', paragraph: 'Roboto' },
//   { label: 'Teko + Ubuntu', heading: 'Teko', paragraph: 'Ubuntu' },
//   { label: 'Philosopher + Mulish', heading: 'Philosopher', paragraph: 'Mulish' },
//   { label: 'Alfa Slab One + Gentium Plus', heading: 'Alfa Slab One', paragraph: 'Gentium Plus' },
//   { label: 'Archivo Black + Archivo', heading: 'Archivo Black', paragraph: 'Archivo' },
//   { label: 'Della Respira + Open Sans', heading: 'Della Respira', paragraph: 'Open Sans' },
//   { label: 'Rozha One + Questrial', heading: 'Rozha One', paragraph: 'Questrial' },
//   { label: 'Bangers + Oswald', heading: 'Bangers', paragraph: 'Oswald' },
//   { label: 'Bebas + Lato', heading: 'Bebas Neue', paragraph: 'Lato' },
//   { label: 'League Gothic + Poppins', heading: 'League Gothic', paragraph: 'Poppins' },
//   { label: 'Poppins + Inter', heading: 'Poppins', paragraph: 'Inter' },
//   { label: 'Space Mono + Rubik', heading: 'Space Mono', paragraph: 'Rubik' },
//   { label: 'Lora + Ubuntu', heading: 'Lora', paragraph: 'Ubuntu' },
//   { label: 'Montserrat + Work Sans', heading: 'Montserrat', paragraph: 'Work Sans' },
//   { label: 'Playfair Display + Chivo', heading: 'Playfair Display', paragraph: 'Chivo' },
//   { label: 'Bricolage Grotesque + Lato', heading: 'Bricolage Grotesque', paragraph: 'Lato' },
// ];

// // Set the default font pairing to 'Della Respira + Open Sans'
// const DEFAULT_FONT_PAIRING = FONT_PAIRINGS.find(f => f.label === 'Della Respira + Open Sans') || FONT_PAIRINGS[0];

// // Set the default background design to 'Top Dots'
// const DEFAULT_BACKGROUND_DESIGN = 'top dots';

// // Set the default color palette to 'palette3' (Forest Green)
// const DEFAULT_COLOR_PALETTE_KEY = 'palette3';

// Helper to ensure heading ends with a period
// function withPeriod(text) {
//   if (!text) return '';
//   const trimmed = text.trim();
//   // If ends with ., !, ?, …, or ... do not add a period
//   if (/[.!?…]$/.test(trimmed) || trimmed.endsWith('...')) return trimmed;
//   return trimmed + '.';
// }

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY || 'YOUR_PIXABAY_API_KEY';
const PIXABAY_API_URL = 'https://pixabay.com/api/';

export default function CarouselGeneratorPage() {
  // --- OPTIONS STATE ---
  const [location, setLocation] = useState(null);
  const [contentTheme, setContentTheme] = useState(CONTENT_THEMES[0]);
  const [localFocus, setLocalFocus] = useState(LOCAL_FOCUS[0]);
  const [audienceAppeal, setAudienceAppeal] = useState(AUDIENCE_APPEAL_MAP[CONTENT_THEMES[0]]?.[0] || AUDIENCE_APPEAL[0]);
  const [toneStyle, setToneStyle] = useState(DEFAULT_TONE_STYLE); // Add toneStyle state
  
  // --- EDITOR STATE ---
  const [activeEditorTab, setActiveEditorTab] = useState('Content'); // 'Content', 'Settings', 'Theme'
  const [mainTitle, setMainTitle] = useState('Buying Property in London'); // Global Title
  const [mainSubtitle, setMainSubtitle] = useState('Your Ultimate Guide to Real Estate in the UK Capital'); // Global Subtitle
  const [currentSlide, setCurrentSlide] = useState(0); // 0-7 (or more if needed)
  const [slides, setSlides] = useState([
    {
      heading: "Are NYC rental agents hiding this secret from you?",
      paragraph: undefined, // Slide 1 has only heading
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: undefined, // Slide 2 has only paragraph
      paragraph: "Your agent won't tell you this, but there's more to renting in NYC than meets the eye. In a city where every square foot counts, uncovering these trade secrets could save you thousands. Let's dive into what's really happening behind those glossy listings.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "The scarcity myth of NYC rentals",
      paragraph: "Contrary to what brokers claim, there's no real shortage of apartments in NYC—just a shortage of great deals they're willing to show you upfront. Hidden gems are often left out of viewings unless you know how to ask the right questions.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "Rent-stabilized units: An urban legend?",
      paragraph: "Finding a rent-stabilized unit isn't as mythical as agents suggest. The trick is knowing where and when to look. Certain neighborhoods like Washington Heights and Bay Ridge still have opportunities if you're persistent and savvy.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "First-month rent scams abound",
      paragraph: "Shockingly, some New Yorkers end up paying twice the necessary first-month fees due to hidden charges sneakily embedded by agents. Always demand a full breakdown before signing anything—transparency can save you plenty.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "Amenities create illusions of value",
      paragraph: "Do private gyms or rooftop terraces justify skyrocketing prices? Often portrayed as 'bargains', many high-rise amenities don't truly enhance your quality of life. So, assess what truly matters for your lifestyle before getting lured by bells and whistles.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "The truth about broker fees",
      paragraph: "Many renters think broker fees are inevitable, but they aren't gospel. Some landlords offer no-fee apartments directly. Websites like StreetEasy can guide you on how to spot these elusive offers throughout various boroughs.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "Market timing magic: Your silent ally",
      paragraph: "Ever wondered why waiting until just after peak moving season often slashes rents? Manhattan tends to see slower movement during winter months, making it prime time for bargaining power with desperate landlords needing occupancy.",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    },
    {
      heading: "Unlock real savings in the Big Apple",
      paragraph: "Want insider tips on navigating New York's labyrinthine rental market? I'm here to help unravel the complexity so you stay ahead of potential pitfalls. Drop me a comment or send a DM—I'd love to join forces in saving you time and money!",
      textAlign: 'left',
      fontStyle: 'normal',
      textDecoration: 'none',
      textEffect: 'none',
      backgroundImage: '',
      backgroundImagePosition: 'center center',
    }
  ]);
  const [globalCaption, setGlobalCaption] = useState(''); // Initialize globalCaption state
  const [generateCaption, setGenerateCaption] = useState(true); // Added state for caption generation toggle

  // --- SETTINGS STATE ---
  // Use agent profile hook
  const { agentName: userName, agentPhotoUrl: userHeadshot, agentEmail: userEmail, agentPhone: userPhone } = useAgentProfile();
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customColors, setCustomColors] = useState({ primary: '#62d76b', secondary: '#cccccc', background: '#ffffff', text: '#1a1a1a' }); // Default custom

  // --- THEME STATE ---
  const [backgroundDesign, setBackgroundDesign] = useState(DEFAULT_BACKGROUND_DESIGN); // Default to 'Top Dots'
  const [selectedColorPaletteKey, setSelectedColorPaletteKey] = useState(DEFAULT_COLOR_PALETTE_KEY);
  
  // --- DERIVED STATE ---
  const allCities = City.getAllCities();
  const activeColorPalette = useCustomColors ? customColors : PREDEFINED_COLOR_PALETTES[selectedColorPaletteKey];

  // REMOVE OLD TEMPLATE FINDER
  // const selectedTemplate = CAROUSEL_TEMPLATES.find(t => t.id === selectedTemplateId);

  // Refined generation logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [lastGenerationOptions, setLastGenerationOptions] = useState(null);
  const handleGenerate = async () => {
    if (!location || typeof location !== 'object' || !location.fullSuggestion) {
      alert('Please select a valid location.');
      return;
    }
    if (!contentTheme || !audienceAppeal) {
      alert('Please ensure Content Theme and Audience Appeal are selected.');
      return;
    }
    setIsGenerating(true);
    setGenerateError(null);
    const currentOptionsForAPI = {
      location: location.fullSuggestion || location.description,
      contentTheme: contentTheme,
      localFocus: LOCAL_FOCUS_THEMES.includes(contentTheme) ? localFocus : 'General Overview',
      audienceAppeal: audienceAppeal,
      toneStyle: toneStyle, // Add toneStyle to API options
      mainTitle: `${contentTheme} in ${location.fullSuggestion || location.description}`,
      mainSubtitle: mainSubtitle || '',
    };

    // Compare to lastGenerationOptions
    // For comparison, we only care about the core generation inputs, not derived titles/subtitles.
    const coreOptionsForComparison = {
      location: currentOptionsForAPI.location,
      contentTheme: currentOptionsForAPI.contentTheme,
      localFocus: currentOptionsForAPI.localFocus,
      audienceAppeal: currentOptionsForAPI.audienceAppeal,
      toneStyle: currentOptionsForAPI.toneStyle, // Add toneStyle for comparison
    };

    const isRegeneration =
      lastGenerationOptions &&
      Object.keys(coreOptionsForComparison).every(
        key => coreOptionsForComparison[key] === lastGenerationOptions[key]
      ) &&
      slides && slides.length > 0;

    const previousSlides = isRegeneration
      ? slides.map(({ heading, paragraph }) => ({ heading, paragraph }))
      : undefined;

    const apiRequestBody = {
      contentTheme: currentOptionsForAPI.contentTheme,
      localFocus: currentOptionsForAPI.localFocus,
      audienceAppeal: currentOptionsForAPI.audienceAppeal,
      toneStyle: currentOptionsForAPI.toneStyle, // Add toneStyle to API request body
      mainTitle: currentOptionsForAPI.mainTitle,
      mainSubtitle: currentOptionsForAPI.mainSubtitle,
      location: currentOptionsForAPI.location,
      useLocationInContent: true,
      isRegeneration,
      previousSlides
    };

    console.log('Sending to /api/generate-carousel-slides:', JSON.stringify(apiRequestBody, null, 2)); // Log the exact body
    
    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
      const res = await fetch('/api/generate-carousel-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify(apiRequestBody) // Use the prepared body object
      });
      
      const data = await res.json();
      if (data && data.slides) {
        console.log('Content of all generated slides:', JSON.stringify(data.slides, null, 2));
      } else {
        console.log('No slides data received from API or data format is unexpected:', data);
      }

      if (!data.success || !Array.isArray(data.slides)) {
        throw new Error(data.message || 'Failed to generate slides');
      }
      
      const styledSlides = data.slides.map((apiSlideData, index) => {
        const currentSlide = slides[index] || {}; // Get current slide at this index or default to empty object
        return {
          // Preserve existing image properties and default styles
        textAlign: 'left',
        fontStyle: 'normal',
        textDecoration: 'none',
        textEffect: 'none',
          backgroundImage: currentSlide.backgroundImage || '', 
          backgroundImagePosition: currentSlide.backgroundImagePosition || 'center center',
          
          // Overwrite with new text content from the API
          heading: apiSlideData.heading,
          paragraph: apiSlideData.paragraph,
        };
      });
      
      setSlides(styledSlides);
      setMainTitle(styledSlides[0]?.heading || currentOptionsForAPI.mainTitle); // Update mainTitle based on API response or options
      setMainSubtitle(styledSlides[0]?.paragraph || currentOptionsForAPI.mainSubtitle);
      setCurrentSlide(0);
      setLastGenerationOptions(coreOptionsForComparison); // Update with the core options used for this generation
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
  
  // Helper for slide background - UPDATED FOR GRADIENTS
  const getSlideBackgroundStyle = (slideIndex) => {
    if (activeColorPalette.isGradient) {
      return {
        backgroundImage: `linear-gradient(${activeColorPalette.angle || 'to bottom'}, ${activeColorPalette.primary}, ${activeColorPalette.secondary})`,
        color: activeColorPalette.text,
      };
    }
      return {
          backgroundColor: activeColorPalette.background,
      color: activeColorPalette.text,
    };
  };

  // Helper for SVG fill color - ensures proper contrast for gradient vs solid palettes
  const getSVGFillColor = () => {
    return activeColorPalette.isGradient ? activeColorPalette.text : activeColorPalette.primary;
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
  const exportSlideRefs = useRef([]);

  // --- Add function to generate PNG images from slides ---
  const handlePreviewCarousel = async () => {
    if (
      !slides[0]?.heading ||
      !slides[1]?.paragraph ||
      slides.slice(2).some(slide => !slide.heading || !slide.paragraph)
    ) {
      alert("Please ensure the first slide has a heading, the second slide has a paragraph, and all other slides have both a heading and a paragraph.");
      return;
    }
    if (!userName || userName === 'Your Name' || !userPhone || !userEmail) {
      alert("Agent profile is incomplete. Please ensure your Name, Email, and Phone are set in your profile before generating a preview.");
      setPreviewError("Agent profile is incomplete. Name, Email, and Phone are required.");
      return;
    }
    setPreviewError(null);
    setIsGeneratingPreview(true);
    setShowLoadingModal(true);
    setLoadingStepIndex(0); // Step 0: Preparing Slides
    setLoadingError(null);
    setSlideProgress(null);
    // Wait for all fonts to be loaded before export
    await document.fonts.ready;
    await new Promise(res => setTimeout(res, 100)); // Small delay for reflow
    const currentSlidesForImageGen = slides.map(s => ({ ...s }));
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1080px';
    tempContainer.style.height = '1350px';
    document.body.appendChild(tempContainer);
    const slideImages = [];
    try {
      setLoadingStepIndex(1); // Step 1: Generating Images
      for (let i = 0; i < currentSlidesForImageGen.length; i++) {
        setSlideProgress({ current: i + 1, total: currentSlidesForImageGen.length });
        const slide = currentSlidesForImageGen[i];
        const elementToRender = (
          <ExportSlide
            slide={slide}
            index={i}
            userName={userName}
            userEmail={userEmail}
            userHeadshot={userHeadshot}
            activeColorPalette={activeColorPalette}
            selectedBackground={selectedBackground}
            selectedFontPairing={selectedFontPairing}
            slidesLength={currentSlidesForImageGen.length}
            showSlideCounter={false}
            selectedColorPaletteKey={selectedColorPaletteKey}
          />
        );
        await new Promise(resolve => {
          ReactDOM.render(elementToRender, tempContainer, resolve);
        });
        await document.fonts.ready;
        tempContainer.offsetHeight;
        await new Promise(res => setTimeout(res, 100));
        const canvas = await html2canvas(tempContainer.firstChild, {
          backgroundColor: activeColorPalette.isGradient ? null : activeColorPalette.background,
          useCORS: true,
          scale: 1,
        });
        const dataUrl = canvas.toDataURL('image/png');
        slideImages.push({
          heading: slide.heading,
          paragraph: slide.paragraph,
          imageUrl: dataUrl,
        });
        ReactDOM.unmountComponentAtNode(tempContainer);
      }
      document.body.removeChild(tempContainer);
      setSlideProgress(null);
      setLoadingStepIndex(2); // Step 2: Generating Caption
      let caption = globalCaption || '';
      if (generateCaption) {
        const captionResponse = await fetch('/api/generate-carousel-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: currentSlidesForImageGen,
            mainTitle,
            agentProfile: {
              agentName: userName,
              agentEmail: userEmail,
              agentPhone: userPhone
            },
            contentTheme: contentTheme,
            audienceAppeal: audienceAppeal,
            toneStyle: toneStyle // Add toneStyle to caption generation API call
          }),
        });
        if (!captionResponse.ok) {
          const errorData = await captionResponse.json();
          throw new Error(errorData.message || 'Failed to generate caption');
        }
        const captionData = await captionResponse.json();
        caption = captionData.caption;
        setGlobalCaption(caption);
      }
      setLoadingStepIndex(3); // Step 3: Uploading Images
      // Upload all images to S3 and save carousel
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
      setLoadingStepIndex(4); // Step 4: Finalizing Carousel (Uploading Images...)
      const saveResponse = await fetch('/api/carousels/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          slides: slideImages,
          mainTitle,
          globalCaption: caption,
          contentTheme,
          city: location ? location.name : null,
          audienceAppeal: audienceAppeal || null,
          toneStyle: toneStyle, // Add toneStyle to save carousel API call
          colorPalette: activeColorPalette,
          backgroundDesign,
          fontPairing: selectedFontPairing,
        }),
      });
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save carousel');
      }
      const saveData = await saveResponse.json();
      setLoadingStepIndex(5); // Step 5: Done!
      setShowLoadingModal(false);
      setLoadingStepIndex(0);

      // Add the new carousel to the beginning of the history
      const newCarouselForHistory = {
        id: saveData.savedCarousel.id,
        title: saveData.savedCarousel.mainTitle || 'Untitled Carousel',
        imageUrl: saveData.savedCarousel.slides && saveData.savedCarousel.slides[0] ? (saveData.savedCarousel.slides[0].s3ImageUrl || saveData.savedCarousel.slides[0].imageUrl) : '',
        date: saveData.savedCarousel.createdAt ? new Date(saveData.savedCarousel.createdAt).toLocaleDateString() : new Date().toLocaleDateString(), // Fallback to current date if createdAt is not available immediately
        carouselData: saveData.savedCarousel,
      };
      setCarouselHistory(prevHistory => [newCarouselForHistory, ...prevHistory]);

      // Show the preview modal with S3 URLs
      openPreviewModal({
        ...saveData.savedCarousel,
        slides: saveData.savedCarousel.slides,
        colorPalette: activeColorPalette,
        fontPairing: selectedFontPairing,
        backgroundDesign: backgroundDesign,
        mainTitle: mainTitle,
      });
      // Save carousel in the background (already done by /api/carousels/save)
    } catch (error) {
      setLoadingError(error.message || 'An unexpected error occurred.');
      if (tempContainer.parentNode === document.body) {
        document.body.removeChild(tempContainer);
      }
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

  // --- CAROUSEL HISTORY STATE ---
  const [carouselHistory, setCarouselHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedCarousel, setSelectedCarousel] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedCarouselIds, setSelectedCarouselIds] = useState([]);
  const [showDeleteSelectedConfirmation, setShowDeleteSelectedConfirmation] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false); // New state for bulk delete loading

  // Fetch carousel history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
        if (!sessionToken) return setCarouselHistory([]);
        const res = await fetch('/api/carousels/list', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.carousels)) {
          setCarouselHistory(data.carousels.map(carousel => ({
            id: carousel.id,
            title: carousel.mainTitle || 'Untitled Carousel',
            imageUrl: carousel.slides && carousel.slides[0] ? (carousel.slides[0].s3ImageUrl || carousel.slides[0].imageUrl) : '',
            date: carousel.createdAt ? new Date(carousel.createdAt).toLocaleDateString() : '',
            carouselData: carousel,
          })));
        } else {
          setCarouselHistory([]);
        }
      } catch (e) {
        setCarouselHistory([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDeleteCarousel = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCarousel = async () => {
    if (!itemToDelete || !itemToDelete.id) return;
    setDeletingId(itemToDelete.id);
    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
      const res = await fetch(`/api/carousels/delete?id=${itemToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCarouselHistory(prev => prev.filter(c => c.id !== itemToDelete.id));
      } else {
        alert(data.message || 'Failed to delete carousel.');
      }
    } catch (e) {
      alert('Failed to delete carousel.');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirmation(false);
      setItemToDelete(null);
    }
  };

  const cancelDeleteCarousel = () => {
    setShowDeleteConfirmation(false);
    setDeletingId(null);
    setItemToDelete(null);
  };

  const handleSelectCarousel = (id) => {
    setSelectedCarouselIds(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(selectedId => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAllCarousels = (isSelected) => {
    if (isSelected) {
      setSelectedCarouselIds(carouselHistory.map(item => item.id));
    } else {
      setSelectedCarouselIds([]);
    }
  };

  const handleDeleteSelectedCarousels = () => {
    setShowDeleteSelectedConfirmation(true);
  };

  const confirmDeleteSelectedCarousels = async () => {
    if (selectedCarouselIds.length === 0) return;
    
    setIsBulkDeleting(true); // Set loading state

    let SucceededDeletes = 0;
    let FailedDeletes = 0;

    try {
      const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
      for (const id of selectedCarouselIds) {
        try {
          const res = await fetch(`/api/carousels/delete?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${sessionToken}` },
          });
          const data = await res.json();
          if (data.success) {
            SucceededDeletes++;
          } else {
            console.warn(`Failed to delete carousel ${id}: ${data.message}`);
            FailedDeletes++;
          }
        } catch (e) {
          console.error(`Error deleting carousel ${id}:`, e);
          FailedDeletes++;
        }
      }

      if (SucceededDeletes > 0) {
        setCarouselHistory(prev => prev.filter(c => !selectedCarouselIds.includes(c.id)));
         // Only clear selected IDs that were successfully deleted or all if all succeeded
        if (FailedDeletes === 0) {
            setSelectedCarouselIds([]); 
        } else {
            // If some failed, we might want to keep them selected, or filter out only successful ones.
            // For simplicity, let's clear all for now, but this could be refined.
            setSelectedCarouselIds(prevSelected => prevSelected.filter(id => 
                !carouselHistory.find(c => c.id === id && selectedCarouselIds.includes(c.id)) // keep if not in original successful delete list
            ));
        }
      }

      if (FailedDeletes > 0) {
        alert(`Successfully deleted ${SucceededDeletes} carousels. Failed to delete ${FailedDeletes} carousels. Please check console for details.`);
      } else if (SucceededDeletes > 0) {
        // alert(`${SucceededDeletes} carousel(s) deleted successfully.`); // Optional: if you want a success message
      } else {
        // This case should ideally not be reached if selectedCarouselIds.length > 0 initially
        alert('No carousels were deleted.');
      }

    } catch (e) {
      // This catch is for unforeseen errors in the loop setup or token retrieval, not individual deletes.
      alert('An unexpected error occurred during the bulk delete operation.');
      console.error("Bulk delete operation error:", e);
    } finally {
      setShowDeleteSelectedConfirmation(false);
      setIsBulkDeleting(false); // Reset bulk delete loading state
    }
  };

  const cancelDeleteSelectedCarousels = () => {
    setShowDeleteSelectedConfirmation(false);
  };

  // --- LOADING MODAL STATE ---
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingError, setLoadingError] = useState(null);
  const [slideProgress, setSlideProgress] = useState(null);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const openVideoModal = () => setIsVideoModalOpen(true);
  const closeVideoModal = () => setIsVideoModalOpen(false);

  // Update audience appeal options when content theme changes
  useEffect(() => {
    const relevantAudiences = AUDIENCE_APPEAL_MAP[contentTheme] || AUDIENCE_APPEAL;
    const currentAudienceIsValid = relevantAudiences.includes(audienceAppeal);

    if (!currentAudienceIsValid && relevantAudiences.length > 0) {
      setAudienceAppeal(relevantAudiences[0]);
    } else if (!currentAudienceIsValid && AUDIENCE_APPEAL.length > 0) {
      setAudienceAppeal(AUDIENCE_APPEAL[0]);
    }
  }, [contentTheme, audienceAppeal]);

  // Reset Local Focus to General Overview if the theme changes and Local Focus is no longer applicable
  useEffect(() => {
    if (!LOCAL_FOCUS_THEMES.includes(contentTheme)) {
      setLocalFocus(LOCAL_FOCUS[0]); // Default to General Overview
    }
  }, [contentTheme]);

  const [editingHeading, setEditingHeading] = useState(null); // { index: number, rawText: string } | null

  const [pixabayModalOpen, setPixabayModalOpen] = useState(false);
  const [pixabaySearch, setPixabaySearch] = useState('');
  const [pixabayResults, setPixabayResults] = useState([]);
  const [pixabayLoading, setPixabayLoading] = useState(false);
  const [pixabayError, setPixabayError] = useState('');
  const [pixabayTargetSlide, setPixabayTargetSlide] = useState(null);
  const [pixabayCurrentPage, setPixabayCurrentPage] = useState(1);
  const [pixabayTotalHits, setPixabayTotalHits] = useState(0);
  const [pixabayIsLoadingMore, setPixabayIsLoadingMore] = useState(false);
  const [imageControlPopover, setImageControlPopover] = useState({ open: false, slideIndex: null, anchorEl: null });

  const searchPixabay = async (query = 'property real estate', isLoadMore = false) => {
    const effectiveQuery = query.trim() === '' ? 'property real estate' : query.trim();

    if (!isLoadMore) {
      setPixabayLoading(true);
      setPixabayCurrentPage(1);
      setPixabayResults([]);
      setPixabayTotalHits(0);
    } else {
      if (pixabayIsLoadingMore || pixabayResults.length >= pixabayTotalHits) return;
      setPixabayIsLoadingMore(true);
    }
    setPixabayError('');
    const pageToFetch = isLoadMore ? pixabayCurrentPage + 1 : 1;

    try {
      // Fetch 50 images per page
      const res = await fetch(`${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(effectiveQuery)}&image_type=photo&per_page=50&page=${pageToFetch}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch images: ${res.status} ${errorText}`);
      }
      const data = await res.json();
      if (data.hits) {
        setPixabayResults(prevResults => isLoadMore ? [...prevResults, ...data.hits] : data.hits);
        setPixabayTotalHits(data.totalHits || 0);
        if (pageToFetch === 1) setPixabayCurrentPage(1);
        else if (isLoadMore) setPixabayCurrentPage(pageToFetch);
      } else {
        if (!isLoadMore) setPixabayResults([]);
      }
    } catch (e) {
      console.error("Pixabay API Error:", e);
      setPixabayError('Failed to fetch images. Check console for details.');
    } finally {
      if (!isLoadMore) {
        setPixabayLoading(false);
      } else {
        setPixabayIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    if (pixabayModalOpen && pixabaySearch.trim() === '' && pixabayResults.length === 0 && !pixabayLoading && !pixabayIsLoadingMore) {
      searchPixabay(); // Will use default 'property real estate' query and fetch 50 images
    }
  }, [pixabayModalOpen, pixabaySearch, pixabayResults.length, pixabayLoading, pixabayIsLoadingMore]);

  // --- Handlers for Image Control Popover ---
  const handleOpenImageControl = (event, index) => {
    setImageControlPopover({ open: true, slideIndex: index, anchorEl: event.currentTarget });
  };

  const handleCloseImageControl = () => {
    setImageControlPopover({ open: false, slideIndex: null, anchorEl: null });
  };

  const handleChooseImageFromPopover = () => {
    if (imageControlPopover.slideIndex !== null) {
      // setPexelsTargetSlide(imageControlPopover.slideIndex);
      // setPexelsModalOpen(true);
      // setPexelsSearch('');
      // setPexelsResults([]);
      setPixabayTargetSlide(imageControlPopover.slideIndex);
      setPixabayModalOpen(true);
      setPixabaySearch('');
      setPixabayResults([]);
    }
    handleCloseImageControl();
  };

  const handleRemoveImageFromPopover = () => {
    if (imageControlPopover.slideIndex !== null) {
      setSlides(prev => prev.map((s, i) => i === imageControlPopover.slideIndex ? { ...s, backgroundImage: '' } : s));
    }
    handleCloseImageControl();
  };

  const [paletteWarningModal, setPaletteWarningModal] = useState({ open: false, selectedPaletteKey: null });

  const handlePaletteSelection = (key) => {
    const anySlideHasBgImage = slides.some(s => !!s.backgroundImage);
    if (anySlideHasBgImage) {
      setPaletteWarningModal({ open: true, selectedPaletteKey: key });
    } else {
      setSelectedColorPaletteKey(key);
      setUseCustomColors(false);
    }
  };

  const confirmPaletteSelection = () => {
    if (paletteWarningModal.selectedPaletteKey) {
      setSelectedColorPaletteKey(paletteWarningModal.selectedPaletteKey);
      setUseCustomColors(false);
      // Remove all background images
      setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImage: '' })));
    }
    setPaletteWarningModal({ open: false, selectedPaletteKey: null });
  };

  const cancelPaletteSelection = () => {
    setPaletteWarningModal({ open: false, selectedPaletteKey: null });
  };

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to top, rgba(98, 215, 107, 0.15) 0%, rgba(255, 255, 255, 0) 100%)' }}>
        <Head>
          <title>Carousel Generator - Trofai</title>
        </Head>
        <MobileMenu activePage="carousel-generator" />
        <Sidebar activePage="carousel-generator" />
        <div className="dashboard-container" style={{ marginLeft: 240, padding: '0.5rem 0', minHeight: '100vh' }}>
          <DashboardHeader />
          <main className="main" style={{ padding: '2rem 1rem' }}>
            {/* --- New Heading Section --- */}
            <div className="dashboard-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <h1 className="title">Carousel Generator</h1>
                <FiPlayCircle
                  onClick={openVideoModal}
                  style={{
                    fontSize: '1.5rem',
                    color: '#62d76b',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = '#56c15f')}
                  onMouseOut={e => (e.currentTarget.style.color = '#62d76b')}
                  title="Watch How-To Video"
                />
              </div>
              <p className="subtitle">Select your options, then generate and preview your carousel.</p>
            </div>
            {/* --- End Heading Section --- */}
            {/* NEW Three-Column Layout */}
            <div className="carousel-generator-layout" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
              
              {/* === Left Panel: Options === */}
              <div className="carousel-options-panel" style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 10, boxShadow: '0 1px 5px rgba(0,0,0,0.05)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', height: '602.5px', overflowY: 'auto' }}> 
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: '#333' }}>Generation Options</h2>
                
                <PredictiveLocationInput
                  label="Location"
                  value={location ? location.fullSuggestion || location.description : ''}
                  onChange={setLocation}
                  placeholder="Type a city, neighborhood, or place..."
                />

                <ModernSelect
                  label="Content Theme"
                  value={contentTheme}
                  onChange={setContentTheme}
                  options={CONTENT_THEMES.map(theme => ({ value: theme, label: theme }))}
                />

                {/* Local Focus dropdown - visibility based on LOCAL_FOCUS_THEMES from constants */}
                {LOCAL_FOCUS_THEMES.includes(contentTheme) && (
                  <ModernSelect
                    label="Local Focus (Content Angle)"
                    value={localFocus}
                    onChange={setLocalFocus}
                    options={LOCAL_FOCUS.map(focus => ({ value: focus, label: focus }))} // Uses updated LOCAL_FOCUS
                    placeholder="Select a specific angle..."
                  />
                )}

                <ModernSelect
                  label="Audience Appeal"
                  value={audienceAppeal}
                  onChange={setAudienceAppeal}
                  options={(AUDIENCE_APPEAL_MAP[contentTheme] || AUDIENCE_APPEAL).map(appeal => ({ value: appeal, label: appeal }))}
                  disabled={!(AUDIENCE_APPEAL_MAP[contentTheme] && AUDIENCE_APPEAL_MAP[contentTheme].length > 0)}
                />

                <ModernSelect // Add ModernSelect for Tone Style
                  label="Tone of Voice"
                  value={toneStyle}
                  onChange={setToneStyle}
                  options={TONE_STYLES.map(tone => ({ value: tone, label: tone }))}
                />

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
                            <div key={key} onClick={() => handlePaletteSelection(key)}
                              title={palette.name}
                              style={{
                                height: 25,
                                borderRadius: 5,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: palette.isGradient
                                  ? `linear-gradient(${palette.angle || 'to bottom'}, ${palette.primary}, ${palette.secondary})`
                                  : `linear-gradient(to right, ${palette.primary} 33%, ${palette.secondary} 33%, ${palette.secondary} 66%, ${palette.background} 66%)`,
                                border: !useCustomColors && selectedColorPaletteKey === key 
                                  ? `2px solid ${palette.isGradient ? palette.primary : '#62d76b'}` 
                                  : '2px solid transparent',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                position: 'relative'
                              }}
                            >
                              {/* Optional: Add a small checkmark or indicator for gradient type if needed */}
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
                <Button 
                  onClick={handleGenerate} 
                  style={{ width: '100%', marginTop: 6, fontSize: 14, padding: '8px 0', borderRadius: 6 }} 
                  disabled={isGenerating}
                  isLoading={isGenerating}
                > 
                  {isGenerating ? 'Generating Content...' : 'Generate Content Ideas'}
                </Button>
                
                {/* Add Preview button */}
                {previewError && (
                  <div style={{ color: 'red', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{previewError}</div>
                )}
                <Button 
                  onClick={handlePreviewCarousel} 
                  variant="light-outline"
                  style={{ 
                    width: '100%', 
                    marginTop: 10, 
                    fontSize: 14, 
                    padding: '8px 0', 
                    borderRadius: 6,
                  }} 
                  disabled={isGeneratingPreview || !lastGenerationOptions || slides.length === 0}
                  isLoading={isGeneratingPreview}
                >
                  {isGeneratingPreview ? 'Preparing...' : 'Preview Carousel'}
                </Button>
                    </div>

              {/* === Center Panel: Focused Slide Preview === */}
              <div className="focused-slide-preview-container" style={{
                display: 'flex',
                flexDirection: 'row', // Arrange slides in a row
                alignItems: 'center', // Vertically center slides if they have different heights (they shouldn't)
                overflowX: 'auto',   // Enable horizontal scrolling
                gap: '1rem',         // Space between slides
                padding: '0 1rem 2rem 1rem', // Adjusted top padding from 2rem to 0
                width: '100%',       // Take available width
                justifyContent: 'flex-start', // Align slides to the start
                minHeight: 600, // Ensure a minimum height for uniformity
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
                      flexShrink: 0,
                      position: 'relative', // Keep for popover anchor
                    }}
                  >
                    {/* Image Control Button - Placed within preview-frame, but outside main-preview */}
                    <button
                      onClick={(e) => handleOpenImageControl(e, index)}
                      title="Manage Background Image"
                      style={{
                        position: 'absolute',
                        top: 4,          // Closer to the frame's top edge
                        right: 4,         // Closer to the frame's right edge
                        background: 'none',
                        border: 'none',
                        borderRadius: '4px',     // Slightly smaller radius
                        padding: '3px',        // Reduced padding around the icon
                        cursor: 'pointer',
                        zIndex: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none'         // No shadow
                      }}
                    >
                      <FiImage size={13} color="#495057" />
                    </button>

                    {/* Image Control Popover (ensure it's correctly anchored if button moves significantly) */}
                    {imageControlPopover.open && imageControlPopover.slideIndex === index && (
                      <div style={{
                        position: 'absolute',
                        top: '35px', // Adjusted for new icon button position
                        right: '5px',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        padding: '20px',
                        zIndex: 100,
                        width: '280px', // Slightly wider
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
                      }}>
                        <button onClick={handleCloseImageControl} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 5 }}><FiX size={18} color="#555" /></button>
                        
                        {/* Large image preview */}
                        <div style={{ width: '100%', height: '120px', background: '#e9ecef', borderRadius: '10px', marginBottom: '18px', overflow: 'hidden' }}>
                          {slides[index].backgroundImage ? (
                            <img src={slides[index].backgroundImage} alt="Current background" style={{ width: '100%', height: '100%', objectFit: 'cover'}} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#6c757d' }}>No Image</div>
                          )}
                        </div>

                        <Button 
                          onClick={handleChooseImageFromPopover} 
                          style={{ width: '100%', /* marginBottom will be handled by the div below */ fontSize: '15px', fontWeight: 500, padding: '10px 0', background: '#62d76b', color: 'white', border: 'none', borderRadius: '8px' }}
                        >
                          Choose Image
                        </Button>
                        
                        {/* Apply to all slides section - ADDING marginTop HERE */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '18px', marginBottom: '16px' }}>
                          <span style={{ fontSize: 15, fontWeight: 500, color: '#343a40' }}>Apply to all slides</span>
                          {/* Custom Toggle Switch */}
                          <label htmlFor={`apply-all-toggle-switch-${index}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                            <input
                              id={`apply-all-toggle-switch-${index}`}
                              type="checkbox"
                              checked={slides[index].backgroundImage ? slides.every(s => s.backgroundImage === slides[index].backgroundImage) : false}
                              onChange={e => {
                                const img = slides[index].backgroundImage;
                                if (e.target.checked && img) {
                                  setSlides(prev => prev.map(s => ({ ...s, backgroundImage: img })));
                                } else if (!e.target.checked && img) {
                                  const currentSlideImg = slides[index].backgroundImage;
                                  setSlides(prev => prev.map((s, i) => 
                                    i === index ? s : (s.backgroundImage === currentSlideImg ? { ...s, backgroundImage: '' } : s)
                                  ));
                                }
                              }}
                              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} // Hide default checkbox
                              disabled={!slides[index].backgroundImage}
                            />
                            {/* Toggle Track */}
                            <span style={{
                              width: '44px', 
                              height: '24px', 
                              borderRadius: '12px',
                              background: (slides[index].backgroundImage ? slides.every(s => s.backgroundImage === slides[index].backgroundImage) : false) ? '#62d76b' : '#ced4da',
                              display: 'inline-block',
                              position: 'relative',
                              transition: 'background 0.3s ease',
                            }}></span>
                            {/* Toggle Thumb (Knob) */}
                            <span style={{
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%',
                              background: 'white',
                              position: 'absolute',
                              top: '2px',
                              left: (slides[index].backgroundImage ? slides.every(s => s.backgroundImage === slides[index].backgroundImage) : false) ? '22px' : '2px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              transition: 'left 0.3s ease',
                            }}></span>
                          </label>
                        </div>

                        {/* Delete Button Area - to be placed below the toggle */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #e9ecef', marginTop: '10px' }}>
                          {slides[index].backgroundImage && (
                            <button 
                              onClick={handleRemoveImageFromPopover} 
                              title="Delete Background Image"
                              style={{ background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FiTrash2 size={16} color="#c62828" />
                              <span style={{ marginLeft: '6px', fontSize: '14px', color: '#c62828', fontWeight: 500 }}>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="main-preview" style={{
                        width: 450,
                        aspectRatio: '4 / 5',
                        maxWidth: 450,
                        minWidth: 450,
                        height: 562.5, // 450 * (5/4) = 562.5, maintaining 4:5 aspect ratio
                        borderRadius: 6,
                      position: 'relative', // Ensure stacking context for overlay and image
                        overflow: 'hidden',
                      // Apply color/gradient background OR image background
                      ...(slide.backgroundImage
                        ? {}
                        : getSlideBackgroundStyle(index)), // Original background if no image
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '25px',
                    }}>
                      {/* Background Image Layer (if exists) */}
                      {slide.backgroundImage && (
                        <img
                          src={slide.backgroundImage}
                          alt="Slide Background"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: slide.backgroundImagePosition || 'center center', // Apply position
                            zIndex: 0, // Behind overlay and content
                          }}
                        />
                      )}
                      {/* Dark Overlay (if background image exists) */}
                      {slide.backgroundImage && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.55)', // Increased darkness from 0.45 to 0.55
                            zIndex: 1, // Above image, below content
                          }}
                        />
                      )}
                      {/* Conditional SVG backgrounds - these will now be on top of the image/overlay or regular background */}
                      {selectedBackground && selectedBackground.value === 'blop' && !slide.backgroundImage && (
                          <BlopSVG 
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'circles' && !slide.backgroundImage && (
                          <CirclesSVG 
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'top dots' && !slide.backgroundImage && (
                          <TopDotsSVG 
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'waves' && !slide.backgroundImage && (
                          <WavesSVG 
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'abstract-blob' && !slide.backgroundImage && (
                          <AbstractBlobSVG 
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'fluid-shapes' && !slide.backgroundImage && (
                          <FluidShapesSVG
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'subtle-lines' && !slide.backgroundImage && (
                          <SubtleGradientLinesSVG
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      {selectedBackground && selectedBackground.value === 'dot-scatter-br' && !slide.backgroundImage && (
                          <DotScatterBottomRightSVG
                              fill={getSVGFillColor()} 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.22 }}
                          />
                      )}
                      <div style={{
                        ...getTextStyle(slide),
                        width: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: index === 0 ? 'flex-start' : 'center',
                        justifyContent: 'center',
                        flexGrow: 1,
                        textAlign: index === 0 ? 'left' : (slide?.textAlign || 'center'),
                        zIndex: 2,
                        position: 'relative',
                        color: slide.backgroundImage ? '#fff' : activeColorPalette.text,
                      }}>
                        {/* Slide 1: Only heading */}
                        {index === 0 && slide.heading && (
                        <InlineTextEditor
                            value={editingHeading && editingHeading.index === index ? editingHeading.rawText : withPeriod(slide.heading)}
                          onEditorFocus={() => {
                            setEditingHeading({ index, rawText: slides[index].heading });
                          }}
                          onEditorRawChange={(rawText) => {
                            if (editingHeading && editingHeading.index === index) {
                              setEditingHeading(current => ({ ...current, rawText }));
                            }
                          }}
                          onEditorBlurWithValue={(rawText) => {
                            const newSlides = [...slides];
                              newSlides[index].heading = rawText;
                            setSlides(newSlides);
                              if(index === 0) setMainTitle(rawText);
                              setEditingHeading(null);
                          }}
                            placeholder={'Add a catchy title...'}
                          align="left"
                            fontSize={(editingHeading && editingHeading.index === index ? editingHeading.rawText : slide.heading).length > 38 ? 32 : 44}
                            fontWeight={400}
                            color={slide.backgroundImage ? '#fff' : activeColorPalette.text}
                            singleLine={true}
                            fontFamily={selectedFontPairing.heading}
                            lineHeight={1.1}
                          />
                        )}
                        {/* Slide 2: Only paragraph */}
                        {index === 1 && slide.paragraph && (
                          <div style={{ marginTop: '10px', width: '100%' }}>
                            <InlineTextEditor
                              value={slide.paragraph}
                              onChange={val => {
                                const newSlides = [...slides];
                                newSlides[index].paragraph = val;
                                setSlides(newSlides);
                                if(index === 1) setMainSubtitle(val);
                              }}
                              placeholder="Add supporting text..."
                              align="left"
                              fontSize={18}
                              fontWeight={400}
                              color={slide.backgroundImage ? '#fff' : activeColorPalette.text}
                              singleLine={false}
                              fontFamily={selectedFontPairing.paragraph}
                              lineHeight={1.3}
                            />
                          </div>
                        )}
                        {/* Slides 3-9: heading + paragraph */}
                        {index > 1 && (
                          <>
                            <InlineTextEditor
                              value={editingHeading && editingHeading.index === index ? editingHeading.rawText : withPeriod(slide.heading)}
                              onEditorFocus={() => {
                                setEditingHeading({ index, rawText: slides[index].heading });
                              }}
                              onEditorRawChange={(rawText) => {
                                if (editingHeading && editingHeading.index === index) {
                                  setEditingHeading(current => ({ ...current, rawText }));
                                }
                              }}
                              onEditorBlurWithValue={(rawText) => {
                                const newSlides = [...slides];
                                newSlides[index].heading = rawText;
                                setSlides(newSlides);
                                setEditingHeading(null);
                              }}
                              placeholder={'Slide Heading'}
                              align="left"
                              fontSize={32}
                          fontWeight={400}
                              color={slide.backgroundImage ? '#fff' : activeColorPalette.text}
                          singleLine={true}
                          fontFamily={selectedFontPairing.heading}
                          lineHeight={1.1}
                        />
                            <div style={{ marginTop: '5px', width: '100%' }}>
                          <InlineTextEditor
                                value={slide.paragraph}
                            onChange={val => {
                              const newSlides = [...slides];
                              newSlides[index].paragraph = val;
                              setSlides(newSlides);
                            }}
                            placeholder="Add supporting text..."
                            align="left"
                                fontSize={16}
                                fontWeight={400}
                                color={slide.backgroundImage ? '#fff' : activeColorPalette.text}
                            singleLine={false}
                            fontFamily={selectedFontPairing.paragraph}
                            lineHeight={1.3}
                          />
                            </div>
                          </>
                        )}
                      </div>
                      <span style={{ position: 'absolute', bottom: 8, right: 12, color: activeColorPalette.text, fontSize: 12, fontWeight: 500, opacity: 0.7, background: 'rgba(0,0,0,0.1)', padding: '1px 5px', borderRadius: '3px' }}>{index + 1} / {slides.length}</span>
                      {index === 0 && (
                        <div style={{
                          ...swipeButtonStyleBase,
                          background: slide.backgroundImage ? '#000' : activeColorPalette.primary,
                          color: slide.backgroundImage ? '#fff' : (
                            selectedColorPaletteKey === 'gradient5'
                                   ? '#4B0082' 
                                   : (selectedColorPaletteKey === 'gradient6' || selectedColorPaletteKey === 'gradient10' || selectedColorPaletteKey === 'gradient14' || selectedColorPaletteKey === 'gradient16') 
                                     ? activeColorPalette.text 
                                     : '#FFFFFF'
                          )
                        }}>
                          Swipe <span style={swipeButtonArrowStyleBase}>→</span>
                        </div>
                      )}
                      {(index === 0 || index === slides.length - 1) && userName && (
                        <div style={{ position: 'absolute', bottom: 25, left: 25, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
                          {userHeadshot && (
                            <img src={userHeadshot} alt={userName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${slide.backgroundImage ? '#000' : activeColorPalette.primary}` }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: slide.backgroundImage ? '#fff' : activeColorPalette.text }}>{userName}</div>
                            {userEmail && (
                              <div style={{ fontSize: 12, color: slide.backgroundImage ? '#fff' : activeColorPalette.text, opacity: 0.8 }}>{userEmail}</div>
                            )}
                          </div>
                      </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* === Carousel History Section === */}
            <div style={{ maxWidth: 1100, margin: '2rem auto 0 auto' }}>
              <CarouselHistoryTable
                carousels={carouselHistory}
                isLoading={isHistoryLoading}
                onView={item => {
                  setSelectedCarousel(item.carouselData);
                  setIsPreviewModalOpen(true);
                }}
                onDelete={handleDeleteCarousel}
                deletingId={deletingId}
                selectedCarouselIds={selectedCarouselIds}
                onSelectCarousel={handleSelectCarousel}
                onSelectAllCarousels={handleSelectAllCarousels}
                onDeleteSelected={handleDeleteSelectedCarousels}
                selectedCount={selectedCarouselIds.length}
                isBulkDeleting={isBulkDeleting}
              />
              <ConfirmationModal
                isOpen={showDeleteConfirmation}
                onCancel={cancelDeleteCarousel}
                onConfirm={confirmDeleteCarousel}
                title="Delete Carousel"
                message="Are you sure you want to delete this carousel? This action cannot be undone."
                isLoading={!!deletingId}
              />
              <ConfirmationModal
                isOpen={showDeleteSelectedConfirmation}
                onCancel={cancelDeleteSelectedCarousels}
                onConfirm={confirmDeleteSelectedCarousels}
                title="Delete Selected Carousels"
                message={`Are you sure you want to delete ${selectedCarouselIds.length} selected carousel(s)? This action cannot be undone.`}
                isLoading={isBulkDeleting}
              />
              <CarouselPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                carouselData={selectedCarousel}
              />
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
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        {slides.map((slide, index) => (
          <div key={index} ref={el => exportSlideRefs.current[index] = el}>
            <ExportSlide
              slide={slide}
              index={index}
              userName={userName}
              userEmail={userEmail}
              userHeadshot={userHeadshot}
              activeColorPalette={activeColorPalette}
              selectedBackground={selectedBackground}
              selectedFontPairing={selectedFontPairing}
              slidesLength={slides.length}
              showSlideCounter={false}
              selectedColorPaletteKey={selectedColorPaletteKey}
            />
          </div>
        ))}
      </div>
      <CarouselLoadingModal
        isOpen={showLoadingModal}
        onClose={() => setShowLoadingModal(false)}
        currentStepIndex={loadingStepIndex}
        error={loadingError}
        slideProgress={slideProgress}
        onCancel={() => setShowLoadingModal(false)}
      />
      {/* Preload all font pairings for dom-to-image reliability */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        {FONT_PAIRINGS.map(pair => (
          <span key={pair.label} style={{ fontFamily: `${pair.heading}, ${pair.paragraph}, sans-serif` }}>
            The quick brown fox jumps over the lazy dog.
          </span>
        ))}
      </div>
      {isVideoModalOpen && (
        <Modal isOpen={isVideoModalOpen} onClose={closeVideoModal} title="How to Use the Carousel Generator">
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
                src="https://player.vimeo.com/video/1039549847?autoplay=1"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Carousel Generator Tutorial"
              ></iframe>
            </div>
          </div>
        </Modal>
      )}
      {pixabayModalOpen && (
        <Modal isOpen={pixabayModalOpen} onClose={() => setPixabayModalOpen(false)} title="Select Background Image from Pixabay">
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <div style={{ display: 'flex', marginBottom: '12px', gap: '8px' }}>
              <input
                type="text"
                value={pixabaySearch}
                onChange={e => setPixabaySearch(e.target.value)}
                placeholder="Search images (e.g. property, modern house)"
                style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                onKeyDown={e => { if (e.key === 'Enter') searchPixabay(pixabaySearch); }}
              />
              <Button onClick={() => searchPixabay(pixabaySearch)} style={{ padding: '0 20px' }}>Search</Button>
            </div>
            
            {pixabayError && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{pixabayError}</div>}

            {/* Scrollable Image Grid */}
            <div 
              style={{
                flexGrow: 1, 
                overflowY: 'auto', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: '10px', 
                paddingBottom: '10px' // Space for load more button or loading indicator
              }}
            >
              {pixabayResults.map(hit => (
                <img
                  key={hit.id}
                  src={hit.webformatURL} 
                  alt={hit.tags || 'Pixabay image'} 
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '2px solid transparent' }}
                  onClick={() => {
                    if (pixabayTargetSlide !== null) {
                      setSlides(prev => prev.map((slide, idx) => 
                        idx === pixabayTargetSlide 
                          ? { ...slide, backgroundImage: hit.largeImageURL, backgroundImagePosition: 'center center' } 
                          : slide
                      ));
                      setPixabayModalOpen(false);
                    }
                  }}
                />
              ))}
              {/* Initial Loading State (centered) */}
              {pixabayLoading && pixabayResults.length === 0 && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '200px' }}>
                  Loading images...
                </div>
              )}
              {/* Loading More Indicator (at the bottom of the grid, subtle) */}
              {pixabayIsLoadingMore && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10px', fontSize: '14px', color: '#555' }}>
                  Loading more images...
                </div>
              )}
              {/* Load More Button */}
              {!pixabayLoading && !pixabayIsLoadingMore && pixabayResults.length > 0 && pixabayResults.length < pixabayTotalHits && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '10px' }}>
                  <Button 
                    onClick={() => searchPixabay(pixabaySearch, true)} 
                    style={{ background: '#e9ecef', color: '#495057', border: '1px solid #ced4da', padding: '10px 20px'}}
                  >
                    Load More Images ({pixabayResults.length} / {pixabayTotalHits})
                  </Button>
                </div>
              )}
              {/* No results found message */}
              {!pixabayLoading && !pixabayIsLoadingMore && pixabayResults.length === 0 && pixabaySearch.trim() !== '' && (
                 <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', fontSize: '16px', color: '#555' }}>
                  No images found for "{pixabaySearch}". Try a different search term.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
      <style jsx>{`
        .dashboard-header { text-align: center; margin-bottom: 2rem; }
        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 3rem;
          font-weight: 900;
          color: #111;
        }
        .subtitle { line-height: 1.5; font-size: 1.2rem; margin: 1rem 0 1.5rem; color: #333; }
      `}</style>
      <ConfirmationModal
        isOpen={paletteWarningModal.open}
        onCancel={cancelPaletteSelection}
        onConfirm={confirmPaletteSelection}
        title="Change Theme Palette"
        message="Changing the color palette will remove all currently set background images. Are you sure you want to continue?"
        confirmText="Yes, Change Palette"
        cancelText="No, Keep Images"
      />
    </ProtectedRoute>
  );
} 