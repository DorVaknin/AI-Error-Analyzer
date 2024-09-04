import { OpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';

class EmbeddingService {
  llm;

  constructor() {
    this.llm = new OpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });
  }

  async getEmbeddings(codeChunk, description) {
    const prompt = PromptTemplate.fromTemplate(
      "Generate an embedding for the following code and description:\nCode: {code}\nDescription: {description}"
    );

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        embedding: z.array(z.number()),
      })
    );

    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      outputParser,
    ]);

    const result = await chain.invoke({
      code: codeChunk,
      description: description,
    });

    return result.embedding;
  }

  async generateDescription(codeChunk){
    const prompt = PromptTemplate.fromTemplate(
      "Describe the following code in simple terms:\n{code}"
    );

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        description: z.string(),
      })
    );

    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      outputParser,
    ]);

    const result = await chain.invoke({
      code: codeChunk,
    });

    return result.description;
  }

  async analyzeWithChatGPT4(errorMessage, relevantSnippets) {
    const prompt = PromptTemplate.fromTemplate(
      "An error occurred: {errorMessage}. Here are some relevant code snippets with descriptions:\n\n{snippets}\n\nHow can this error be resolved?"
    );

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        analysis: z.string(),
      })
    );

    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      outputParser,
    ]);

    const snippetsText = relevantSnippets
      .map(snippet => `${snippet.description}\n${snippet.code}`)
      .join('\n\n');

    const result = await chain.invoke({
      errorMessage,
      snippets: snippetsText,
    });

    return result.analysis;
  }
}

export const embeddingService = new EmbeddingService();