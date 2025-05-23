import React from 'react';
import BlopSVG from '../components/BackgroundSvgs/BlopSVG';
import CirclesSVG from '../components/BackgroundSvgs/CirclesSVG';
import TopDotsSVG from '../components/BackgroundSvgs/TopDotsSVG';

// Helper to ensure heading ends with a period
function withPeriod(text) {
  if (!text) return '';
  const trimmed = text.trim();
  if (/[.!?…]$/.test(trimmed) || trimmed.endsWith('...')) return trimmed;
  return trimmed + '.';
}

const BACKGROUND_SVGS = {
  blop: BlopSVG,
  circles: CirclesSVG,
  'top dots': TopDotsSVG,
};

export default function ExportSlidePage({
  heading = '',
  paragraph = '',
  userName = '',
  userEmail = '',
  userHeadshot = '',
  background = '#fff8f0',
  textColor = '#222',
  primaryColor = '#DE3163',
  backgroundDesign = '',
  fontHeading = 'DM Serif Display',
  fontParagraph = 'DM Sans',
  index = 0,
  slidesLength = 1,
}) {
  const SVGComponent = BACKGROUND_SVGS[backgroundDesign] || null;
  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        background,
        color: textColor,
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        boxSizing: 'border-box',
        fontFamily: fontHeading + ', sans-serif',
      }}
    >
      {SVGComponent && <SVGComponent fill={primaryColor} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none', opacity: 0.25 }} />}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: index === 0 ? 'flex-start' : 'center',
        justifyContent: 'center',
        flexGrow: 1,
        textAlign: index === 0 ? 'left' : 'center',
        zIndex: 1,
      }}>
        <span
          style={{
            fontSize: index === 0 ? (heading.length > 38 ? 80 : 110) : 80,
            fontWeight: 'bold',
            color: primaryColor,
            fontFamily: fontHeading + ', sans-serif',
            lineHeight: 1.1,
            marginBottom: 40,
            display: 'block',
            wordBreak: 'break-word',
          }}
        >
          {withPeriod(heading)}
        </span>
        {index !== 0 && (
          <span
            style={{
              fontSize: 38,
              fontWeight: 'normal',
              color: textColor,
              fontFamily: fontParagraph + ', sans-serif',
              lineHeight: 1.3,
              marginTop: 10,
              display: 'block',
              wordBreak: 'break-word',
            }}
          >
            {paragraph}
          </span>
        )}
      </div>
      {/* Profile and badge */}
      {(index === 0 || index === slidesLength - 1) && userName && (
        <div style={{ position: 'absolute', bottom: 60, left: 60, display: 'flex', alignItems: 'center', gap: 24, zIndex: 2 }}>
          {userHeadshot && (
            <img src={userHeadshot} alt={userName} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${primaryColor}` }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 32, color: textColor }}>{userName}</div>
            {userEmail && (
              <div style={{ fontSize: 24, color: textColor, opacity: 0.8 }}>{userEmail}</div>
            )}
          </div>
        </div>
      )}
      {/* Swipe badge */}
      {index === 0 && (
        <div style={{ position: 'absolute', bottom: 120, right: 60, background: primaryColor, color: '#fff', borderRadius: 40, padding: '18px 48px', fontWeight: 700, fontSize: 38, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 3 }}>
          Swipe <span style={{ fontSize: 44 }}>→</span>
        </div>
      )}
      {/* No slide counter! */}
    </div>
  );
}

// Next.js SSR: getServerSideProps to accept query params
export async function getServerSideProps(context) {
  const {
    heading = '',
    paragraph = '',
    userName = '',
    userEmail = '',
    userHeadshot = '',
    background = '#fff8f0',
    textColor = '#222',
    primaryColor = '#DE3163',
    backgroundDesign = '',
    fontHeading = 'DM Serif Display',
    fontParagraph = 'DM Sans',
    index = 0,
    slidesLength = 1,
  } = context.query;
  return {
    props: {
      heading,
      paragraph,
      userName,
      userEmail,
      userHeadshot,
      background,
      textColor,
      primaryColor,
      backgroundDesign,
      fontHeading,
      fontParagraph,
      index: Number(index),
      slidesLength: Number(slidesLength),
    },
  };
} 