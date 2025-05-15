import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import FloatingToolbar from './FloatingToolbar';

export default function InlineTextEditor({ value = '<p>Test line height</p>', onChange, placeholder = '', align = 'left', fontSize = 24, fontWeight = 'bold', color = '#222', singleLine = false, fontFamily, lineHeight }) {
  // SSR/client-only check
  if (typeof window === 'undefined') return null;

  console.log('InlineTextEditor received lineHeight:', lineHeight);
  console.log('Type of lineHeight:', typeof lineHeight);
  
  const containerRef = useRef(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: true,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        hardBreak: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      TextAlign.configure({ types: ['paragraph'] }),
      Underline,
    ],
    content: value,
    editorProps: {
      attributes: {
        style: `
          outline: none;
          min-height: 1em;
          font-size: ${fontSize}px;
          font-weight: ${fontWeight};
          color: ${color};
          text-align: ${align};
          background: transparent;
          ${fontFamily ? `font-family: '${fontFamily}', ${fontFamily.includes(' ') ? 'sans-serif' : ''};` : ''}
          line-height: ${lineHeight} !important;
        `,
        placeholder,
        spellCheck: 'true',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      console.log('Tiptap editor initialized', editor);
    }
  }, [editor]);

  // Keep editor in sync with value prop
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value]);

  // Optionally restrict to single line
  useEffect(() => {
    if (!editor || !singleLine) return;
    const handleEnter = (event) => {
      if (event.key === 'Enter') event.preventDefault();
    };
    editor.view.dom.addEventListener('keydown', handleEnter);
    return () => editor.view.dom.removeEventListener('keydown', handleEnter);
  }, [editor, singleLine]);
  
  // Apply line height directly to the DOM element
  useEffect(() => {
    if (containerRef.current && lineHeight) {
      // Set on the container first
      containerRef.current.style.lineHeight = lineHeight;
      
      // Wait for editor to be available
      const applyLineHeight = () => {
        if (editor && editor.view && editor.view.dom) {
          // Apply directly to the contenteditable element
          editor.view.dom.style.lineHeight = lineHeight;
          
          // Find all paragraphs and headings inside and set line height
          const elements = editor.view.dom.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
          elements.forEach(el => {
            el.style.lineHeight = lineHeight;
          });
          
          console.log('Applied line height directly to DOM:', lineHeight);
        } else {
          // Retry until editor is available
          setTimeout(applyLineHeight, 100);
        }
      };
      
      applyLineHeight();
    }
  }, [editor, lineHeight]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        position: 'relative', 
        minHeight: 60
      }}
      className="tiptap-editor-container"
    >
      {editor && <FloatingToolbar editor={editor} />}
      <EditorContent editor={editor} />
      
      {/* Add a style tag to target ProseMirror content specifically */}
      <style jsx>{`
        .tiptap-editor-container :global(.ProseMirror) {
          line-height: ${lineHeight} !important;
        }
        .tiptap-editor-container :global(.ProseMirror p),
        .tiptap-editor-container :global(.ProseMirror h1),
        .tiptap-editor-container :global(.ProseMirror h2),
        .tiptap-editor-container :global(.ProseMirror h3) {
          line-height: ${lineHeight} !important;
        }
      `}</style>
    </div>
  );
} 