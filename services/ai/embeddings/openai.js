import { OpenAIEmbeddings } from '@langchain/openai';

class OpenAIEmbedding {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });
  }

  async getEmbeddings(text, description = '') {
    const input = `${text}\n${description}`.trim();
    return await this.embeddings.embedQuery(input);
  }
}

export default OpenAIEmbedding;