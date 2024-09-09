import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { PineconeStore } from '@langchain/pinecone';
import fs from 'fs';
import path from 'path';
import embeddingService from '../embeddingService.js';
import llmService from '../llmService.js';
import fetch from 'node-fetch';

class VectorService {
  constructor() {
    global.fetch = fetch;
    this.client = null;
    this.index = null;
    this.indexName = process.env.PINECONE_INDEX_NAME;
    this.initialize();
  }

  async initialize(retries = 3) {
    try {
      console.log('Initializing Pinecone with:');
      console.log(`API Key: ${process.env.PINECONE_API_KEY.substring(0, 5)}...`);
      console.log(`Index Name: ${this.indexName}`);

      this.client = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });

      // Check if the index exists, if not, create it
      let indexExists = false;
      try {
        const indexList = await this.client.listIndexes();
        console.log('Available indexes:', indexList);
        indexExists = indexList.indexes.some(index => index.name === this.indexName);
      } catch (error) {
        console.error('Error listing indexes:', error);
      }

      if (!indexExists) {
        console.log(`Attempting to create new index: ${this.indexName}`);
        try {
          await this.client.createIndex({
            name: this.indexName,
            dimension: 384, // Dimension for 'Xenova/all-MiniLM-L6-v2' model
            metric: 'cosine',
            spec: { 
              serverless: { 
                cloud: process.env.PINECONE_CLOUD || 'aws', 
                region: process.env.PINECONE_REGION || 'us-west-2'
              }
            }
          });
          console.log(`Index ${this.indexName} created successfully.`);
        } catch (error) {
          if (error.name === 'PineconeConflictError' && error.message.includes('ALREADY_EXISTS')) {
            console.log(`Index ${this.indexName} already exists. Proceeding with existing index.`);
          } else {
            console.error('Error creating index:', error);
            throw error;
          }
        }
      } else {
        console.log(`Index ${this.indexName} already exists.`);
      }

      this.index = this.client.Index(this.indexName);
      console.log(`Successfully connected to index: ${this.indexName}`);
    } catch (error) {
      console.error('Error during initialization:', error);
      if (retries > 0) {
        console.log(`Pinecone initialization failed. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
        return this.initialize(retries - 1);
      } else {
        throw error;
      }
    }
  }

  async storeEmbedding({ content, description }) {
    const document = new Document({
      pageContent: content,
      metadata: { description },
    });
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddingService,
      { pineconeIndex: this.index }
    );
    await vectorStore.addDocuments([document]);
  }

  async getRelevantSnippets(query, limit = 10) {
    console.log('Searching for relevant snippets...');
    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddingService,
      { pineconeIndex: this.index }
    );
  
    // Ensure query is a string
    const queryString = typeof query === 'string' ? query : JSON.stringify(query);
  
    const results = await vectorStore.similaritySearch(queryString, limit);
    return results.map((result) => ({
      content: result.pageContent,
      description: result.metadata.description,
      score: result.score,
    }));
  }

  async loadRepositoryIntoVectorStore(repoPath) {
    const jsFiles = this.getJsFiles(repoPath);
    for (const file of jsFiles) {
      const functions = this.splitJavaScript(file.content);
      for (const func of functions) {
        const description = await llmService.generateDescription(func);
        await this.storeEmbedding({ content: func, description });
      }
    }
    console.log('Repository loaded into Pinecone.');
  }
  
  getJsFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getJsFiles(fullPath, files);
      } else if (fullPath.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        files.push({ path: fullPath, content });
      }
    }
    return files;
  }

  splitJavaScript(fileContent) {
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g;
    return fileContent.match(functionRegex) || [];
  }

  async analyzeError(errorMessage, relevantSnippets) {
    console.log('Analyzing error:', errorMessage);
    return llmService.analyzeError(errorMessage, relevantSnippets);
  }
}

const vectorService = new VectorService();

export default vectorService;
export const {
  initialize,
  storeEmbedding,
  getRelevantSnippets,
  loadRepositoryIntoVectorStore,
  getJsFiles,
  splitJavaScript,
  analyzeError,
} = vectorService;