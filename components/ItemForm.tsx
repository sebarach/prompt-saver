import React, { useState, useEffect } from 'react';
import type { Item, ItemType, Category } from '../types';
import { Button, Input, Textarea, Modal } from './ui';
import { Terminal, MessageSquare, X, Check, Code2 } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';
import { CategoryCombobox } from './CategoryCombobox';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Item, 'id' | 'createdAt' | 'categoryName'>) => void;
  initialData?: Item | null;
  categories: Category[];
  onCreateCategory?: (name: string) => Promise<Category>;
}

export const ItemForm: React.FC<ItemFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  onCreateCategory,
}) => {
  const [type, setType] = useState<ItemType>('prompt');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('general');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isDeprecated, setIsDeprecated] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setCategoryId(initialData.categoryId);
      setCategoryName(initialData.categoryName);
      setTitle(initialData.title);
      setContent(initialData.content);
      setDescription(initialData.description ?? '');
      setTags(initialData.tags);
      setIsDeprecated(initialData.isDeprecated ?? false);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('prompt');
    setCategoryId(categories[0]?.id ?? '');
    setCategoryName(categories[0]?.name ?? 'general');
    setTitle('');
    setContent('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setIsDeprecated(false);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      categoryId,
      title,
      content,
      description,
      tags,
      isDeprecated,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Elemento' : 'Nuevo Elemento'}
      className="relative"
      size="lg"
    >
      <div
        className={`pointer-events-none absolute -inset-20 opacity-20 blur-[100px] transition-all duration-1000 ${getColorForCategory(categoryName).glow}`}
      />

      <form onSubmit={handleSubmit} className="relative space-y-5">
        {/* Type Selection */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div
            className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center justify-center gap-1.5 transition-all ${type === 'prompt' ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-muted/30 hover:bg-muted'}`}
            onClick={() => setType('prompt')}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[11px] font-medium">Prompt AI</span>
          </div>
          <div
            className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center justify-center gap-1.5 transition-all ${type === 'command' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500' : 'border-border bg-muted/30 hover:bg-muted'}`}
            onClick={() => setType('command')}
          >
            <Terminal className="h-4 w-4" />
            <span className="text-[11px] font-medium">Comando CLI</span>
          </div>
          <div
            className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center justify-center gap-1.5 transition-all ${type === 'snippet' ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500' : 'border-border bg-muted/30 hover:bg-muted'}`}
            onClick={() => setType('snippet')}
          >
            <Code2 className="h-4 w-4" />
            <span className="text-[11px] font-medium">Snippet Código</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Contexto / Categoría</label>
          {categories.length > 0 && (
            <CategoryCombobox
              value={categoryId}
              valueLabel={categoryName}
              onChange={(id, name) => {
                setCategoryId(id);
                setCategoryName(name);
              }}
              categories={categories}
              onCreateCategory={onCreateCategory}
            />
          )}
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Primero crea una categoría desde la barra lateral.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Título</label>
          <Input
            placeholder={
              type === 'prompt'
                ? 'Ej: Experto en Python'
                : type === 'command'
                  ? 'Ej: Desplegar Web App'
                  : 'Ej: Hook de React'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-muted/30 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            {type === 'prompt'
              ? 'Contenido del Prompt'
              : type === 'command'
                ? 'Código del Comando'
                : 'Fragmento de Código'}
          </label>
          <Textarea
            placeholder={
              type === 'prompt'
                ? 'Actúa como un...'
                : type === 'command'
                  ? 'docker build -t...'
                  : 'const useLocalStorage = () => { ... }'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className={`font-mono text-xs h-[450px] bg-black/60 border-2 transition-all duration-300 ${getColorForCategory(categoryName).border} ${getColorForCategory(categoryName).text} focus:ring-2 ${getColorForCategory(categoryName).ring} focus:border-transparent`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Descripción (Opcional)</label>
            <Input
              placeholder="Para qué sirve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Tags (Enter)</label>
            <Input
              placeholder="react, fix..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-muted/30"
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={isDeprecated}
                onChange={(e) => setIsDeprecated(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
              />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-white transition-colors">
                Marcar como deprecado
              </span>
            </label>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-md border border-white/5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className={
              type === 'command'
                ? 'bg-emerald-600 hover:bg-emerald-700 w-32'
                : type === 'snippet'
                  ? 'bg-amber-600 hover:bg-amber-700 w-32'
                  : 'w-32'
            }
          >
            {initialData ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
