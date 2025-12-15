import React, { useState, useEffect, useMemo } from 'react';
import { Item, ItemType, ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { ItemCard } from './components/ItemCard';
import { ItemForm } from './components/ItemForm';
import { CategoryForm } from './components/CategoryForm';
import { Button, Input } from './components/ui';
import { Search, Plus, Menu, X, Filter } from 'lucide-react';

const STORAGE_KEY = 'devvault_items_v2';
const CATEGORIES_KEY = 'devvault_categories_v1';

// Initial data for demo
const DEMO_ITEMS: Item[] = [
  {
    id: '1',
    type: 'prompt',
    category: 'React',
    title: 'Experto en React Senior',
    content: 'Actúa como un ingeniero Frontend Senior especializado en React. Tu objetivo es revisar el siguiente código buscando problemas de rendimiento, malas prácticas y errores de tipado en TypeScript.',
    description: 'Para Code Reviews y optimización.',
    tags: ['react', 'code-review', 'frontend'],
    createdAt: Date.now() - 100000
  },
  {
    id: '2',
    type: 'command',
    category: 'NPM',
    title: 'Eliminar node_modules recursivamente',
    content: 'find . -name "node_modules" -type d -prune -exec rm -rf \'{}\' +',
    description: 'Limpia espacio en disco eliminando todas las carpetas node_modules.',
    tags: ['bash', 'cleanup', 'npm'],
    createdAt: Date.now() - 200000
  },
  {
    id: '3',
    type: 'command',
    category: 'Azure',
    title: 'Crear Web App en Azure',
    content: 'az webapp up --name <app_name> --resource-group <resource_group> --runtime "NODE|18-lts"',
    description: 'Comando rápido para desplegar una aplicación Node.js en Azure App Service.',
    tags: ['azure', 'deployment', 'cloud'],
    createdAt: Date.now()
  },
  {
    id: '4',
    type: 'prompt',
    category: 'General',
    title: 'Mejorar redacción de email',
    content: 'Reescribe el siguiente correo para que suene más profesional y conciso, manteniendo un tono amable.',
    description: 'Útil para correos de trabajo.',
    tags: ['writing', 'email', 'productivity'],
    createdAt: Date.now() - 50000
  }
];

const DEFAULT_CATEGORIES = ['General', 'Azure', 'AWS', 'React', 'NPM', 'Docker', 'Git'];

function App() {
  // State
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEMO_ITEMS;
  });

  const [definedCategories, setDefinedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(definedCategories));
  }, [definedCategories]);

  // Derived State
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by Context/Category (Takes precedence or works alongside filters)
    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory);
    } else {
        // Only filter by type if no specific category is selected (Optional UX choice)
        if (viewMode === 'prompts') {
            result = result.filter(i => i.type === 'prompt');
        } else if (viewMode === 'commands') {
            result = result.filter(i => i.type === 'command');
        }
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.tags.some(t => t.toLowerCase().includes(q)) ||
        i.category.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q)
      );
    }

    // Sort by Date DESC
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [items, viewMode, selectedCategory, searchQuery]);

  const itemCounts = useMemo(() => ({
    all: items.length,
    prompts: items.filter(i => i.type === 'prompt').length,
    commands: items.filter(i => i.type === 'command').length,
  }), [items]);

  const sidebarCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize defined categories with 0
    definedCategories.forEach(cat => {
        counts[cat] = 0;
    });

    // Count items
    items.forEach(item => {
      const cat = item.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        // Sort: Defined ones first (optional), or just by count then alpha
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [items, definedCategories]);

  // Handlers
  const handleAddCategory = (name: string) => {
    if (!definedCategories.includes(name)) {
        setDefinedCategories([...definedCategories, name]);
    }
  };

  const handleAddItem = (newItem: Omit<Item, 'id' | 'createdAt'>) => {
    // If the item uses a new category, add it to defined list
    if (newItem.category && !definedCategories.includes(newItem.category)) {
        setDefinedCategories([...definedCategories, newItem.category]);
    }

    const item: Item = {
      ...newItem,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setItems([item, ...items]);
  };

  const handleUpdateItem = (updatedFields: Omit<Item, 'id' | 'createdAt'>) => {
    // If the item uses a new category, add it to defined list
    if (updatedFields.category && !definedCategories.includes(updatedFields.category)) {
        setDefinedCategories([...definedCategories, updatedFields.category]);
    }

    if (!editingItem) return;
    const updatedItem: Item = {
      ...editingItem,
      ...updatedFields
    };
    setItems(items.map(i => i.id === editingItem.id ? updatedItem : i));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este elemento?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card relative z-10">
        <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">DevVault</h1>
        <Button size="icon" variant="ghost" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-20 px-4">
           <Sidebar 
            currentView={viewMode}
            selectedCategory={selectedCategory}
            onViewChange={(v) => { setViewMode(v); setMobileMenuOpen(false); }}
            onCategorySelect={(c) => { setSelectedCategory(c); setMobileMenuOpen(false); }}
            onAddNew={() => { setIsModalOpen(true); setMobileMenuOpen(false); }}
            onAddCategory={() => { setIsCategoryModalOpen(true); setMobileMenuOpen(false); }}
            itemCounts={itemCounts}
            categories={sidebarCategories}
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar 
        currentView={viewMode} 
        selectedCategory={selectedCategory}
        onViewChange={setViewMode}
        onCategorySelect={setSelectedCategory}
        onAddNew={() => { setEditingItem(null); setIsModalOpen(true); }}
        onAddCategory={() => setIsCategoryModalOpen(true)}
        itemCounts={itemCounts}
        categories={sidebarCategories}
      />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen p-4 md:p-8 relative z-10">
        
        {/* Top Bar */}
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground text-sm font-medium">Dashboard / </span>
                        <span className="text-foreground text-sm font-medium">{selectedCategory ? selectedCategory : (viewMode === 'all' ? 'Todo' : viewMode === 'prompts' ? 'Prompts' : 'Comandos')}</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                    {selectedCategory ? `Contexto: ${selectedCategory}` : (viewMode === 'all' ? 'Vista General' : viewMode === 'prompts' ? 'Mis Prompts' : 'CLI Commands')}
                    </h2>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72 group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                            placeholder="Buscar..." 
                            className="pl-9 bg-black/50 border-white/10 focus:border-indigo-500/50 relative z-10 h-10 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            {/* Context Filters (Quick Chips) - Visible if we are in 'All' view and no specific category selected */}
            {!selectedCategory && viewMode === 'all' && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {sidebarCategories.slice(0, 6).map(cat => (
                        <button 
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:bg-white/10 hover:border-white/20 transition-colors whitespace-nowrap"
                        >
                            {cat.name} <span className="text-muted-foreground ml-1">{cat.count}</span>
                        </button>
                    ))}
                    <button 
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-full border border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-white/40 text-xs flex items-center transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>

        {/* Content Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <div className="bg-white/5 p-4 rounded-full mb-4 shadow-xl">
               <Filter className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-white">Nada por aquí</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
              {searchQuery ? 'No se encontraron resultados para tu búsqueda.' : 'Este contexto está vacío. Agrega tu primer recurso.'}
            </p>
            <div className="flex gap-3">
                <Button onClick={() => setIsModalOpen(true)} className="bg-white text-black hover:bg-zinc-200">
                    <Plus className="mr-2 h-4 w-4" /> Crear Nuevo
                </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onDelete={handleDeleteItem}
                onEdit={handleEditClick}
                onCopy={handleCopy}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ItemForm 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={editingItem ? handleUpdateItem : handleAddItem}
        initialData={editingItem}
        categories={definedCategories}
      />

      <CategoryForm 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />
      
    </div>
  );
}

export default App;