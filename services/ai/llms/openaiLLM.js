import { AzureChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { ChatPromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';

class OpenAILLM {
  constructor() {
    this.llm = new AzureChatOpenAI({
      temperature: 0.3,
      presencePenalty: 0.5,
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION
    });
  }

  async generateDescription(codeChunk) {
    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        description: z.string().describe("A simple description of the code"),
      })
    );

    const formatInstructions = outputParser.getFormatInstructions();

    const prompt = ChatPromptTemplate.fromMessages([
      HumanMessagePromptTemplate.fromTemplate(
        "Describe the following code in simple terms:\n{code}\n\n{format_instructions}"
      ),
    ]);

    const chain = RunnableSequence.from([
      {
        code: (input) => input.code,
        format_instructions: () => formatInstructions,
      },
      prompt,
      this.llm,
      outputParser,
    ]);

    const result = await chain.invoke({ code: codeChunk });
    return result.description;
  }

  async analyzeError(errorMessage, relevantSnippets) {
    const outputParser = StructuredOutputParser.fromZodSchema(
      z.object({
        analysis: z.string().describe("An analysis of the error and how to resolve it"),
      })
    );

    const formatInstructions = outputParser.getFormatInstructions();

    const prompt = ChatPromptTemplate.fromMessages([
      HumanMessagePromptTemplate.fromTemplate(
        "An error occurred: {errorMessage}. Here are some relevant code snippets with descriptions:\n\n{snippets}\n\nHow can this error be resolved?\n\n{format_instructions}"
      ),
    ]);

    const chain = RunnableSequence.from([
      {
        errorMessage: (input) => input.errorMessage,
        snippets: (input) => input.snippets,
        format_instructions: () => formatInstructions,
      },
      prompt,
      this.llm,
      outputParser,
    ]);

    const snippetsText = relevantSnippets
      .map(snippet => `${snippet.description}\n${snippet.code}`)
      .join('\n\n');

    const result = await chain.invoke({ errorMessage, snippets: snippetsText });
    return result.analysis;
  }
}

export default OpenAILLM;