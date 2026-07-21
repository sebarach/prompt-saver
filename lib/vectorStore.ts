/**
 * Vector store using IndexedDB for persistent embedding storage.
 * Stores item embeddings and performs cosine similarity search.
 */

import { embed, getEmbedder } from './embedding';

const DB_NAME = 'prompt-vault-vectors';
const DB_VERSION = 1;
const STORE_NAME = 'embeddings';

interface EmbeddingRecord {
  id: string;           // item ID
  embedding: Float32Array;
  updatedAt: number;    // timestamp of last embedding generation
  text: string;         // source text used for embedding (title + content + tags)
}

let dbInstance: IDBDatabase | null = null;

/**
 * Open (or create) the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Build the text representation for embedding.
 * Combines title, content, tags, and category for richer semantic signal.
 */
function buildItemText(item: { title: string; content: string; categoryName?: string; tags: string[]; description?: string }): string {
  const parts = [item.title, item.categoryName ?? '', item.content];
  if (item.description) parts.push(item.description);
  if (item.tags.length > 0) parts.push(item.tags.join(' '));
  return parts.join(' ');
}

/**
 * Store an embedding for an item. Generates embedding if not provided.
 */
export async function putEmbedding(
  item: { id: string; title: string; content: string; categoryName?: string; tags: string[]; description?: string },
): Promise<void> {
  const db = await openDB();
  const text = buildItemText(item);
  const embedding = await embed(text);

  const record: EmbeddingRecord = {
    id: item.id,
    embedding,
    updatedAt: Date.now(),
    text,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Remove an embedding by item ID.
 */
export async function deleteEmbedding(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export interface SearchResult {
  id: string;
  score: number;
}

/**
 * Search for items similar to a query string.
 * Returns results sorted by cosine similarity (highest first).
 */
export async function semanticSearch(query: string, topK = 10): Promise<SearchResult[]> {
  const queryEmbedding = await embed(query);
  const db = await openDB();

  const records: EmbeddingRecord[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const scored = records
    .map((record) => ({
      id: record.id,
      score: cosineSimilarity(queryEmbedding, record.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

/**
 * Ensure all items have embeddings. Generates missing ones in batch.
 * Returns the number of new embeddings generated.
 */
export async function syncEmbeddings(
  items: Array<{ id: string; title: string; content: string; categoryName?: string; tags: string[]; description?: string; createdAt: number }>,
): Promise<number> {
  const db = await openDB();

  // Get existing IDs
  const existingIds = new Set<string>(
    await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    }),
  );

  const missing = items.filter((item) => !existingIds.has(item.id));
  if (missing.length === 0) return 0;

  // Generate embeddings for missing items
  for (const item of missing) {
    await putEmbedding(item);
  }

  return missing.length;
}

/**
 * Check how many embeddings are stored.
 */
export async function getEmbeddingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all stored embeddings (for reset/debugging).
 */
export async function clearAllEmbeddings(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
