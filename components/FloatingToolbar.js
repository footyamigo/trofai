import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function FloatingToolbar({ editor }) {
  const toolbarRef = useRef(null);
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editor.isFocused) {
        setShow(false);
        return;
      }
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY - 48, // 48px above selection
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setShow(true);
    };

    editor.on('selectionUpdate', updateToolbar);
    editor.on('focus', updateToolbar);
    editor.on('blur', () => setShow(false));

    return () => {
      editor.off('selectionUpdate', updateToolbar);
      editor.off('focus', updateToolbar);
      editor.off('blur', () => setShow(false));
    };
  }, [editor]);

  if (!editor || !show) return null;

  // Modern button style
  const buttonStyle = isActive => ({
    border: 'none',
    background: isActive ? '#f3f4f6' : 'transparent',
    color: '#222',
    borderRadius: 6,
    padding: '5px 10px',
    fontWeight: 600,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
    outline: 'none',
    transition: 'background 0.15s, box-shadow 0.15s',
    margin: 0,
    lineHeight: 1.1,
  });

  return createPortal(
    <div
      ref={toolbarRef}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        transform: 'translate(-50%, -100%)',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        padding: '7px 12px',
        zIndex: 2000,
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        minHeight: 36,
      }}
    >
      <button
        title="Bold"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        style={buttonStyle(editor.isActive('bold'))}
      >B</button>
      <button
        title="Italic"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        style={{ ...buttonStyle(editor.isActive('italic')), fontStyle: 'italic' }}
      >I</button>
      <button
        title="Underline"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
        style={{ ...buttonStyle(editor.isActive('underline')), textDecoration: 'underline' }}
      >U</button>
      <button
        title="Align Left"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run(); }}
        style={buttonStyle(editor.isActive({ textAlign: 'left' }))}
      >
        {/* Left Align SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="8" height="2" rx="1" fill="currentColor"/><rect x="3" y="13" width="12" height="2" rx="1" fill="currentColor"/></svg>
      </button>
      <button
        title="Align Center"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run(); }}
        style={buttonStyle(editor.isActive({ textAlign: 'center' }))}
      >
        {/* Center Align SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="5" width="12" height="2" rx="1" fill="currentColor"/><rect x="6" y="9" width="8" height="2" rx="1" fill="currentColor"/><rect x="5" y="13" width="10" height="2" rx="1" fill="currentColor"/></svg>
      </button>
      <button
        title="Align Right"
        onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run(); }}
        style={buttonStyle(editor.isActive({ textAlign: 'right' }))}
      >
        {/* Right Align SVG */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor"/><rect x="9" y="9" width="8" height="2" rx="1" fill="currentColor"/><rect x="5" y="13" width="12" height="2" rx="1" fill="currentColor"/></svg>
      </button>
    </div>,
    document.body
  );
} 