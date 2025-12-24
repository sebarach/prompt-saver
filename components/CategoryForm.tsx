import React, { useState } from 'react';
import { Button, Input, Modal } from './ui';
import { Layers, Palette } from 'lucide-react';
import { CATEGORY_COLORS, getColorForCategory } from '../lib/colors';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: string, colorKey?: string) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('general');

  const colorKeys = Object.keys(CATEGORY_COLORS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), selectedColor);
      setName('');
      setSelectedColor('general');
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
        
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Palette className="h-4 w-4" /> Personalizar Color
          </label>
          <div className="grid grid-cols-5 gap-3 p-1">
            {colorKeys.map((key) => {
              const colors = CATEGORY_COLORS[key];
              const isSelected = selectedColor === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedColor(key)}
                  title={key}
                  className={`h-10 w-full rounded-lg border transition-all flex items-center justify-center ${
                    isSelected 
                      ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}` 
                      : 'border-white/5 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`h-4 w-4 rounded-full ${colors.bg.replace('/10', '')} border ${colors.border}`} />
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground text-center italic">
            El color se aplicará a iconos, etiquetas y efectos visuales de este contexto.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-white text-black hover:bg-zinc-200">Crear</Button>
        </div>
      </form>
    </Modal>
  );
};