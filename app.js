import fetch from 'node-fetch';
global.fetch = fetch;

import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from 'express';
import bodyParser from 'body-parser';
// import rollbarRoutes from './routes/rollbarRoutes.js';
import vectorService from './services/database/vectorService.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Simulate a Rollbar webhook call
async function simulateRollbarWebhook(errorMessage) {
  console.log('Simulating Rollbar webhook call...');
  if (!errorMessage) {
    console.error('Error message is empty or undefined');
    return;
  }
  const relevantSnippets = await vectorService.getRelevantSnippets(errorMessage);
  const analysis = await vectorService.analyzeError(errorMessage, relevantSnippets);
  console.log('Error analysis:', analysis);
}

async function startServer() {
  try {
    // Initialize Pinecone
    await vectorService.initialize();

    // Load the repository into Pinecone at startup
    const mockRepoPath = path.join(__dirname, 'mock-repo');
    console.log("Loading repository into Pinecone...");
    await vectorService.loadRepositoryIntoVectorStore(mockRepoPath);
    console.log("Repository loaded successfully.");

    // Simulate a Rollbar webhook call with an example error message
    console.log("Simulating Rollbar webhook call...");
    await simulateRollbarWebhook("Example error message: Division by zero");

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error during startup:", error);
    process.exit(1);
  }
}

startServer();
