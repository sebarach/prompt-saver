/**
 * Hook for semantic search powered by local embeddings.
 * Integrates with the existing item list to provide hybrid search
 * (textual + semantic) when semantic mode is enabled.
 */

import { useState, useCallback, useRef } from 'react';
import { Item } from '../types';
import { semanticSearch, syncEmbeddings, putEmbedding, deleteEmbedding, SearchResult } from '../lib/vectorStore';
import { getEmbeddingStatus } from '../lib/embedding';

interface UseSemanticSearchReturn {
  /** Whether semantic search mode is active */
  enabled: boolean;
  /** Toggle semantic search on/off */
  toggle: () => void;
  /** Model loading state */
  modelStatus: { loaded: boolean; loading: boolean; backend: string };
  /** Perform semantic search and return ranked item IDs */
  search: (query: string) => Promise<SearchResult[]>;
  /** Sync embeddings for all items (call on mount) */
  syncAll: (items: Item[]) => Promise<number>;
  /** Update embedding for a single item */
  updateEmbedding: (item: Item) => Promise<void>;
  /** Remove embedding for an item */
  removeEmbedding: (id: string) => Promise<void>;
  /** Number of indexed items */
  indexedCount: number;
  /** Whether sync is in progress */
  syncing: boolean;
}

export function useSemanticSearch(): UseSemanticSearchReturn {
  const [enabled, setEnabled] = useState(false);
  const [modelStatus, setModelStatus] = useState(getEmbeddingStatus());
  const [indexedCount, setIndexedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncRef = useRef(false);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      // Refresh model status when enabling
      if (next) setModelStatus(getEmbeddingStatus());
      return next;
    });
  }, []);

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    try {
      const results = await semanticSearch(query, 20);
      return results;
    } catch (err) {
      console.error('[semantic-search] Search failed:', err);
      return [];
    }
  }, []);

  const syncAll = useCallback(async (items: Item[]): Promise<number> => {
    if (syncRef.current) return 0;
    syncRef.current = true;
    setSyncing(true);

    try {
      const count = await syncEmbeddings(items);
      setIndexedCount(items.length);
      setModelStatus(getEmbeddingStatus());
      return count;
    } catch (err) {
      console.error('[semantic-search] Sync failed:', err);
      return 0;
    } finally {
      syncRef.current = false;
      setSyncing(false);
    }
  }, []);

  const updateEmbedding = useCallback(async (item: Item) => {
    try {
      await putEmbedding(item);
    } catch (err) {
      console.error('[semantic-search] Update embedding failed:', err);
    }
  }, []);

  const removeEmbedding = useCallback(async (id: string) => {
    try {
      await deleteEmbedding(id);
    } catch (err) {
      console.error('[semantic-search] Remove embedding failed:', err);
    }
  }, []);

  return {
    enabled,
    toggle,
    modelStatus,
    search,
    syncAll,
    updateEmbedding,
    removeEmbedding,
    indexedCount,
    syncing,
  };
}
