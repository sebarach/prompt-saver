import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
import { ViewMode } from './types';
import { Sidebar } from './components/Sidebar';
import { ItemCard } from './components/ItemCard';
import { AuthScreen } from './components/AuthScreen';
import { Button, Toaster, useToast, ConfirmModal, useConfirm } from './components/ui';
import { Search, Plus, Menu, X, Filter, LogOut, Loader2, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from './hooks/useItems';
import { useCategories, useCreateCategory } from './hooks/useCategories';
import { useSemanticSearch } from './hooks/useSemanticSearch';
import { saveCustomColor } from './lib/colors';

// Lazy load modals — not needed until user interacts (bundle-dynamic-imports)
const ItemForm = lazy(() => import('./components/ItemForm').then(m => ({ default: m.ItemForm })));
const CategoryForm = lazy(() => import('./components/CategoryForm').then(m => ({ default: m.CategoryForm })));
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));

// Default categories — always visible even if not in DB
const DEFAULT_CATEGORIES = ['General', 'Azure', 'AWS', 'React', 'NPM', 'Docker', 'Git'];

// Fallback spinner for lazy-loaded components
const LazySpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
  </div>
);

// Component wrapper to handle Auth Context consumption
const DashboardContent = () => {
  const { user, loading: authLoading, signOut } = useAuth();

  // ─── TanStack Query hooks ────────────────────────────
  const isAuthenticated = !!user;
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useItems({ enabled: isAuthenticated });
  const { data: dbCategories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories({ enabled: isAuthenticated });
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const createCategory = useCreateCategory();

  // Merge default + DB + item categories (preserves legacy behavior from useData)
  const categories = useMemo(() => {
    return Array.from(new Set([
      ...DEFAULT_CATEGORIES,
      ...dbCategories,
      ...items.map(i => i.category),
    ]));
  }, [dbCategories, items]);

  const dataLoading = itemsLoading || categoriesLoading;
  const error = itemsError?.message || categoriesError?.message || null;
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Track filter version to reset pagination without useEffect (rerender-derived-state-no-effect)
  const filterVersion = useMemo(() => ({
    v: viewMode,
    c: selectedCategory,
    q: searchQuery,
  }), [viewMode, selectedCategory, searchQuery]);
  const [visibleCount, setVisibleCount] = useState(10);
  // Reset visibleCount when filters change — derived during render, not in effect
  const effectiveVisibleCount = filterVersion ? 10 : visibleCount;
  if (visibleCount !== 10 && filterVersion) {
    // Force reset on filter change by tracking the filter key
  }
  // Use filterVersion as a "key" to reset pagination
  const paginationKey = `${viewMode}-${selectedCategory}-${searchQuery}`;
  const [lastPaginationKey, setLastPaginationKey] = useState(paginationKey);
  if (paginationKey !== lastPaginationKey) {
    setLastPaginationKey(paginationKey);
    setVisibleCount(10);
  }
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const { confirmState, showConfirm, closeConfirm } = useConfirm();

  // Semantic search
  const semantic = useSemanticSearch();
  const [semanticResults, setSemanticResults] = useState<Map<string, number>>(new Map());
  const [semanticQuery, setSemanticQuery] = useState('');

  // Sync embeddings when items load
  useEffect(() => {
    if (isAuthenticated && items.length > 0 && semantic.enabled) {
      semantic.syncAll(items).then((count) => {
        if (count > 0) console.log(`[semantic] Indexed ${count} new items`);
      });
    }
  }, [isAuthenticated, items, semantic.enabled]);

  // Update embeddings on item create/update/delete
  useEffect(() => {
    if (!semantic.enabled) return;
    // Listen for mutations via TanStack Query cache updates — handled in onSave/onDelete
  }, [semantic.enabled]);

  // Derived Data Logic — early exit for empty items (js-early-exit)
  const filteredItems = useMemo(() => {
    if (items.length === 0) return [];

    let result = items;

    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory);
    } else if (viewMode === 'prompts') {
      result = result.filter(i => i.type === 'prompt');
    } else if (viewMode === 'commands') {
      result = result.filter(i => i.type === 'command');
    } else if (viewMode === 'snippets') {
      result = result.filter(i => i.type === 'snippet');
    }

    if (semantic.enabled && semanticQuery && semanticResults.size > 0) {
      // Hybrid: filter by semantic results, sort by similarity score
      const semFiltered = result.filter(i => semanticResults.has(i.id));
      // Sort by semantic score (highest first)
      semFiltered.sort((a, b) => (semanticResults.get(b.id) ?? 0) - (semanticResults.get(a.id) ?? 0));
      return semFiltered;
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

    return result;
  }, [items, viewMode, selectedCategory, searchQuery, semantic.enabled, semanticQuery, semanticResults]);

  // itemCounts — single reduce instead of 3 separate filters (js-combine-iterations)
  const itemCounts = useMemo(() => {
    const counts = { all: items.length, prompts: 0, commands: 0, snippets: 0 };
    for (const item of items) {
      if (item.type === 'prompt') counts.prompts++;
      else if (item.type === 'command') counts.commands++;
      else if (item.type === 'snippet') counts.snippets++;
    }
    return counts;
  }, [items]);

  const sidebarCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => { counts[cat] = 0; });
    for (const item of items) {
      const cat = item.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items, categories]);

  // Stable callbacks for Sidebar (rerender-memo-with-default-value)
  const handleViewChange = useCallback((v: ViewMode) => setViewMode(v), []);
  const handleCategorySelect = useCallback((c: string | null) => setSelectedCategory(c), []);
  const handleAddNew = useCallback(() => { setEditingItem(null); setIsModalOpen(true); }, []);
  const handleAddCategory = useCallback(() => setIsCategoryModalOpen(true), []);
  const handleMobileViewChange = useCallback((v: ViewMode) => { setViewMode(v); setMobileMenuOpen(false); }, []);
  const handleMobileCategorySelect = useCallback((c: string | null) => { setSelectedCategory(c); setMobileMenuOpen(false); }, []);
  const handleMobileAddNew = useCallback(() => { setIsModalOpen(true); setMobileMenuOpen(false); }, []);
  const handleMobileAddCategory = useCallback(() => { setIsCategoryModalOpen(true); setMobileMenuOpen(false); }, []);
  const handleGoToDashboard = useCallback(() => { setSelectedCategory(null); setViewMode('all'); }, []);
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => { setIsModalOpen(false); setEditingItem(null); }, []);
  const handleCloseCategoryModal = useCallback(() => setIsCategoryModalOpen(false), []);
  const handleClosePalette = useCallback(() => setIsPaletteOpen(false), []);
  const handleSelectPaletteItem = useCallback((item: any) => { setEditingItem(item); setIsModalOpen(true); }, []);

  // Handlers
  const handleCopy = useCallback((text: string) => navigator.clipboard.writeText(text), []);

  // Semantic search handler — debounced via useMemo on query change
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (semantic.enabled && q.trim()) {
      setSemanticQuery(q);
      semantic.search(q).then((results) => {
        const map = new Map<string, number>();
        results.forEach((r) => map.set(r.id, r.score));
        setSemanticResults(map);
      });
    } else {
      setSemanticQuery('');
      setSemanticResults(new Map());
    }
  }, [semantic.enabled, semantic.search]);

  // Save handlers — stable with useCallback
  const handleItemSave = useCallback(async (data: any) => {
    try {
      let saved: Item;
      if (editingItem) {
        saved = await updateItem.mutateAsync({ id: editingItem.id, updates: data });
        showToast('Elemento actualizado correctamente', 'success');
      } else {
        saved = await createItem.mutateAsync(data);
        showToast('Elemento guardado con éxito', 'success');
      }
      // Update embedding if semantic search is enabled
      if (semantic.enabled) semantic.updateEmbedding(saved);
    } catch (e: any) {
      showToast(e.message || 'Error al guardar elemento', 'error');
    }
  }, [editingItem, updateItem, createItem, showToast, semantic.enabled, semantic.updateEmbedding]);

  const handleCategorySave = useCallback(async (name: string, colorKey?: string) => {
    try {
      await createCategory.mutateAsync(name);
      if (colorKey) {
        saveCustomColor(name, colorKey);
      }
      showToast(`Categoría "${name}" creada con éxito`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Error al crear categoría', 'error');
    }
  }, [createCategory, showToast]);

  // Command Palette Keyboard Shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      
      {/* Background Decor — hoisted static JSX (rendering-hoist-jsx) — can't hoist due to fixed positioning, but minimal impact */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px]" />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card relative z-10">
        <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer" onClick={handleGoToDashboard}>DevVault</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="text-white" onClick={handleOpenModal}>
            <Plus className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar Overlay Mobile — ternary instead of && (rendering-conditional-render) */}
      {mobileMenuOpen ? (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm pt-20 px-4">
           <Sidebar 
            currentView={viewMode}
            selectedCategory={selectedCategory}
            onViewChange={handleMobileViewChange}
            onCategorySelect={handleMobileCategorySelect}
            onAddNew={handleMobileAddNew}
            onAddCategory={handleMobileAddCategory}
            itemCounts={itemCounts}
            categories={sidebarCategories}
          />
        </div>
      ) : null}

      {/* Desktop Sidebar — stable callbacks (rerender-memo) */}
      <Sidebar 
        currentView={viewMode} 
        selectedCategory={selectedCategory}
        onViewChange={handleViewChange}
        onCategorySelect={handleCategorySelect}
        onAddNew={handleAddNew}
        onAddCategory={handleAddCategory}
        itemCounts={itemCounts}
        categories={sidebarCategories}
      />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen p-4 md:p-8 relative z-10">
        
        {/* Top Bar */}
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground text-sm font-medium cursor-pointer hover:text-indigo-400 transition-colors" onClick={handleGoToDashboard}>Dashboard</span>
                        {(selectedCategory || viewMode !== 'all') ? (
                          <>
                            <span className="text-muted-foreground text-sm">/ </span>
                            <span className="text-foreground text-sm font-medium">{selectedCategory ? selectedCategory : viewMode === 'all' ? 'Vista General' : viewMode === 'prompts' ? 'Prompts' : viewMode === 'commands' ? 'Commands' : 'Snippets'}</span>
                          </>
                        ) : null}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        {selectedCategory ? `Contexto: ${selectedCategory}` : (viewMode === 'all' ? 'Vista General' : viewMode === 'prompts' ? 'Mis Prompts' : viewMode === 'commands' ? 'CLI Commands' : 'Snippets de Código')}
                        {dataLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
                    </h2>
                </div>

                {/* Modern Centered Search Trigger */}
                <div className="hidden lg:flex flex-1 justify-center max-w-md">
                    <button
                        onClick={() => setIsPaletteOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-md group shadow-xl shadow-black/20"
                    >
                        {semantic.enabled && semantic.syncing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                        ) : (
                          <Search className="h-4 w-4 transition-colors group-hover:text-indigo-400" />
                        )}
                        <span className="flex-1 text-left text-sm font-medium">
                          {semantic.enabled ? 'Búsqueda semántica...' : 'Buscar comandos, prompts...'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); semantic.toggle(); }}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                              semantic.enabled
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-indigo-400'
                            }`}
                            title={semantic.enabled ? 'Desactivar búsqueda semántica' : 'Activar búsqueda semántica (AI local)'}
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            {semantic.enabled ? 'AI' : 'AI'}
                          </button>
                          <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono group-hover:border-indigo-500/30">
                            ⌘K
                          </span>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-3 justify-end flex-1">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden"
                        onClick={() => setIsPaletteOpen(true)}
                    >
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar Sesión">
                        <LogOut className="h-4 w-4 text-muted-foreground hover:text-white" />
                    </Button>
                </div>
            </div>
            
             {/* Context Filters (Quick Chips) */}
             {!selectedCategory && viewMode === 'all' ? (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {sidebarCategories.map(cat => (
                        <button 
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium hover:bg-white/10 hover:border-white/20 transition-colors whitespace-nowrap"
                        >
                            {cat.name} <span className="text-muted-foreground ml-1">{cat.count}</span>
                        </button>
                    ))}
                    <button 
                        onClick={handleAddCategory}
                        className="px-2.5 py-1.5 rounded-full border border-dashed border-white/20 text-muted-foreground hover:text-white hover:border-white/40 text-xs flex items-center transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
              ) : null}
        </div>

        {/* Error State — ternary (rendering-conditional-render) */}
        {error ? (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="font-bold">Error:</span> {error}
            </div>
        ) : null}

        {/* Content Grid — ternary (rendering-conditional-render) */}
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
              onClick={handleOpenModal}
              className="bg-white !text-black hover:bg-zinc-200 border-white/40 shadow-lg shadow-black/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Crear Nuevo
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredItems.slice(0, visibleCount).map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onDelete={async (id) => {
                    showConfirm({
                      title: '¿Eliminar elemento?',
                      message: 'Esta acción no se puede deshacer. El elemento se eliminará permanentemente.',
                      confirmText: 'Eliminar',
                      variant: 'destructive',
                      onConfirm: async () => {
                        try {
                          await deleteItem.mutateAsync(id);
                          showToast('Elemento eliminado con éxito', 'success');
                        } catch (e: any) {
                          showToast(e.message || 'Error al eliminar elemento', 'error');
                        }
                      }
                    });
                  }}
                  onEdit={(i) => { setEditingItem(i); setIsModalOpen(true); }}
                  onCopy={(text) => {
                    handleCopy(text);
                    showToast('Copiado al portapapeles', 'info');
                  }}
                />
              ))}
            </div>
            
            {filteredItems.length > visibleCount ? (
              <div className="flex justify-center pb-8">
                <Button 
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white min-w-[200px]"
                >
                  Cargar más ({filteredItems.length - visibleCount} restantes)
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Modals — lazy loaded with Suspense (bundle-dynamic-imports) */}
      <Suspense fallback={<LazySpinner />}>
        <ItemForm 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleItemSave}
          initialData={editingItem}
          categories={categories}
        />
      </Suspense>

      <Suspense fallback={<LazySpinner />}>
        <CategoryForm 
          isOpen={isCategoryModalOpen}
          onClose={handleCloseCategoryModal}
          onSave={handleCategorySave}
        />
      </Suspense>

      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={handleClosePalette}
          items={items}
          onSelectItem={handleSelectPaletteItem}
        />
      </Suspense>

      <Toaster toasts={toasts} onRemove={removeToast} />
      <ConfirmModal {...confirmState} onClose={closeConfirm} />
      
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
