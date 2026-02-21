import pg from 'pg';
const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rag_pdf_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL for vector storage');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL vector store error:', err.message);
});

// Generate a unique PDF ID from filename
function generatePdfId(fileName) {
  const timestamp = Date.now();
  const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  // Sanitize filename
  const sanitized = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${sanitized}_${timestamp}`;
}

export { generatePdfId };

// In-memory fallback
export const vectors = [];
let dimension = null;

// Initialize the database tables
export async function initVectorStore() {
  try {
    // Create document_chunks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id SERIAL PRIMARY KEY,
        pdf_id VARCHAR(100) NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding JSONB NOT NULL,
        page_number INTEGER,
        section_title VARCHAR(500),
        section_level VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Add columns if they don't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS section_title VARCHAR(500)`);
      await pool.query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS section_level VARCHAR(50)`);
    } catch (e) {
      // Ignore if columns already exist
    }
    
    // Create indexes for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_pdf_id ON document_chunks(pdf_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING GIN (embedding)
    `);
    
    console.log('✅ Vector store database initialized');
  } catch (error) {
    console.error('❌ Error initializing vector store:', error.message);
    throw error;
  }
}

// Clear all vectors (for re-indexing)
export async function clearVectorStore(pdfId = null) {
  try {
    let query, params;
    
    if (pdfId) {
      query = 'DELETE FROM document_chunks WHERE pdf_id = $1 RETURNING *';
      params = [pdfId];
    } else {
      query = 'DELETE FROM document_chunks RETURNING *';
      params = [];
    }
    
    const result = await pool.query(query, params);
    const count = result.rowCount || 0;
    console.log(`🗑️ Cleared ${count} vectors from database${pdfId ? ` for PDF: ${pdfId}` : ''}`);
    return count;
  } catch (error) {
    console.error('❌ Error clearing vector store:', error.message);
    throw error;
  }
}

// Add a vector with associated text to the database
export async function addVector(embedding, text, pdfId = null, pageNumber = null) {
  if (!embedding || !text) {
    console.warn('⚠️ Attempted to add invalid vector or text');
    return;
  }

  try {
    const query = `
      INSERT INTO document_chunks (pdf_id, chunk_text, embedding, page_number)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    
    await pool.query(query, [pdfId || 'default', text, JSON.stringify(embedding), pageNumber]);
  } catch (error) {
    console.error('❌ Error adding vector to database:', error.message);
    throw error;
  }
}

// Batch add vectors for better performance
export async function addVectorsBatch(chunks, pdfId) {
  if (!chunks || chunks.length === 0) {
    console.log('⚠️ No chunks to add');
    return 0;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let inserted = 0;
    const batchSize = 50;
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      for (const chunk of batch) {
        const query = `
          INSERT INTO document_chunks (pdf_id, chunk_text, embedding, page_number, section_title, section_level)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `;
        await client.query(query, [
          pdfId, 
          chunk.text, 
          JSON.stringify(chunk.embedding), 
          chunk.pageNumber || null,
          chunk.sectionTitle || null,
          chunk.sectionLevel || null
        ]);
        inserted++;
      }
      
      console.log(`📊 Inserted ${inserted}/${chunks.length} chunks`);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully stored ${inserted} chunks in database`);
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error in batch insert:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denominator = Math.sqrt(magA) * Math.sqrt(magB);
  
  if (denominator === 0) {
    return 0;
  }

  return dot / denominator;
}

// Search for similar vectors using PostgreSQL
export async function similaritySearch(queryEmbedding, topK = 3) {
  if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
    console.warn('⚠️ Invalid query embedding');
    return [];
  }

  try {
    // Get all embeddings from database
    const result = await pool.query('SELECT id, chunk_text, embedding FROM document_chunks');
    
    if (result.rows.length === 0) {
      console.warn('⚠️ similaritySearch called but no vectors stored');
      return [];
    }

    // Calculate similarity for each stored vector
    const scored = result.rows.map(row => {
      const embedding = Array.isArray(row.embedding) ? row.embedding : [];
      return {
        text: row.chunk_text,
        score: cosineSimilarity(queryEmbedding, embedding),
        id: row.id
      };
    });

    // Sort by score and return topK results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error('❌ similaritySearch error:', error.message);
    return [];
  }
}

