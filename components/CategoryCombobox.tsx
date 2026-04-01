import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';

interface CategoryComboboxProps {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
  placeholder?: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  categories,
  placeholder = 'Seleccionar contexto...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ─── Filtered + sorted results ──────────────────────
  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase().trim();
    return categories.filter((cat) => cat.toLowerCase().includes(q));
  }, [categories, query]);

  // Show "create new" option when query doesn't exactly match any category
  const showCreateOption = useMemo(() => {
    if (!query.trim()) return false;
    const q = query.trim().toLowerCase();
    return !categories.some((cat) => cat.toLowerCase() === q);
  }, [query, categories]);

  // Total selectable items (filtered + optional create)
  const totalOptions = filtered.length + (showCreateOption ? 1 : 0);

  // ─── Open / close helpers ────────────────────────────
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setHighlightIndex(0);
    // Focus input on next tick
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const select = useCallback(
    (cat: string) => {
      onChange(cat);
      close();
    },
    [onChange, close],
  );

  // ─── Click outside ──────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // ─── Keyboard navigation ────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightIndex((prev) => (prev + 1) % totalOptions);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
          break;
        case 'Enter':
          e.preventDefault();
          if (totalOptions === 0) break;
          if (highlightIndex < filtered.length) {
            select(filtered[highlightIndex]);
          } else if (showCreateOption) {
            select(query.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          close();
          break;
      }
    },
    [totalOptions, highlightIndex, filtered, showCreateOption, query, select, close],
  );

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length, showCreateOption]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  // ─── Color for current value ────────────────────────
  const selectedColor = getColorForCategory(value);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Trigger button ─────────────────────────────── */}
      <button
        type="button"
        onClick={() => (isOpen ? close() : open())}
        className={`
          flex items-center gap-2.5 w-full h-9 px-3 rounded-md border text-sm
          transition-all cursor-pointer
          bg-muted/30 hover:bg-muted/50
          ${isOpen
            ? `${selectedColor.border} ring-1 ${selectedColor.ring}`
            : 'border-border hover:border-muted-foreground/50'
          }
        `}
      >
        {/* Color dot */}
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${selectedColor.bg.replace('/10', '')} ring-1 ${selectedColor.ring}`} />

        <span className={`flex-1 text-left truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {value || placeholder}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Dropdown panel ─────────────────────────────── */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 bg-[#111113]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar o crear contexto..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="text-muted-foreground hover:text-foreground text-xs px-1"
              >
                &times;
              </button>
            )}
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1 scroll-smooth"
          >
            {filtered.map((cat, idx) => {
              const color = getColorForCategory(cat);
              const isSelected = cat === value;
              const isHighlighted = idx === highlightIndex;

              return (
                <li
                  key={cat}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => select(cat)}
                  className={`
                    flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors
                    ${isHighlighted ? 'bg-white/[0.06]' : ''}
                    ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}
                    hover:bg-white/[0.06]
                  `}
                >
                  {/* Color dot */}
                  <span className={`h-2 w-2 rounded-full shrink-0 ${color.bg.replace('/10', '')} ring-1 ${color.ring}`} />

                  <span className="flex-1 truncate">{cat}</span>

                  {/* Check mark for selected */}
                  {isSelected && (
                    <Check className={`h-3.5 w-3.5 shrink-0 ${color.text}`} />
                  )}
                </li>
              );
            })}

            {/* "Create new" option */}
            {showCreateOption && (
              <li
                role="option"
                aria-selected={false}
                onMouseEnter={() => setHighlightIndex(filtered.length)}
                onClick={() => select(query.trim())}
                className={`
                  flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors
                  border-t border-white/5
                  ${highlightIndex === filtered.length ? 'bg-white/[0.06]' : ''}
                  text-indigo-400 hover:bg-white/[0.06]
                `}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate">
                  Crear: <strong className="text-foreground">{query.trim()}</strong>
                </span>
              </li>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !showCreateOption && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                Sin resultados
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
