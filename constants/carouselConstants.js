// Carousel Generator Constants & Configs

// Color Palettes
export const PREDEFINED_COLOR_PALETTES = {
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
  'palette13': { name: 'Deep Indigo', primary: '#4B0082', secondary: '#7B68EE', background: '#E6E6FA', text: '#4B0082' },
  'palette14': { name: 'Coral Pink', primary: '#FF7F50', secondary: '#FFEFD5', background: '#FFF8DC', text: '#8B4513' },
  'palette15': { name: 'Sky Blue', primary: '#87CEEB', secondary: '#F0F8FF', background: '#E6F7FF', text: '#003366' },
  'palette16': { name: 'Olive Drab', primary: '#6B8E23', secondary: '#FFFFE0', background: '#F5F5DC', text: '#556B2F' },
  'palette17': { name: 'Maroon Velvet', primary: '#800000', secondary: '#FFE4E1', background: '#FFF0F5', text: '#800000' },
  'palette18': { name: 'Slate Gray', primary: '#708090', secondary: '#D3D3D3', background: '#F5F5F5', text: '#2F4F4F' },
  'palette19': { name: 'Electric Lime', primary: '#AEFF00', secondary: '#F0FFF0', background: '#FFFFF0', text: '#385400' },
  'palette20': { name: 'Hot Pink', primary: '#FF69B4', secondary: '#FFB6C1', background: '#FFF0F5', text: '#8B0A50' },
  'palette21': { name: 'Ocean Deep', primary: '#191970', secondary: '#B0C4DE', background: '#F0F8FF', text: '#191970' },
  'palette22': { name: 'Terracotta', primary: '#E2725B', secondary: '#FFE4C4', background: '#FAF0E6', text: '#8B4513' },
  'palette23': { name: 'Emerald City', primary: '#2E8B57', secondary: '#98FB98', background: '#F0FFF0', text: '#2E8B57' },
  'palette24': { name: 'Cool Stone', primary: '#A9A9A9', secondary: '#E0E0E0', background: '#F8F8F8', text: '#404040' },
  'palette25': { name: 'Mustard Field', primary: '#FFDB58', secondary: '#FFF8DC', background: '#FFFFF0', text: '#8B4513' },
  'palette26': { name: 'Dusty Rose', primary: '#D8BFD8', secondary: '#FFE4E1', background: '#FAF0E6', text: '#8B4513' },
  'palette27': { name: 'Midnight Blue', primary: '#2C3E50', secondary: '#BDC3C7', background: '#ECF0F1', text: '#2C3E50' },
  'palette28': { name: 'Sage Green', primary: '#8FBC8F', secondary: '#F0FFF0', background: '#F5F5F5', text: '#2F4F2F' },
  'palette29': { name: 'Burnt Sienna', primary: '#E97451', secondary: '#FFE4C4', background: '#FFF5EE', text: '#8B4513' },
  'palette30': { name: 'Periwinkle', primary: '#CCCCFF', secondary: '#E6E6FA', background: '#F0F8FF', text: '#483D8B' },
  'palette31': { name: 'Forest Floor', primary: '#556B2F', secondary: '#F5F5DC', background: '#FAF0E6', text: '#556B2F' },
  'palette32': { name: 'Lilac Haze', primary: '#C8A2C8', secondary: '#E6E6FA', background: '#FFF0F5', text: '#483D8B' },
  'palette33': { name: 'Robin Egg Blue', primary: '#00CCCC', secondary: '#E0FFFF', background: '#F0FFFF', text: '#004D4D' },
  'palette34': { name: 'Clay Brown', primary: '#B87333', secondary: '#FFEBCD', background: '#FAF0E6', text: '#B87333' },
  'palette35': { name: 'Seafoam Green', primary: '#98FB98', secondary: '#F0FFF0', background: '#F5FFFA', text: '#2E8B57' },
  'palette36': { name: 'Plum Perfect', primary: '#8E4585', secondary: '#DDA0DD', background: '#F3E5F5', text: '#8E4585' },
  'palette37': { name: 'Desert Sun', primary: '#FFCC33', secondary: '#FFF8DC', background: '#FFFACD', text: '#8B4513' },
  'palette38': { name: 'Arctic White', primary: '#778899', secondary: '#E6E6FA', background: '#F8F8FF', text: '#2F4F4F' },
  'palette39': { name: 'Citrus Burst', primary: '#FFA500', secondary: '#FFFACD', background: '#FFF8E1', text: '#B85C00' },
  'palette40': { name: 'Deep Teal', primary: '#006D77', secondary: '#83C5BE', background: '#EDF6F9', text: '#003840' },
  'palette41': { name: 'Berry Smoothie', primary: '#8B5CF6', secondary: '#FBCFE8', background: '#F3E8FF', text: '#4B006E' },
  'palette42': { name: 'Sunset Coral', primary: '#FF6F61', secondary: '#FFD6C0', background: '#FFF3E6', text: '#B23A48' },
  'palette43': { name: 'Mint Mojito', primary: '#2EC4B6', secondary: '#CBF3F0', background: '#E0FCF9', text: '#145A5A' },
  'palette44': { name: 'Golden Hour', primary: '#FFD700', secondary: '#FFF9C4', background: '#FFFDE7', text: '#7C6F00' },
  'palette45': { name: 'Blush Pink', primary: '#FFB7B2', secondary: '#FFE0E9', background: '#FFF5F7', text: '#A14A5A' },
  'palette46': { name: 'Olive Grove', primary: '#708238', secondary: '#C9D8B6', background: '#F6F8E2', text: '#3B4A1A' },
  'palette47': { name: 'Steel & Sand', primary: '#495867', secondary: '#C9C9C9', background: '#F7F7FF', text: '#22223B' },
  'palette48': { name: 'Aqua Pop', primary: '#00B4D8', secondary: '#90E0EF', background: '#CAF0F8', text: '#023E8A' },
  'gradient1': {
    name: 'Sunset Fade',
    primary: '#FF8C00', // Dark Orange
    secondary: '#8A2BE2', // Blue Violet
    angle: 'to right',
    background: '#FFF5EE', // Seashell (for text contrast or fallback)
    text: '#FFFFFF',
    isGradient: true
  },
  'gradient2': {
    name: 'Ocean Breeze',
    primary: '#87CEEB', // Sky Blue
    secondary: '#008080', // Teal
    angle: 'to bottom right',
    background: '#E0FFFF', // Light Cyan (for text contrast or fallback)
    text: '#000000',
    isGradient: true
  },
  'gradient3': {
    name: 'Lush Meadow',
    primary: '#90EE90', // Light Green
    secondary: '#006400', // Dark Green
    angle: '45deg',
    background: '#F0FFF0', // Honeydew (for text contrast or fallback)
    text: '#FFFFFF',
    isGradient: true
  },
  'gradient4': {
    name: 'Ruby Glow',
    primary: '#FFC0CB', // Pink
    secondary: '#DC143C', // Crimson
    angle: 'to top left',
    background: '#FFF0F5', // Lavender Blush (for text contrast or fallback)
    text: '#FFFFFF',
    isGradient: true
  },
  'gradient5': {
    name: 'Purple Dream',
    primary: '#E6E6FA', // Lavender
    secondary: '#4B0082', // Indigo
    angle: '120deg',
    background: '#F3E5F5', // Light Purple Background
    text: '#FFFFFF',
    isGradient: true
  },
  'gradient6': {
    name: 'Sunny Citrus',
    primary: '#FFFACD', // Lemon Chiffon
    secondary: '#FF7F50', // Coral
    angle: 'to bottom',
    background: '#FFFFF0', // Ivory Background
    text: '#A0522D', // Sienna Text
    isGradient: true
  },
  'gradient7': { name: 'Skyline Glow', primary: '#A7D8E1', secondary: '#E0BBE4', angle: '135deg', background: '#F0F8FF', text: '#333333', isGradient: true },
  'gradient8': { name: 'Minty Fresh', primary: '#A1FFCE', secondary: '#47D1B8', angle: 'to right', background: '#F0FFF0', text: '#FFFFFF', isGradient: true },
  'gradient9': { name: 'Coral Kiss', primary: '#FFAB91', secondary: '#FFDAC1', angle: 'to bottom left', background: '#FFF5EE', text: '#5D4037', isGradient: true },
  'gradient10': { name: 'Lemon Zest', primary: '#FFF9C4', secondary: '#D4EE9F', angle: '75deg', background: '#FFFFF0', text: '#424242', isGradient: true },
  'gradient11': { name: 'Lavender Haze', primary: '#D1C4E9', secondary: '#B39DDB', angle: 'to top right', background: '#F3E5F5', text: '#311B92', isGradient: true },
  'gradient12': { name: 'Rose Gold Tint', primary: '#F8BBD0', secondary: '#FFECB3', angle: 'to right', background: '#FFF8E1', text: '#6D4C41', isGradient: true },
  'gradient13': { name: 'Aqua Marine', primary: '#A0E7E5', secondary: '#4BC0C8', angle: 'to bottom', background: '#E0FFFF', text: '#FFFFFF', isGradient: true },
  'gradient14': { name: 'Peachy Keen', primary: '#FFDAB9', secondary: '#FFA07A', angle: '30deg', background: '#FFF5EE', text: '#8B4513', isGradient: true },
  'gradient15': { name: 'Soft Lilac', primary: '#E1BEE7', secondary: '#CE93D8', angle: 'to bottom right', background: '#F3E5F5', text: '#2F4F4F', isGradient: true },
  'gradient16': { name: 'Spring Dew', primary: '#C8E6C9', secondary: '#81D4FA', angle: '160deg', background: '#E8F5E9', text: '#004D40', isGradient: true },
  'gradient17': { name: 'Midnight Bloom (Dark)', primary: '#300047', secondary: '#8C004B', angle: 'to right', background: '#1A001A', text: '#E0E0E0', isGradient: true },
  'gradient18': { name: 'Forest Night (Dark)', primary: '#003300', secondary: '#1B5E20', angle: '135deg', background: '#001A00', text: '#B2DFDB', isGradient: true },
  'gradient19': { name: 'Charcoal Flame (Dark)', primary: '#263238', secondary: '#D84315', angle: 'to bottom left', background: '#1C1C1C', text: '#F5F5F5', isGradient: true },
  'gradient20': { name: 'Deep Space (Dark)', primary: '#0D0C30', secondary: '#300060', angle: '45deg', background: '#000015', text: '#ADD8E6', isGradient: true },
  'gradient21': { name: 'Velvet Twilight (Dark)', primary: '#2E1A47', secondary: '#1C3A5E', angle: 'to top right', background: '#100C20', text: '#FFD700', isGradient: true }
};

