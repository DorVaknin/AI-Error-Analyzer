require('dotenv').config();

const { semanticSearch } = require('../utils/pineconeUtils');

// Test Pinecone connection and semantic search
async function testPinecone() {
  const query = 'function add(a, b) { return a + b; }';
  const results = await semanticSearch(query);
  console.log('Semantic Search Results:', results);
}

testPinecone().catch((error) => {
  console.error('Error testing Pinecone:', error);
});