import React, { useState, useMemo } from 'react';
import { ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { ItemCard } from './components/ItemCard';
import { ItemForm } from './components/ItemForm';
import { CategoryForm } from './components/CategoryForm';
import { AuthScreen } from './components/AuthScreen';
import { Button, Input } from './components/ui';
import { Search, Plus, Menu, X, Filter, LogOut, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useData } from './hooks/useData';

// Component wrapper to handle Auth Context consumption
const DashboardContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { items, categories, loading: dataLoading, error, addItem, updateItem, deleteItem, addCategory } = useData();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derived Data Logic
  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory);
    } else {
        if (viewMode === 'prompts') {
            result = result.filter(i => i.type === 'prompt');
        } else if (viewMode === 'commands') {
            result = result.filter(i => i.type === 'command');
        }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.tags.some(t => t.toLowerCase().includes(q)) ||
        i.category.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q)
      );
    }

    return result; // Order handled by Service/DB
  }, [items, viewMode, selectedCategory, searchQuery]);

  const itemCounts = useMemo(() => ({
    all: items.length,
    prompts: items.filter(i => i.type === 'prompt').length,
    commands: items.filter(i => i.type === 'command').length,
  }), [items]);

  const sidebarCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => { counts[cat] = 0; }); // Init
    items.forEach(item => {
      const cat = item.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items, categories]);

  // Handlers
  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-muted-foreground text-sm">Conectando a DevVault...</p>
      </div>
    );
  }

  if (!user) {
      return <AuthScreen />;
  }

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
        <Button size="icon" variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar Overlay Mobile */}
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
                        <span className="text-foreground text-sm font-medium">{selectedCategory ? selectedCategory : viewMode}</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        {selectedCategory ? `Contexto: ${selectedCategory}` : (viewMode === 'all' ? 'Vista General' : viewMode === 'prompts' ? 'Mis Prompts' : 'CLI Commands')}
                        {dataLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </h2>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72 group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                            placeholder="Buscar..." 
                            className="pl-9 bg-black/50 border-white/10 focus:border-indigo-500/50 relative z-10 h-10 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar Sesión">
                        <LogOut className="h-4 w-4 text-muted-foreground hover:text-white" />
                    </Button>
                </div>
            </div>
            
             {/* Context Filters (Quick Chips) */}
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

        {/* Error State */}
        {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
            </div>
        )}

        {/* Content Grid */}
        {filteredItems.length === 0 && !dataLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <div className="bg-white/5 p-4 rounded-full mb-4 shadow-xl">
               <Filter className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-white">Nada por aquí</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1 mb-6">
              {searchQuery ? 'No se encontraron resultados.' : 'Este contexto está vacío.'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(true)} 
              className="bg-white !text-black hover:bg-zinc-200 border-white/40 shadow-lg shadow-black/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Nuevo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onDelete={deleteItem}
                onEdit={(i) => { setEditingItem(i); setIsModalOpen(true); }}
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
        onSave={async (data) => {
            if (editingItem) {
                await updateItem(editingItem.id, data);
            } else {
                await addItem(data);
            }
        }}
        initialData={editingItem}
        categories={categories}
      />

      <CategoryForm 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={addCategory}
      />
      
    </div>
  );
};

// Root App Component
function App() {
    return (
        <AuthProvider>
            <DashboardContent />
        </AuthProvider>
    );
}

export default App;
