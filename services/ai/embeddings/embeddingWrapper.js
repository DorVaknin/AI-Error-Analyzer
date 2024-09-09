const EmbeddingType = require('./embeddingTypes');
const OpenAIEmbedding = require('./openai');
const XenovaEmbedding = require('./xenova');

class EmbeddingWrapper {
  constructor() {
    this.embeddingType = process.env.EMBEDDING_TYPE || EmbeddingType.OPENAI;
    this.embeddingService = this.getEmbeddingService();
  }

  getEmbeddingService() {
    switch (this.embeddingType) {
      case EmbeddingType.XENOVA:
        return new XenovaEmbedding();
      case EmbeddingType.OPENAI:
      default:
        return new OpenAIEmbedding();
    }
  }

  async getEmbeddings(text, description = '') {
    return this.embeddingService.getEmbeddings(text, description);
  }

  async generateDescription(codeChunk) {
    return this.embeddingService.generateDescription(codeChunk);
  }

  async analyzeError(errorMessage, relevantSnippets) {
    return this.embeddingService.analyzeError(errorMessage, relevantSnippets);
  }
}

module.exports = new EmbeddingWrapper();