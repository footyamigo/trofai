export const swipeButtonStyleBase = {
  position: 'absolute',
  bottom: 48, // moved up to avoid overlap with slide counter
  right: 25,
  background: undefined, // Will be set by activeColorPalette.primary
  color: '#fff',
  borderRadius: 12, // smaller radius
  padding: '4px 9px', // half the previous padding
  fontWeight: 600,
  fontSize: 12, // smaller font
  lineHeight: 1.1,
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  zIndex: 3,
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
};

export const swipeButtonArrowStyleBase = {
  fontSize: 13, // smaller arrow
  marginLeft: 2,
}; 