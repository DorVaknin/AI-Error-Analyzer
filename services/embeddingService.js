import { pipeline } from '@xenova/transformers';
import { OpenAIEmbeddings } from '@langchain/openai';
import fetch from 'node-fetch'; // Add this import

// Add this line at the top of the file
global.fetch = fetch;

class EmbeddingService {
  constructor() {
    this.embedder = null;
    this.embeddingType = process.env.EMBEDDING_TYPE || 'xenova';
  }

  async initialize() {
    if (this.embeddingType === 'openai') {
      this.embedder = new OpenAIEmbeddings({
        azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
        azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_EMBEDDING_DEPLOYMENT_NAME,
      });
    } else {
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
  }

  async embedQuery(text) {
    if (!text) {
      throw new Error('Input text for embedding cannot be empty or undefined');
    }
    console.log('Embedding text:', text);
    console.log('Embedding type:', this.embeddingType);
    
    if (!this.embedder) await this.initialize();
    
    if (this.embeddingType === 'openai') {
      return await this.embedder.embedQuery(text);
    } else {
      const result = await this.embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    }
  }

  async embedDocuments(documents) {
    if (!this.embedder) await this.initialize();
    if (this.embeddingType === 'openai') {
      return await this.embedder.embedDocuments(documents);
    } else {
      return Promise.all(documents.map(doc => this.embedQuery(doc)));
    }
  }
}

export default new EmbeddingService();