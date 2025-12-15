import React, { useState } from 'react';
import { Item } from '../types';
import { Button, Card, CardContent, CardFooter, CardHeader } from './ui';
import { Copy, Trash2, Edit, Check, Terminal, MessageSquare, Tag, X } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onCopy: (text: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onEdit, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleCopy = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onCopy(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCommand = item.type === 'command';
  const openDetail = () => setIsDetailOpen(true);
  const closeDetail = () => setIsDetailOpen(false);
  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  };

  // Determine accent color based on type
  const accentClass = isCommand ? 'text-emerald-400' : 'text-indigo-400';
  const borderHoverClass = isCommand ? 'group-hover:border-emerald-500/30' : 'group-hover:border-indigo-500/30';
  const focusOutlineClass = isCommand ? 'focus-visible:outline-emerald-500/60' : 'focus-visible:outline-indigo-500/60';

  return (
    <>
      <Card
        onClick={openDetail}
        onKeyDown={handleCardKeyDown}
        tabIndex={0}
        role="button"
        className={`flex flex-col h-full transition-all duration-300 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/60 ${borderHoverClass} hover:bg-zinc-900/60 hover:shadow-xl hover:shadow-black/20 group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusOutlineClass}`}
      >
        <CardHeader className="pb-3 pt-5">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                  <span className={`px-2 py-0.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-1.5 ${accentClass}`}>
                      {isCommand ? <Terminal className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {item.category || 'General'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-semibold text-base leading-tight tracking-tight truncate text-zinc-100 group-hover:text-white transition-colors" title={item.title}>
                  {item.title}
              </h3>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 pb-3">
          {item.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          
          <div className="relative mt-2 group/code">
            <div className={`rounded-lg p-3.5 text-sm font-mono text-xs overflow-x-auto whitespace-pre-wrap transition-colors ${
              isCommand 
                ? 'bg-black/80 border border-emerald-900/20 text-emerald-300 shadow-inner' 
                : 'bg-zinc-950/80 border border-indigo-900/20 text-zinc-300 shadow-inner'
            }`}>
              {item.content}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-2 right-2 h-7 w-7 rounded-md bg-zinc-800/80 backdrop-blur opacity-0 group-hover/code:opacity-100 transition-opacity hover:bg-white text-zinc-400 hover:text-black`}
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-white/5 pt-3 mt-auto bg-white/[0.02]">
          <div className="flex gap-1.5 flex-wrap">
            {item.tags.length > 0 ? (
               item.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                    #{tag}
                  </span>
                ))
            ) : (
              <span className="text-[10px] text-zinc-700 italic">Sin tags</span>
            )}
            {item.tags.length > 3 && (
               <span className="text-[10px] text-muted-foreground px-1">+{item.tags.length - 3}</span>
            )}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-zinc-800" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {isDetailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
          onClick={closeDetail}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f]/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`pointer-events-none absolute inset-0 opacity-40 blur-3xl ${isCommand ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`} />
            <div className="relative p-6 md:p-8 space-y-6">
              <button
                className="absolute top-5 right-5 text-muted-foreground hover:text-white transition"
                onClick={closeDetail}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-3 pr-8">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider ${isCommand ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'}`}>
                    {isCommand ? <Terminal className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    {isCommand ? 'Comando CLI' : 'Prompt AI'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span className="uppercase tracking-wide text-white/70 text-[11px]">{item.category || 'General'}</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold text-white leading-snug">{item.title}</h2>
                {item.description && (
                  <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className={`relative rounded-2xl border ${isCommand ? 'border-emerald-500/20 bg-emerald-950/30' : 'border-indigo-500/20 bg-zinc-950/60'} p-5 shadow-[0_0_60px_rgba(0,0,0,0.45)]`}>
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-2xl" />
                <pre className={`relative font-mono text-sm whitespace-pre-wrap leading-relaxed ${isCommand ? 'text-emerald-100' : 'text-zinc-100'}`}>
                  {item.content}
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 h-8 bg-white/10 text-white hover:bg-white/20"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-3.5 w-3.5 text-emerald-300" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Copiar
                    </>
                  )}
                </Button>
              </div>

              {item.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Tag className="h-3 w-3" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                <span className="text-xs text-muted-foreground">
                  Creado el {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    className="bg-white/5 text-white hover:bg-white/10"
                    onClick={(e) => { e.stopPropagation(); onEdit(item); closeDetail(); }}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); closeDetail(); }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
