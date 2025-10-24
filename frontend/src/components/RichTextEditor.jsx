import React, { useRef, useEffect, useState } from 'react';
import FormattingToolbar from './FormattingToolbar';

const RichTextEditor = ({ value, onChange, placeholder = "Digite o conteúdo do relatório aqui..." }) => {
  const editorRef = useRef(null);
  const [currentFontSize, setCurrentFontSize] = useState(12);
  const [selectionRange, setSelectionRange] = useState(null);

  useEffect(() => {
    if (editorRef.current) {
      // Só atualiza se o conteúdo realmente mudou
      if (value !== editorRef.current.innerHTML) {
        const selection = window.getSelection();
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        editorRef.current.innerHTML = value;
        
        // Restaura a seleção se existia
        if (range) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            // Se não conseguir restaurar, coloca o cursor no final
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const saveSelection = () => {
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        setSelectionRange(sel.getRangeAt(0));
      }
    }
  };

  const restoreSelection = () => {
    if (selectionRange && window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selectionRange);
    }
  };

  const handleFormat = (format) => {
    saveSelection();
    document.execCommand(format, false, null);
    editorRef.current.focus();
    restoreSelection();
    handleInput();
  };

  const handleFontSizeIncrease = () => {
    saveSelection();
    const newSize = Math.min(currentFontSize + 2, 32);
    setCurrentFontSize(newSize);
    document.execCommand('fontSize', false, '7');
    const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
    fontElements.forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = `${newSize}px`;
    });
    editorRef.current.focus();
    restoreSelection();
    handleInput();
  };

  const handleFontSizeDecrease = () => {
    saveSelection();
    const newSize = Math.max(currentFontSize - 2, 8);
    setCurrentFontSize(newSize);
    document.execCommand('fontSize', false, '7');
    const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
    fontElements.forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = `${newSize}px`;
    });
    editorRef.current.focus();
    restoreSelection();
    handleInput();
  };

  const handleAlign = (alignment) => {
    saveSelection();
    document.execCommand('justify' + alignment.charAt(0).toUpperCase() + alignment.slice(1), false, null);
    editorRef.current.focus();
    restoreSelection();
    handleInput();
  };

  const handleList = (listType) => {
    saveSelection();
    if (listType === 'bullet') {
      document.execCommand('insertUnorderedList', false, null);
    } else if (listType === 'number') {
      document.execCommand('insertOrderedList', false, null);
    }
    editorRef.current.focus();
    restoreSelection();
    handleInput();
  };

  return (
    <div className="w-full">
      <FormattingToolbar 
        onFormat={handleFormat}
        onFontSizeIncrease={handleFontSizeIncrease}
        onFontSizeDecrease={handleFontSizeDecrease}
        onAlign={handleAlign}
        onList={handleList}
      />
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[200px] max-h-[400px] overflow-y-auto"
        style={{
          outline: 'none',
          fontSize: '12px',
          lineHeight: '1.6',
          fontFamily: 'Arial, sans-serif',
          direction: 'ltr',
          textAlign: 'left'
        }}
        data-placeholder={placeholder}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        [contenteditable]:focus:before {
          content: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
