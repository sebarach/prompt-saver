import React, { useState } from 'react';
import { Item } from '../types';
import { Badge, Button, Card, CardContent, CardFooter, CardHeader } from './ui';
import { Copy, Trash2, Edit, Check, Terminal, MessageSquare, Tag } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onDelete: (id: string) => void;
  onEdit: (item: Item) => void;
  onCopy: (text: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onEdit, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCommand = item.type === 'command';

  // Determine accent color based on type
  const accentColor = isCommand ? 'emerald' : 'indigo';
  const accentClass = isCommand ? 'text-emerald-400' : 'text-indigo-400';
  const borderHoverClass = isCommand ? 'group-hover:border-emerald-500/30' : 'group-hover:border-indigo-500/30';

  return (
    <Card className={`flex flex-col h-full transition-all duration-300 bg-zinc-900/40 backdrop-blur-sm border-zinc-800/60 ${borderHoverClass} hover:bg-zinc-900/60 hover:shadow-xl hover:shadow-black/20 group`}>
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
          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-zinc-800" onClick={() => onEdit(item)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => onDelete(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};