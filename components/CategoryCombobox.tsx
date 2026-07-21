import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, Plus, Check, Loader2 } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';
import type { Category } from '../types';

interface CategoryComboboxProps {
  value: string;
  valueLabel?: string;
  onChange: (id: string, name: string) => void;
  categories: Category[];
  onCreateCategory?: (name: string) => Promise<Category>;
  placeholder?: string;
}

export const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  valueLabel,
  onChange,
  categories,
  onCreateCategory,
  placeholder = 'Seleccionar contexto...',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [highlightIndex, setHighlightIndex] = useState<number>(0);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo<Category[]>(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase().trim();
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, query]);

  const showCreateOption = useMemo<boolean>(() => {
    if (!query.trim() || !onCreateCategory) return false;
    const q = query.trim().toLowerCase();
    return !categories.some((cat) => cat.name.toLowerCase() === q);
  }, [query, categories, onCreateCategory]);

  const totalOptions = filtered.length + (showCreateOption ? 1 : 0);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setHighlightIndex(0);
    setCreateError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setCreateError(null);
  }, []);

  const selectExisting = useCallback(
    (cat: Category) => {
      onChange(cat.id, cat.name);
      close();
    },
    [onChange, close],
  );

  const createAndSelect = useCallback(async () => {
    if (!onCreateCategory) return;
    const name = query.trim();
    if (!name) return;

    setCreating(true);
    setCreateError(null);
    try {
      const created = await onCreateCategory(name);
      onChange(created.id, created.name);
      close();
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Error al crear categoría');
    } finally {
      setCreating(false);
    }
  }, [onCreateCategory, query, onChange, close]);

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
            selectExisting(filtered[highlightIndex]);
          } else if (showCreateOption) {
            void createAndSelect();
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
    [totalOptions, highlightIndex, filtered, showCreateOption, selectExisting, createAndSelect, close],
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length, showCreateOption]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  const selectedColor = getColorForCategory(valueLabel ?? 'general');
  const currentLabel = valueLabel ?? categories.find((c) => c.id === value)?.name ?? placeholder;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => (isOpen ? close() : open())}
        className={`flex items-center gap-2.5 w-full h-9 px-3 rounded-md border text-sm transition-all cursor-pointer bg-muted/30 hover:bg-muted/50 ${isOpen ? `${selectedColor.border} ring-1 ${selectedColor.ring}` : 'border-border hover:border-muted-foreground/50'}`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${selectedColor.bg.replace('/10', '')} ring-1 ${selectedColor.ring}`}
        />
        <span className={`flex-1 text-left truncate ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {currentLabel}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/10 bg-[#111113]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCreateError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar o crear contexto..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground text-xs px-1"
              >
                &times;
              </button>
            )}
          </div>

          {createError && (
            <div className="px-3 py-2 text-xs text-red-400 bg-red-950/20 border-b border-red-900/30">
              {createError}
            </div>
          )}

          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1 scroll-smooth">
            {filtered.map((cat, idx) => {
              const color = getColorForCategory(cat.name);
              const isSelected = cat.id === value;
              const isHighlighted = idx === highlightIndex;
              return (
                <li
                  key={cat.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onClick={() => selectExisting(cat)}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${isHighlighted ? 'bg-white/[0.06]' : ''} ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'} hover:bg-white/[0.06]`}
                >
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${color.bg.replace('/10', '')} ring-1 ${color.ring}`}
                  />
                  <span className="flex-1 truncate">{cat.name}</span>
                  {isSelected && <Check className={`h-3.5 w-3.5 shrink-0 ${color.text}`} />}
                </li>
              );
            })}

            {showCreateOption && (
              <li
                role="option"
                aria-selected={false}
                onMouseEnter={() => setHighlightIndex(filtered.length)}
                onClick={() => void createAndSelect()}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors border-t border-white/5 ${highlightIndex === filtered.length ? 'bg-white/[0.06]' : ''} text-indigo-400 hover:bg-white/[0.06]`}
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="flex-1 truncate">
                  Crear: <strong className="text-foreground">{query.trim()}</strong>
                </span>
              </li>
            )}

            {filtered.length === 0 && !showCreateOption && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {!onCreateCategory ? 'Sin resultados' : 'Escribe para crear nueva...'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
