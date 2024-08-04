// main.js

require('dotenv').config(); // Load environment variables
const path = require('path');
const Rollbar = require('rollbar');
const filterFiles = require('./utils/filterFiles');
const splitJavaScript = require('./utils/splitJavaScript');
const getEmbeddings = require('./utils/getEmbeddings');
const { upsertToPinecone, semanticSearch } = require('./utils/pineconeUtils');
const { analyzeErrorWithRAG } = require('./utils/azureUtils');

// Import LangChain or LangSmith
const { LangSmithClient } = require('langchain'); // Replace with actual package name if different

// Initialize LangSmith client
const langsmithClient = new LangSmithClient({
  apiKey: process.env.LANGCHAIN_API_KEY,
  project: process.env.LANGCHAIN_PROJECT,
  tracingV2: process.env.LANGCHAIN_TRACING_V2 === 'true',
});

// Rollbar configuration
const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  environment: 'development',
});

// Simulate an error and log it to Rollbar
function simulateError() {
  try {
    // Simulate an error
    throw new Error('Error in add function');
  } catch (error) {
    rollbar.error(error);
    return error.message;
  }
}

// Function to use LangSmith for advanced error analysis
async function useLangSmithForAnalysis(errorContext, codeSnippets) {
  try {
    const response = await langsmithClient.analyze({
      error: errorContext,
      code: codeSnippets,
    });

    console.log('LangSmith Analysis:', response);

    return response;
  } catch (error) {
    console.error('Error using LangSmith:', error.message);
    throw error;
  }
}

async function processRepository(repoPath) {
  try {
    const jsFiles = await filterFiles(repoPath, 'js');
    for (const file of jsFiles) {
      const functions = splitJavaScript(file);
      for (const [index, func] of functions.entries()) {
        const embedding = await getEmbeddings(func);
        const descriptor = {
          filename: path.basename(file),
          content: func,
          embedding: embedding,
          index: index,
        };
        // Upsert to Pinecone
        await upsertToPinecone(descriptor);
      }
    }

    // Simulate Rollbar error
    const errorContext = simulateError();

    // Perform semantic search with the error context
    const relevantCodeSnippets = await semanticSearch(errorContext);

    // Analyze the error with RAG
    const analysis = await analyzeErrorWithRAG(errorContext, relevantCodeSnippets);

    console.log('RAG Analysis:', analysis);

    // Use LangSmith for enhanced analysis
    const langsmithAnalysis = await useLangSmithForAnalysis(errorContext, relevantCodeSnippets);
    console.log('Enhanced Analysis:', langsmithAnalysis);

  } catch (error) {
    console.error('Error processing repository:', error);
  }
}

processRepository(path.join(__dirname, 'mock-repo'));