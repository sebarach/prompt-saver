import React, { useState, useEffect } from 'react';
import { Item, ItemType } from '../types';
import { Button, Input, Textarea, Modal } from './ui';
import { Terminal, MessageSquare, X, Check } from 'lucide-react';

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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all ${type === 'prompt' ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-muted/30 hover:bg-muted'}`}
            onClick={() => setType('prompt')}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Prompt AI</span>
          </div>
          <div 
            className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center gap-2 transition-all ${type === 'command' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500' : 'border-border bg-muted/30 hover:bg-muted'}`}
            onClick={() => setType('command')}
          >
            <Terminal className="h-5 w-5" />
            <span className="text-sm font-medium">Comando CLI</span>
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
                  ? 'bg-white text-black border-white font-semibold' 
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
            placeholder={type === 'prompt' ? "Ej: Experto en Python" : "Ej: Desplegar Web App"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-muted/30 font-medium"
          />
        </div>

        <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
                {type === 'prompt' ? 'Contenido del Prompt' : 'Código del Comando'}
            </label>
            <Textarea 
                placeholder={type === 'prompt' ? "Actúa como un..." : "docker build -t..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="font-mono text-xs min-h-[140px] bg-black/40 border-zinc-800 focus:border-indigo-500"
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
            <Button type="submit" className={type === 'command' ? 'bg-emerald-600 hover:bg-emerald-700 w-32' : 'w-32'}>
                {initialData ? 'Guardar' : 'Crear'}
            </Button>
        </div>

      </form>
    </Modal>
  );
};