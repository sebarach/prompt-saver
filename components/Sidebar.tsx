import React from 'react';
import { ViewMode } from '../types';
import { Button } from './ui';
import { LayoutDashboard, Terminal, MessageSquare, Plus, Layers, Cloud, Box, Hash, Code2, ShieldAlert, Cpu, Globe } from 'lucide-react';
import { getColorForCategory } from '../lib/colors';

interface SidebarProps {
  currentView: ViewMode;
  selectedCategory: string | null;
  onViewChange: (view: ViewMode) => void;
  onCategorySelect: (category: string | null) => void;
  onAddNew: () => void;
  onAddCategory: () => void;
  itemCounts: { all: number; prompts: number; commands: number; snippets: number };
  categories: { name: string; count: number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  selectedCategory, 
  onViewChange, 
  onCategorySelect,
  onAddNew, 
  onAddCategory,
  itemCounts,
  categories 
}) => {
  
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todo', icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { id: 'prompts', label: 'Prompts', icon: <MessageSquare className="mr-2 h-4 w-4" /> },
    { id: 'commands', label: 'Comandos', icon: <Terminal className="mr-2 h-4 w-4" /> },
    { id: 'snippets', label: 'Snippets', icon: <Code2 className="mr-2 h-4 w-4" /> },
  ];

  // Helper to get icon for category
  const getCategoryIcon = (cat: string) => {
    const c = cat.toLowerCase();
    const colorClass = getColorForCategory(cat).text;
    
    if (c.includes('azure') || c.includes('aws') || c.includes('cloud')) {
        return <Cloud className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    if (c.includes('npm') || c.includes('node') || c.includes('git')) {
        return <Box className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    if (c.includes('react') || c.includes('js') || c.includes('ts')) {
        return <Code2 className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    if (c.includes('secret') || c.includes('cred') || c.includes('pass') || c.includes('key')) {
        return <ShieldAlert className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    if (c.includes('python') || c.includes('ai') || c.includes('ml')) {
        return <Cpu className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    if (c.includes('api') || c.includes('web') || c.includes('http')) {
        return <Globe className={`mr-2 h-4 w-4 ${colorClass}`} />;
    }
    return <Hash className={`mr-2 h-4 w-4 ${colorClass}`} />;
  };

  return (
    <aside className="w-64 border-r border-border bg-black/40 backdrop-blur-xl hidden md:flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Terminal className="h-3 w-3 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">DevVault</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-2 pl-1">Knowledge Base v1.0</p>
      </div>
      
      <div className="px-4 mb-6">
         <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 border border-indigo-500/20" onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Item
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 mb-2">
          <h3 className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 px-2 tracking-wider">Biblioteca</h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id && !selectedCategory ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${currentView === item.id && !selectedCategory ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
                onClick={() => { onViewChange(item.id); onCategorySelect(null); }}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <span className="ml-auto text-xs opacity-50">
                  {itemCounts[item.id]}
                </span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-2">
              <Layers className="h-3 w-3" /> Contextos
            </h3>
            <button 
              onClick={onAddCategory} 
              className="text-muted-foreground hover:text-white hover:bg-white/10 rounded p-1 transition-colors"
              title="Agregar Categoría"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          
          <nav className="space-y-1">
            {categories.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${selectedCategory === cat.name ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white'}`}
                onClick={() => onCategorySelect(cat.name)}
              >
                {getCategoryIcon(cat.name)}
                <span className="flex-1 text-left truncate">{cat.name}</span>
                <span className="ml-auto text-xs opacity-50">{cat.count}</span>
              </Button>
            ))}

            <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground/60 hover:text-white hover:bg-white/5 mt-3 border border-dashed border-white/10 h-8"
                onClick={onAddCategory}
            >
                <Plus className="mr-2 h-3 w-3" />
                <span className="text-xs">Nueva Categoría</span>
            </Button>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-inner" />
          <div className="text-sm">
            <p className="font-medium text-white/90">Admin</p>
            <p className="text-xs text-muted-foreground">Local Storage</p>
          </div>
        </div>
      </div>
    </aside>
  );
};