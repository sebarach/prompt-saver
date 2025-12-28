import React, { useState, useEffect } from 'react';
import { Item, ItemType } from '../types';
import { Button, Input, Textarea, Modal } from './ui';
import { Terminal, MessageSquare, X, Check, Code2 } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  initialData?: Item | null;
  categories: string[];
}

export const ItemForm: React.FC<ItemFormProps> = ({ isOpen, onClose, onSave, initialData, categories }) => {
  const [type, setType] = useState<ItemType>('prompt');
  const [category, setCategory] = useState('General');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setCategory(initialData.category || 'General');
      setTitle(initialData.title);
      setContent(initialData.content);
      setDescription(initialData.description || '');
      setTags(initialData.tags);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('prompt');
    setCategory(categories[0] || 'General');
    setTitle('');
    setContent('');
    setDescription('');
    setTags([]);
    setTagInput('');
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
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      category,
      title,
      content,
      description,
      tags
    });
    onClose();
  };

  // Ensure 'General' is always available if list is empty
  const displayCategories = categories.length > 0 ? categories : ['General'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Elemento' : 'Nuevo Elemento'}
      className="relative"
    >
      <div className={`pointer-events-none absolute -inset-20 opacity-20 blur-[100px] transition-all duration-1000 ${getColorForCategory(category).glow}`} />
      
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
          <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto pr-1">
            {displayCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  category === cat 
                  ? `${getColorForCategory(cat).bg} ${getColorForCategory(cat).text} ${getColorForCategory(cat).border} font-bold ring-1 ${getColorForCategory(cat).ring}` 
                  : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <Input 
            placeholder="O escribe una nueva..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-muted/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Título</label>
          <Input 
            placeholder={type === 'prompt' ? "Ej: Experto en Python" : type === 'command' ? "Ej: Desplegar Web App" : "Ej: Hook de React"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-muted/30 font-medium"
          />
        </div>

        <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
                {type === 'prompt' ? 'Contenido del Prompt' : type === 'command' ? 'Código del Comando' : 'Fragmento de Código'}
            </label>
            <Textarea 
                placeholder={type === 'prompt' ? "Actúa como un..." : type === 'command' ? "docker build -t..." : "const useLocalStorage = () => { ... }"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className={`font-mono text-xs min-h-[140px] bg-black/60 border-2 transition-all duration-300 ${getColorForCategory(category).border} ${getColorForCategory(category).text} focus:ring-2 ${getColorForCategory(category).ring} focus:border-transparent`}
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
        </div>
        
        {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-md border border-white/5">
                {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs border border-zinc-700">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 ml-1">
                    <X className="h-3 w-3" />
                    </button>
                </span>
                ))}
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className={type === 'command' ? 'bg-emerald-600 hover:bg-emerald-700 w-32' : type === 'snippet' ? 'bg-amber-600 hover:bg-amber-700 w-32' : 'w-32'}>
                {initialData ? 'Guardar' : 'Crear'}
            </Button>
        </div>

      </form>
    </Modal>
  );
};