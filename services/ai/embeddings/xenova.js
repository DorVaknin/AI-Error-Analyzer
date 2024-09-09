import { pipeline } from '@xenova/transformers';

class XenovaEmbedding {
  constructor() {
    this.embeddingModel = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
  }

  async initModel() {
    if (!this.embeddingModel) {
      this.embeddingModel = await pipeline('feature-extraction', this.modelName);
    }
  }

  async getEmbeddings(text, description = '') {
    await this.initModel();
    const input = `${text}\n${description}`.trim();
    const output = await this.embeddingModel(input, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }
}

export default XenovaEmbedding;