// utils/pineconeUtils.js

require('dotenv').config();
const { PineconeClient } = require('@pinecone-database/pinecone');
const getEmbeddings = require('./getEmbeddings');

// Initialize Pinecone client
const pinecone = new PineconeClient();

async function initPinecone() {
  await pinecone.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });

  const pineconeIndex = pinecone.Index('my-code-index');

  return pineconeIndex;
}

// Function to upsert data to Pinecone
async function upsertToPinecone(descriptor) {
  try {
    const index = await initPinecone();
    await index.upsert([
      {
        id: `${descriptor.filename}-${descriptor.index}`,
        values: descriptor.embedding,
        metadata: {
          filename: descriptor.filename,
          content: descriptor.content,
        },
      },
    ]);
    console.log(`Upserted function from ${descriptor.filename}`);
  } catch (error) {
    console.error('Error upserting to Pinecone:', error.message);
  }
}

// Function to perform semantic search in Pinecone
async function semanticSearch(query) {
  try {
    const embedding = await getEmbeddings(query);
    const index = await initPinecone();
    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });
    return queryResponse.matches.map((match) => match.metadata);
  } catch (error) {
    console.error('Error performing semantic search:', error.message);
    return [];
  }
}

module.exports = { upsertToPinecone, semanticSearch };