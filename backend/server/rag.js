import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db.js';
import { Chunk } from './models.js';
import mongoose from 'mongoose';

// Concurrency control utility
export function pLimit(concurrency) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    if (queue.length === 0) return;
    if (activeCount >= concurrency) return;

    activeCount++;
    const { fn, resolve, reject } = queue.shift();
    
    Promise.resolve()
      .then(() => fn())
      .then(val => {
        activeCount--;
        resolve(val);
        next();
      })
      .catch(err => {
        activeCount--;
        reject(err);
        next();
      });
  };

  return (fn) => {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  };
}

// Chunk text into overlapping parts
export function chunkText(text, size = 800, overlap = 150) {
  const chunks = [];
  let i = 0;
  
  // Clean whitespace
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  while (i < cleanedText.length) {
    let end = Math.min(i + size, cleanedText.length);
    
    // Look for sentence boundaries (periods followed by space) to avoid clipping sentences
    if (end < cleanedText.length) {
      const boundaryIndex = cleanedText.lastIndexOf('. ', end);
      if (boundaryIndex > i + size - 150) {
        end = boundaryIndex + 1; // Include the period
      } else {
        const spaceIndex = cleanedText.lastIndexOf(' ', end);
        if (spaceIndex > i + size - 100) {
          end = spaceIndex + 1; // Include the space
        }
      }
    }
    
    const chunk = cleanedText.slice(i, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    
    i = end - overlap;
    if (i >= cleanedText.length - overlap) break;
  }
  
  // Final cleanup and deduplication
  return chunks.filter((value, index, self) => self.indexOf(value) === index);
}

// Fetch single embedding using Gemini API
export async function getEmbedding(text, apiKey) {
  let key = apiKey;
  if (key) {
    key = key.trim();
    if (key === 'undefined' || key === 'null' || key.includes(' ') || key.length < 10) {
      key = null;
    }
  }
  if (!key) {
    throw new Error('Gemini API Key is missing. Please configure it in Settings.');
  }
  
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  
  if (result && result.embedding && result.embedding.values) {
    return result.embedding.values;
  }
  throw new Error('Failed to generate embedding from Gemini API.');
}

// Generate embeddings for multiple text chunks concurrently or in batch
export async function getEmbeddingsForChunks(textChunks, apiKey) {
  let key = apiKey;
  if (key) {
    key = key.trim();
    if (key === 'undefined' || key === 'null' || key.includes(' ') || key.length < 10) {
      key = null;
    }
  }
  if (!key) {
    throw new Error('Gemini API Key is missing. Please configure it in Settings.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  // Preferred: Use Gemini batch embedding endpoint if available
  try {
    if (typeof model.batchEmbedContents === 'function') {
      const embeddings = [];
      const batchSize = 100; // Safe batch limit for Gemini embeddings
      for (let i = 0; i < textChunks.length; i += batchSize) {
        const batch = textChunks.slice(i, i + batchSize);
        const batchResult = await model.batchEmbedContents({
          requests: batch.map(text => ({
            content: { parts: [{ text }] }
          }))
        });
        if (batchResult && batchResult.embeddings) {
          const values = batchResult.embeddings.map(e => e.values);
          embeddings.push(...values);
        } else {
          throw new Error('Invalid batch embedding response format.');
        }
      }
      return embeddings;
    }
  } catch (err) {
    console.warn('Batch embedding failed or is not available. Falling back to concurrent requests:', err.message);
  }

  // Fallback: Concurrent individual calls using pLimit
  const limit = pLimit(8);
  const promises = textChunks.map(text => limit(async () => {
    return getEmbedding(text, apiKey);
  }));
  return Promise.all(promises);
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search vector database for similar chunks
export async function searchChunks(query, apiKey, userId, selectedDocuments, limit = 4) {
  // If selectedDocuments is passed and empty, we have no attached documents to search. Return empty array immediately.
  if (selectedDocuments && selectedDocuments.length === 0) {
    return [];
  }

  const queryVec = await getEmbedding(query, apiKey);

  // Try MongoDB Atlas Vector Search
  try {
    const filterObj = {
      userId: new mongoose.Types.ObjectId(userId)
    };
    if (selectedDocuments && selectedDocuments.length > 0) {
      filterObj.documentId = { $in: selectedDocuments };
    }

    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVec,
          numCandidates: 100,
          limit: limit,
          filter: filterObj
        }
      },
      {
        $project: {
          text: 1,
          documentName: 1,
          documentId: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    if (results && results.length > 0) {
      return results
        .map(r => {
          // Normalize score: Atlas cosine score ranges [0, 1] mapped from cosine similarity [-1, 1].
          // Convert back using: rawCosine = 2 * score - 1
          const rawSimilarity = 2 * r.score - 1;
          return {
            text: r.text,
            documentName: r.documentName,
            documentId: r.documentId,
            similarity: rawSimilarity
          };
        })
        .filter(item => item.similarity >= 0.7);
    }
  } catch (vectorSearchError) {
    console.warn("MongoDB Atlas Vector Search failed or not configured. Falling back to in-memory cosine similarity:", vectorSearchError.message);
  }

  // Fallback: Local brute-force similarity search
  const chunks = await db.getChunks(userId, selectedDocuments);
  if (chunks.length === 0) return [];
  
  const scored = chunks
    .map(chunk => {
      const similarity = cosineSimilarity(queryVec, chunk.embedding);
      return {
        text: chunk.text,
        documentName: chunk.documentName,
        documentId: chunk.documentId,
        similarity
      };
    })
    .filter(item => item.similarity >= 0.7);
  
  // Sort descending and slice
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}