// Background Designs
export const BACKGROUND_DESIGNS = [
  { label: 'None', value: 'none' },
  { label: 'Blop', value: 'blop' },
  { label: 'Circles', value: 'circles' },
  { label: 'Top Dots', value: 'top dots' },
  { label: 'Waves', value: 'waves' },
  { label: 'Abstract Blob', value: 'abstract-blob' },
  { label: 'Fluid Shapes', value: 'fluid-shapes' },
  { label: 'Subtle Lines', value: 'subtle-lines' },
  { label: 'Bottom-Right Dot Scatter', value: 'dot-scatter-br' },
];

// Content Themes
export const CONTENT_THEMES = [
  'First-Time Buyer Guides',
  'Home Selling Advice',
  'Renting Advice',
  'Property Investment Advice',
  'Local Area Guides',
  'Living Here (Lifestyle)',
  'Things to Do',
  'Cost-Saving Tips',
  'Commuting Guides',
  'Mistakes to Avoid',
  'Process Explained',
  'Home Maintenance Advice',
];

// Tone Styles
export const TONE_STYLES = [
  'FOMO & Curiosity (Evokes urgency/intrigue)',
  'Emotional Pain Point (Addresses frustrations/desires)',
  'Red Flags & Cautionary (Warns about pitfalls)',
  'Insider Knowledge & Tips (Offers exclusive advice)',
  'Cost Saving & Value Driven (Highlights financial benefits)',
  'Drama (Emphasizes high stakes/impact)',
  'Controversy (Challenges common beliefs)',
  'Personal Relatability (Shares relatable experiences)',
  'Empathetic & Understanding (Shows compassion/support)',
  'Problem/Solution (Benefit-Oriented)',
];

