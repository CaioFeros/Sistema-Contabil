import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Type,
  List,
  ListOrdered,
  Plus,
  Minus
} from 'lucide-react';

const FormattingToolbar = ({ onFormat, onFontSizeIncrease, onFontSizeDecrease, onAlign, onList }) => {
  const handleFormat = (format) => {
    onFormat(format);
  };

  const handleFontSizeIncrease = () => {
    onFontSizeIncrease();
  };

  const handleFontSizeDecrease = () => {
    onFontSizeDecrease();
  };

  const handleAlign = (alignment) => {
    onAlign(alignment);
  };

  const handleList = (listType) => {
    onList(listType);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mb-4">
      {/* Formatação de texto */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <button
          onClick={() => handleFormat('bold')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFormat('italic')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleFormat('underline')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Sublinhado"
        >
          <Underline className="h-4 w-4" />
        </button>
      </div>

      {/* Tamanho da fonte */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Type className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        <button
          onClick={handleFontSizeDecrease}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Diminuir fonte"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleFontSizeIncrease}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Aumentar fonte"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Alinhamento */}
      <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
        <button
          onClick={() => handleAlign('left')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleAlign('center')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleAlign('right')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Alinhar à direita"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleAlign('justify')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </button>
      </div>

      {/* Listas */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleList('bullet')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleList('number')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default FormattingToolbar;
