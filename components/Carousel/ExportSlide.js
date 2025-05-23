import React from 'react';
import BlopSVG from '../BackgroundSvgs/BlopSVG';
import CirclesSVG from '../BackgroundSvgs/CirclesSVG';
import TopDotsSVG from '../BackgroundSvgs/TopDotsSVG';
import WavesSVG from '../BackgroundSvgs/WavesSVG';
import AbstractBlobSVG from '../BackgroundSvgs/AbstractBlobSVG';
import FluidShapesSVG from '../BackgroundSvgs/FluidShapesSVG';
import SubtleGradientLinesSVG from '../BackgroundSvgs/SubtleGradientLinesSVG';
import DotScatterBottomRightSVG from '../BackgroundSvgs/DotScatterBottomRightSVG';

// Helper to ensure heading ends with a period
function withPeriod(text) {
  if (!text) return '';
  const trimmed = text.trim();
  // If ends with ., !, ?, …, or ... do not add a period
  if (/[.!?…]$/.test(trimmed) || trimmed.endsWith('...')) return trimmed;
  return trimmed + '.';
}

// --- ExportSlide: Hidden export version for PNG generation ---
export default function ExportSlide({ slide, index, userName, userEmail, userHeadshot, activeColorPalette, selectedBackground, selectedFontPairing, slidesLength, showSlideCounter = true, selectedColorPaletteKey }) {
  const scale = 2.4;

  const SVGBackground = () => {
    if (!selectedBackground || slide.backgroundImage) return null; // Do not render if a slide BG image exists
    const fillColor = activeColorPalette.isGradient ? activeColorPalette.text : activeColorPalette.primary;
    const style = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2, pointerEvents: 'none', opacity: 0.5 }; // zIndex 2 to be above image overlay
    
    if (selectedBackground.value === 'blop') return <BlopSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'circles') return <CirclesSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'top dots') return <TopDotsSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'waves') return <WavesSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'abstract-blob') return <AbstractBlobSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'fluid-shapes') return <FluidShapesSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'subtle-lines') return <SubtleGradientLinesSVG fill={fillColor} style={style} />;
    if (selectedBackground.value === 'dot-scatter-br') return <DotScatterBottomRightSVG fill={fillColor} style={style} />;
    return null;
  };

  const editorHeadingFontSize = index === 0 ? (slide.heading.length > 38 ? 32 : 44) : 32;
  const editorParagraphFontSize = 16;

  const headingStyle = {
    fontSize: (editorHeadingFontSize * scale) + 'px',
    fontWeight: slide.fontWeight || 'bold',
    color: slide.backgroundImage ? '#fff' : activeColorPalette.text, // White text if BG image
    fontFamily: selectedFontPairing.heading + ', sans-serif',
    lineHeight: 1.1,
    display: 'block',
    wordBreak: 'break-word',
    textAlign: slide.textAlign || (index === 0 ? 'left' : 'center'),
    fontStyle: slide.fontStyle || 'normal',
    textDecoration: slide.textDecoration || 'none',
    textShadow: slide.textEffect === 'shadow' ? '0 5px 20px rgba(0,0,0,0.15)' : 'none',
    width: '100%',
  };

  const paragraphStyle = {
    fontSize: (editorParagraphFontSize * scale) + 'px',
    fontWeight: 400, 
    color: slide.backgroundImage ? '#fff' : activeColorPalette.text, // White text if BG image
    fontFamily: selectedFontPairing.paragraph + ', sans-serif',
    lineHeight: 1.4,
    display: 'block',
    wordBreak: 'break-word',
    textAlign: slide.textAlign || (index === 0 ? 'left' : 'center'),
    fontStyle: slide.paragraphFontStyle || 'normal',
    textDecoration: slide.paragraphTextDecoration || 'none',
    textShadow: slide.paragraphTextEffect === 'shadow' ? '0 5px 20px rgba(0,0,0,0.15)' : 'none',
    width: '100%',
    marginTop: (10 * scale) + 'px',
  };

  const textAlignValueForContainer = slide.textAlign || (index === 0 ? 'left' : 'center');
  const alignItemsValueForContainer = textAlignValueForContainer === 'left' ? 'flex-start' : (textAlignValueForContainer === 'right' ? 'flex-end' : 'center');

  // Scaled swipe button styles
  const swipeButtonStyleBase = {
    position: 'absolute',
    bottom: 48,
    right: 25,
    background: undefined, // Will be set by activeColorPalette.primary
    color: '#fff', // Default color, will be overridden conditionally
    borderRadius: 12, // Matched from carouselStyles.js
    paddingTop: 4,    // Derived from padding: '4px 9px'
    paddingBottom: 4, // Derived from padding: '4px 9px'
    paddingLeft: 9,   // Derived from padding: '4px 9px'
    paddingRight: 9,  // Derived from padding: '4px 9px'
    fontWeight: 600,
    fontSize: 12,     // Matched from carouselStyles.js
    lineHeight: 1.1,  // Matched from carouselStyles.js
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,           // Matched from carouselStyles.js
    zIndex: 3,
    border: 'none',     // Matched from carouselStyles.js
    // cursor and transition are omitted as they are not relevant for static image export
  };

  const swipeButtonArrowStyleBase = {
    fontSize: 13,    // Matched from carouselStyles.js
    marginLeft: 2,   // Matched from carouselStyles.js
  };

  const scaledSwipeButtonStyle = {
    ...swipeButtonStyleBase,
    background: slide.backgroundImage ? '#000' : activeColorPalette.primary,
    color: slide.backgroundImage ? '#fff' : (
      selectedColorPaletteKey === 'gradient5' 
             ? '#4B0082' 
             : (selectedColorPaletteKey === 'gradient6' || selectedColorPaletteKey === 'gradient10' || selectedColorPaletteKey === 'gradient14' || selectedColorPaletteKey === 'gradient16') 
               ? activeColorPalette.text 
               : '#FFFFFF'),
    bottom: swipeButtonStyleBase.bottom * scale,
    right: swipeButtonStyleBase.right * scale,
    borderRadius: swipeButtonStyleBase.borderRadius * scale,
    paddingTop: swipeButtonStyleBase.paddingTop * scale,
    paddingBottom: swipeButtonStyleBase.paddingBottom * scale,
    paddingLeft: swipeButtonStyleBase.paddingLeft * scale,
    paddingRight: swipeButtonStyleBase.paddingRight * scale,
    fontSize: swipeButtonStyleBase.fontSize * scale,
    gap: swipeButtonStyleBase.gap * scale,
  };

  const scaledSwipeButtonArrowStyle = {
    ...swipeButtonArrowStyleBase,
    fontSize: swipeButtonArrowStyleBase.fontSize * scale,
    marginLeft: swipeButtonArrowStyleBase.marginLeft * scale,
  };

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background: slide.backgroundImage ? 'transparent' : (
          activeColorPalette.isGradient
            ? `linear-gradient(${activeColorPalette.angle || 'to bottom'}, ${activeColorPalette.primary}, ${activeColorPalette.secondary})`
            : activeColorPalette.background
        ),
        color: slide.backgroundImage ? '#fff' : activeColorPalette.text, // Default text color if BG image
        borderRadius: 6 * scale,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: slide.backgroundImage ? 0 : 25 * scale, // Remove padding if image is present for edge-to-edge look
        boxSizing: 'border-box',
      }}
      className="export-slide-root"
    >
      {/* Background Image Layer - Replaced <img> with a div for better export rendering */}
      {slide.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${slide.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: slide.backgroundImagePosition || 'center center',
            zIndex: 0
          }}
        />
      )}
      {/* Dark Overlay for Background Image */}
      {slide.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.55)', // Matches preview overlay
            zIndex: 1
          }}
        />
      )}
      <SVGBackground />
      <div style={{
        width: slide.backgroundImage ? '100%' : '92%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: alignItemsValueForContainer,
        justifyContent: 'center',
        flexGrow: 1,
        textAlign: textAlignValueForContainer,
        zIndex: 2, // Ensure text content is above overlay and SVG background
        position: 'relative', // Ensure stacking context
        padding: slide.backgroundImage ? `${48 * scale}px ${60 * scale}px ${48 * scale}px ${60 * scale}px` : 0, // Add some breathing room for text if image
      }}>
        {/* Always render heading, even if background image is present */}
        <div style={headingStyle}>{withPeriod(slide.heading)}</div>
        {index !== 0 && slide.paragraph && (
          <div style={paragraphStyle}>{slide.paragraph}</div>
        )}
      </div>
      {(index === 0 || index === slidesLength - 1) && userName && (
        <div style={{ position: 'absolute', bottom: 60, left: 60, display: 'flex', alignItems: 'center', gap: 24, zIndex: 2 }}>
          {userHeadshot && (
            <img src={userHeadshot} alt={userName} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${slide.backgroundImage ? '#000' : activeColorPalette.primary}` }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: slide.backgroundImage ? '#fff' : activeColorPalette.text }}>{userName}</div>
            {userEmail && (
              <div style={{ fontSize: 24, color: slide.backgroundImage ? '#fff' : activeColorPalette.text, opacity: 0.8 }}>{userEmail}</div>
            )}
          </div>
        </div>
      )}
      {index === 0 && (
        <div style={scaledSwipeButtonStyle}>
          Swipe <span style={scaledSwipeButtonArrowStyle}>→</span>
        </div>
      )}
      {showSlideCounter && (
        <span style={{ position: 'absolute', bottom: 60, right: 60, color: slide.backgroundImage ? '#fff' : activeColorPalette.text, fontSize: 28, fontWeight: 600, opacity: 0.7, background: 'rgba(0,0,0,0.08)', padding: '6px 18px', borderRadius: '8px', zIndex: 2 }}>{index + 1} / {slidesLength}</span>
      )}
    </div>
  );
} 