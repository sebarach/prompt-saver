/**
 * Embedding service using Transformers.js
 * Generates 384-dim sentence embeddings via all-MiniLM-L6-v2
 * Runs entirely in the browser (WebGPU / WASM fallback)
 */

import { pipeline, Pipeline, env } from '@huggingface/transformers';

// Skip local model check — download from HuggingFace Hub
env.allowLocalModels = false;

// Singleton pipeline instance
let embedder: Pipeline | null = null;
let loadingPromise: Promise<Pipeline> | null = null;

/**
 * Initialize the feature-extraction pipeline.
 * Downloads model on first call (~30MB), cached by browser thereafter.
 */
export async function getEmbedder(): Promise<Pipeline> {
  if (embedder) return embedder;

  if (loadingPromise) return loadingPromise;

  loadingPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    progress_callback: (progress: { status: string; progress?: number }) => {
      if (progress.status === 'progress' && progress.progress) {
        console.log(`[embedding] Download: ${Math.round(progress.progress)}%`);
      }
    },
  });

  embedder = await loadingPromise;
  return embedder;
}

/**
 * Generate a 384-dim embedding for a text string.
 * Returns a Float32Array suitable for cosine similarity comparison.
 */
export async function embed(text: string): Promise<Float32Array> {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return output.data as Float32Array;
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  const extractor = await getEmbedder();
  const results: Float32Array[] = [];

  // Process sequentially to avoid memory spikes
  for (const text of texts) {
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    results.push(output.data as Float32Array);
  }

  return results;
}

/**
 * Check if WebGPU is available for accelerated inference.
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Get model loading status info for UI display.
 */
export function getEmbeddingStatus(): { loaded: boolean; loading: boolean; backend: string } {
  return {
    loaded: embedder !== null,
    loading: loadingPromise !== null && embedder === null,
    backend: isWebGPUAvailable() ? 'WebGPU' : 'WASM',
  };
}