// Advanced search with minimum similarity threshold
export async function similaritySearchWithThreshold(queryEmbedding, topK = 10, minThreshold = 0.25, pdfId = null) {
  if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
    console.warn('⚠️ Invalid query embedding');
    return [];
  }

  try {
    let query = 'SELECT id, chunk_text, embedding FROM document_chunks';
    const params = [];
    
    if (pdfId) {
      query += ' WHERE pdf_id = $1';
      params.push(pdfId);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.warn('⚠️ similaritySearchWithThreshold called but no vectors stored');
      return [];
    }

    // Calculate similarity for each stored vector
    const scored = result.rows.map(row => {
      const embedding = Array.isArray(row.embedding) ? row.embedding : [];
      return {
        text: row.chunk_text,
        score: cosineSimilarity(queryEmbedding, embedding),
        id: row.id
      };
    });

    // Filter by threshold and sort by relevance
    const filtered = scored
      .filter(item => item.score >= minThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (filtered.length > 0) {
      console.log(`✅ Found ${filtered.length} relevant chunks (threshold: ${minThreshold})`);
    } else {
      console.log(`⚠️ No chunks passed threshold ${minThreshold}, top result: ${scored[0]?.score?.toFixed(4) || 0}`);
    }

    return filtered;
  } catch (error) {
    console.error('❌ similaritySearchWithThreshold error:', error.message);
    return [];
  }
}

// Get all chunks for a specific PDF
export async function getChunksByPdfId(pdfId) {
  try {
    const result = await pool.query(
      'SELECT id, chunk_text, embedding, page_number, created_at FROM document_chunks WHERE pdf_id = $1 ORDER BY id',
      [pdfId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      text: row.chunk_text,
      embedding: row.embedding,
      pageNumber: row.page_number,
      createdAt: row.created_at
    }));
  } catch (error) {
    console.error('❌ Error getting chunks by PDF ID:', error.message);
    throw error;
  }
}

// Get chunks sequentially (for summary mode) - ordered by id as proxy for chunk_index
export async function getSequentialChunks(pdfId = null, limit = 5) {
  try {
    let query = 'SELECT id, chunk_text, embedding FROM document_chunks';
    const params = [];
    
    if (pdfId) {
      query += ' WHERE pdf_id = $1';
      params.push(pdfId);
      query += ' ORDER BY id ASC LIMIT $2';
      params.push(limit);
    } else {
      query += ' ORDER BY id ASC LIMIT $1';
      params.push(limit);
    }
    
    const result = await pool.query(query, params);
    
    return result.rows.map(row => ({
      text: row.chunk_text,
      score: 1.0,
      id: row.id
    }));
  } catch (error) {
    console.error('❌ Error getting sequential chunks:', error.message);
    throw error;
  }
}

// Get total count of chunks
export async function getChunkCount(pdfId = null) {
  try {
    let query = 'SELECT COUNT(*) as count FROM document_chunks';
    const params = [];
    
    if (pdfId) {
      query += ' WHERE pdf_id = $1';
      params.push(pdfId);
    }
    
    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('❌ Error getting chunk count:', error.message);
    throw error;
  }
}

// Get all text chunks with metadata (for mind map generation)
export async function getAllChunkTexts(pdfId = null) {
  try {
    let query = 'SELECT chunk_text, section_title, section_level FROM document_chunks';
    const params = [];
    
    if (pdfId) {
      query += ' WHERE pdf_id = $1';
      params.push(pdfId);
    }
    query += ' ORDER BY id ASC';
    
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      text: row.chunk_text,
      title: row.section_title,
      level: row.section_level
    }));
  } catch (error) {
    console.error('❌ Error getting chunk texts:', error.message);
    throw error;
  }
}

// Close database connection
export async function closeVectorStore() {
  await pool.end();
  console.log('✅ Vector store connection closed');
}
