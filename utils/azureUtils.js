// utils/azureUtils.js

const { azureModel } = require('../models');

// Use AzureChatOpenAI to analyze the error
async function analyzeErrorWithRAG(errorContext, codeSnippets) {
  const input = {
    error: errorContext,
    code: codeSnippets,
  };

  const prompt = `Given the following error context and code snippets, analyze what went wrong:\nError: ${input.error}\nCode Snippets: ${JSON.stringify(input.code, null, 2)}`;

  try {
    const response = await azureModel.complete({
      messages: [
        { role: 'system', content: 'You are a helpful assistant for analyzing code errors.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 200,
      temperature: 0.5,
    });

    return response.choices[0].message?.content || '';
  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    throw new Error('Failed to generate response');
  }
}

module.exports = { analyzeErrorWithRAG };