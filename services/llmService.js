import OpenAILLM from './ai/llms/openaiLLM.js';

class LLMService {
  constructor() {
    this.llm = new OpenAILLM();
  }

  async generateDescription(codeChunk) {
    return this.llm.generateDescription(codeChunk);
  }

  async analyzeError(errorMessage, relevantSnippets) {
    return this.llm.analyzeError(errorMessage, relevantSnippets);
  }
}

export default new LLMService();