// Default Tone Style
export const DEFAULT_TONE_STYLE = 'Problem/Solution (Benefit-Oriented)';

// Local Focus (NEW - Content Angles)
export const LOCAL_FOCUS = [
  'General Overview',
  'Top-Rated Schools',
  'Parks & Green Spaces',
  'Community Events & Activities',
  'Historic Landmarks & Heritage',
  'Public Transport & Commutability',
  'Family-Friendly Amenities',
  'Local Businesses Spotlight',
  'Unique Architecture',
  'Dining Scene (Restaurants, Cafes)',
  'Shopping Hotspots',
  'Arts & Culture Scene',
  'Nightlife & Entertainment',
  'Health & Wellness Resources',
  'Pet-Friendly Features'
];

// Audience Appeal
export const AUDIENCE_APPEAL = [
  'First-time Buyers',
  'Homeowners',
  'Sellers',
  'Renters',
  'Investors',
  'Locals',
  'Relocators',
  'Upsizers / Downsizers',
  'General Public',
];

// Local Focus Themes (NEW - determines when Local Focus dropdown appears)
export const LOCAL_FOCUS_THEMES = [
  'Local Area Guides',
  'Living Here (Lifestyle)',
  'Things to Do',
  'Property Investment Advice',
  'First-Time Buyer Guides',
  'Home Selling Advice',
  'Renting Advice'
];

