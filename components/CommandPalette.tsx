import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Item } from '../types';
import { Search, Terminal, FileCode, FileText, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onSelectItem: (item: Item) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onSelectItem 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    
    const q = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.tags.some(tag => tag.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [items, query]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? filteredItems.length - 1 : prev - 1);
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        onSelectItem(filteredItems[selectedIndex]);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onSelectItem, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'command': return <Terminal className="h-4 w-4" />;
      case 'snippet': return <FileCode className="h-4 w-4" />;
      case 'prompt': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'command': return 'text-emerald-400';
      case 'snippet': return 'text-cyan-400';
      case 'prompt': return 'text-indigo-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="bg-[#0a0a0b]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar comandos, snippets o prompts..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-muted-foreground text-base"
            />
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-muted-foreground">Esc</kbd>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {query ? 'No se encontraron resultados' : 'Comienza a escribir para buscar...'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {filteredItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                      index === selectedIndex 
                        ? 'bg-white/10' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`mt-0.5 ${getTypeColor(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium text-sm truncate">
                          {item.title}
                        </h3>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getTypeColor(item.type)} bg-white/5`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs truncate">
                        {item.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground/70">
                          {item.category}
                        </span>
                        {item.tags.length > 0 && (
                          <span className="text-xs text-muted-foreground/50">
                            • {item.tags.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">↑↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Enter</kbd>
                  Seleccionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-mono">Esc</kbd>
                  Cerrar
                </span>
              </div>
              <span>{filteredItems.length} resultados</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
