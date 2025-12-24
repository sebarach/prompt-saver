import React, { useState } from 'react';
import { Item } from '../types';
import { Button, Card, CardContent, CardFooter, CardHeader } from './ui';
import { Copy, Trash2, Edit, Check, Terminal, MessageSquare, Tag, X, Code2, Eye, EyeOff } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onCopy: (text: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onEdit, onCopy }) => {
  const [copied, setCopied] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const isSecret = item.category?.toLowerCase().trim() === 'secrets';
  const [isContentVisible, setIsContentVisible] = useState(!isSecret);

  const handleCopy = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onCopy(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCommand = item.type === 'command';
  const isSnippet = item.type === 'snippet';
  const openDetail = () => setIsDetailOpen(true);
  const closeDetail = () => setIsDetailOpen(false);
  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  };

  const catColor = getColorForCategory(item.category || 'General');

  // Determine accent color based on category color mapping
  const accentClass = catColor.text;
  const borderHoverClass = `group-hover:${catColor.border}`;
  const focusOutlineClass = `focus-visible:outline-${catColor.ring}/60`;

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
                  <span className={`px-2 py-0.5 rounded-full ${catColor.bg} border ${catColor.border} flex items-center gap-1.5 ${catColor.text}`}>
                      {item.type === 'command' ? <Terminal className="h-3 w-3" /> : item.type === 'snippet' ? <Code2 className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
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
            <div className="relative group/content">
              <div className={`rounded-lg p-3.5 text-sm font-mono text-xs overflow-y-auto max-h-[200px] whitespace-pre-wrap transition-all duration-300 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/80 border ${catColor.border} ${catColor.text} shadow-inner ${!isContentVisible ? 'blur-md select-none opacity-50' : ''}`}>
                {item.content}
              </div>
              {!isContentVisible && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); setIsContentVisible(true); }}
                    className="bg-black/40 hover:bg-black/60 border border-white/10 text-white gap-2 backdrop-blur-sm z-20"
                  >
                    <Eye className="h-4 w-4" /> Revelar
                  </Button>
                </div>
              )}
              {isSecret && isContentVisible && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsContentVisible(false); }}
                  className="absolute top-2 right-10 p-1.5 rounded-md bg-black/50 text-white/50 hover:text-white transition-colors opacity-0 group-hover/content:opacity-100 z-20"
                  title="Ocultar"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-2 right-2 h-7 w-7 rounded-md bg-zinc-800/80 backdrop-blur opacity-0 group-hover/code:opacity-100 transition-opacity hover:bg-white text-zinc-400 hover:text-black z-20`}
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
              className={`relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0f]/95 shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
            <div className={`pointer-events-none absolute inset-0 opacity-40 blur-3xl ${catColor.glow}`} />
            <div className="relative p-6 md:p-8 space-y-6">
              <button
                className="absolute top-5 right-5 text-muted-foreground hover:text-white transition z-30"
                onClick={closeDetail}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-3 pr-8">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider ${catColor.border} ${catColor.bg} ${catColor.text}`}>
                    {item.type === 'command' ? <Terminal className="h-3.5 w-3.5" /> : item.type === 'snippet' ? <Code2 className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    {item.type === 'command' ? 'Comando CLI' : item.type === 'snippet' ? 'Snippet Código' : 'Prompt AI'}
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

              <div className={`relative rounded-2xl border ${catColor.border} bg-black/40 p-5 shadow-[0_0_60px_rgba(0,0,0,0.45)] overflow-hidden`}>
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-2xl z-10" />
                <div className={`max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent transition-all duration-500 ${!isContentVisible ? 'blur-2xl select-none opacity-20' : ''}`}>
                  <pre className={`relative font-mono text-sm whitespace-pre-wrap leading-relaxed ${catColor.text}`}>
                    {item.content}
                  </pre>
                </div>
                
                {!isContentVisible && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Button 
                      onClick={() => setIsContentVisible(true)}
                      className={`${catColor.bg} ${catColor.text} ${catColor.border} hover:scale-105 transition-transform gap-3 px-8 py-7 h-auto text-lg font-bold shadow-2xl ring-1 ${catColor.ring} backdrop-blur-md`}
                    >
                      <Eye className="h-6 w-6" /> Revelar Secreto
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 bg-white/10 text-white hover:bg-white/20"
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

                  {isSecret && isContentVisible && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsContentVisible(false)}
                      className="text-white/40 hover:text-white gap-2"
                    >
                      <EyeOff className="h-4 w-4" /> Ocultar
                    </Button>
                  )}
                </div>
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