// Audience Appeal Map
export const AUDIENCE_APPEAL_MAP = {
  'First-Time Buyer Guides': ['First-time Buyers', 'Relocators', 'Renters', 'General Public'],
  'Home Selling Advice': ['Sellers', 'Homeowners', 'Upsizers / Downsizers', 'Locals', 'General Public'],
  'Renting Advice': ['Renters', 'Relocators', 'Locals', 'General Public'],
  'Property Investment Advice': ['Investors', 'Homeowners', 'Sellers', 'Locals', 'Relocators', 'General Public'],
  'Local Area Guides': ['Locals', 'Relocators', 'First-time Buyers', 'Renters', 'Investors', 'Homeowners', 'Upsizers / Downsizers', 'General Public'],
  'Living Here (Lifestyle)': ['Locals', 'Relocators', 'Renters', 'Homeowners', 'General Public'],
  'Things to Do': ['Locals', 'Relocators', 'Renters', 'Homeowners', 'General Public'],
  'Cost of Living Breakdown': ['Relocators', 'Renters', 'First-time Buyers', 'Locals', 'Investors', 'General Public'],
  'Commuting Guides': ['Relocators', 'Locals', 'Renters', 'Homeowners', 'General Public'],
  'Mistakes to Avoid': ['First-time Buyers', 'Sellers', 'Renters', 'Investors', 'Homeowners', 'Upsizers / Downsizers', 'General Public'],
  'Process Explained': ['First-time Buyers', 'Sellers', 'Renters', 'Investors', 'Relocators', 'General Public'],
  'Home Maintenance Advice': ['Homeowners', 'Locals', 'General Public'],
};

// Font Pairings
export const FONT_PAIRINGS = [
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

// Default Font Pairing
export const DEFAULT_FONT_PAIRING = FONT_PAIRINGS.find(f => f.label === 'Della Respira + Open Sans') || FONT_PAIRINGS[0];

// Default Background Design
export const DEFAULT_BACKGROUND_DESIGN = 'top dots';

// Default Color Palette Key
export const DEFAULT_COLOR_PALETTE_KEY = 'gradient18'; 