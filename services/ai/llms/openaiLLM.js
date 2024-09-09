const { OpenAI } = require('@langchain/openai');
const { StructuredOutputParser } = require('langchain/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { z } = require('zod');

class OpenAILLM {
  constructor() {
    this.llm = new OpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });
  }

  async generateDescription(codeChunk) {
    const prompt = PromptTemplate.fromTemplate(
      "Describe the following code in simple terms:\n{code}"
    );

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        description: z.string(),
      })
    );

    const chain = RunnableSequence.from([prompt, this.llm, outputParser]);

    const result = await chain.invoke({ code: codeChunk });
    return result.description;
  }

  async analyzeError(errorMessage, relevantSnippets) {
    const prompt = PromptTemplate.fromTemplate(
      "An error occurred: {errorMessage}. Here are some relevant code snippets with descriptions:\n\n{snippets}\n\nHow can this error be resolved?"
    );

    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        analysis: z.string(),
      })
    );

    const chain = RunnableSequence.from([prompt, this.llm, outputParser]);

    const snippetsText = relevantSnippets
      .map(snippet => `${snippet.description}\n${snippet.code}`)
      .join('\n\n');

    const result = await chain.invoke({ errorMessage, snippets: snippetsText });
    return result.analysis;
  }
}

export default OpenAILLM;