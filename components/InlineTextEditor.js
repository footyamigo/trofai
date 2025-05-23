import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import FloatingToolbar from './FloatingToolbar';

export default function InlineTextEditor({
  value = '<p>Test line height</p>',
  onChange,
  onEditorFocus,
  onEditorRawChange,
  onEditorBlurWithValue,
  placeholder = '',
  align = 'left',
  fontSize = 24,
  fontWeight = 'bold',
  color = '#222',
  singleLine = false,
  fontFamily,
  lineHeight
}) {
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
        hardBreak: !singleLine,
        bulletList: false,
        orderedList: false,
        listItem: false,
        paragraph: singleLine ? { HTMLAttributes: { class: 'single-line-paragraph' } } : {},
      }),
      TextAlign.configure({ types: ['paragraph', 'heading'] }),
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
          font-family: "${fontFamily}", ${fontFamily && fontFamily.includes(' ') ? 'sans-serif' : 'sans-serif'};
          line-height: ${lineHeight} !important;
        `,
        placeholder,
        spellCheck: 'true',
      },
    },
    onFocus() {
      if (onEditorFocus) {
        onEditorFocus();
      }
    },
    onUpdate({ editor }) {
      if (onChange) {
        onChange(editor.getHTML());
      }
      if (onEditorRawChange) {
        onEditorRawChange(editor.getText());
      }
    },
    onBlur({ editor }) {
      if (onEditorBlurWithValue) {
        onEditorBlurWithValue(editor.getText());
      }
    },
  });

  useEffect(() => {
    if (editor) {
      console.log('Tiptap editor initialized', editor);
    }
  }, [editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor || !singleLine) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (editor.isFocused && onEditorBlurWithValue) {
          onEditorBlurWithValue(editor.getText());
          editor.commands.blur();
        }
      }
    };
    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => editor.view.dom.removeEventListener('keydown', handleKeyDown);
  }, [editor, singleLine, onEditorBlurWithValue]);
  
  useEffect(() => {
    if (containerRef.current && lineHeight) {
      containerRef.current.style.lineHeight = lineHeight;
      const applyLH = () => {
        if (editor && editor.view && editor.view.dom) {
          editor.view.dom.style.lineHeight = lineHeight;
          const elements = editor.view.dom.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
          elements.forEach(el => { el.style.lineHeight = lineHeight; });
        } else {
          setTimeout(applyLH, 50);
        }
      };
      applyLH();
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
      
      <style jsx>{`
        .tiptap-editor-container :global(.ProseMirror) {
          line-height: ${lineHeight} !important;
        }
        .tiptap-editor-container :global(.ProseMirror p),
        .tiptap-editor-container :global(.ProseMirror .single-line-paragraph),
        .tiptap-editor-container :global(.ProseMirror h1),
        .tiptap-editor-container :global(.ProseMirror h2),
        .tiptap-editor-container :global(.ProseMirror h3) {
          line-height: ${lineHeight} !important;
        }
        .tiptap-editor-container :global(.ProseMirror .single-line-paragraph) {
          margin: 0;
        }
      `}</style>
    </div>
  );
} 