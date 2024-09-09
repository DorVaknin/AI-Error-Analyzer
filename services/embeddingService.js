import OpenAIEmbedding from './ai/embeddings/openai.js';
import XenovaEmbedding from './ai/embeddings/xenova.js';

class EmbeddingService {
  constructor() {
    this.embeddingType = process.env.EMBEDDING_TYPE || 'openai';
    this.embedder = this.getEmbedder();
  }

  getEmbedder() {
    switch (this.embeddingType) {
      case 'xenova':
        return new XenovaEmbedding();
      case 'openai':
      default:
        return new OpenAIEmbedding();
    }
  }

  async getEmbeddings(text, description = '') {
    return this.embedder.getEmbeddings(text, description);
  }
}

export default new EmbeddingService();