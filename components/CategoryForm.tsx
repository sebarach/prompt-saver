import React, { useState } from 'react';
import { Button, Input, Modal } from './ui';
import { Layers } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: string) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Contexto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center p-4 bg-muted/10 rounded-lg border border-dashed border-muted mb-4">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                <Layers className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="text-xs text-center text-muted-foreground">
                Crea una nueva categoría para organizar tus prompts y comandos.
            </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Nombre de la Categoría</label>
          <Input 
            placeholder="Ej: Kubernetes, Rust, Design Patterns..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            className="bg-black/20 border-white/10 focus:border-indigo-500/50"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Crear</Button>
        </div>
      </form>
    </Modal>
  );
};