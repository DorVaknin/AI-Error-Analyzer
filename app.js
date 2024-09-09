import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import rollbarRoutes from './routes/rollbarRoutes.js';
import mongoService from './services/database/mongoService.js';
import EmbeddingService from './services/embeddingService.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Simulate a Rollbar webhook call
async function simulateRollbarWebhook() {
  const mockError = {
    message: "Cannot calculate square root of negative number",
    stack: `Error: Cannot calculate square root of negative number
    at Calculator.squareRoot (/Users/user/project/mock-repo/calculator.js:22:16)
    at Object.<anonymous> (/Users/user/project/mock-repo/test.js:5:22)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
    at Module.load (internal/modules/cjs/loader.js:950:32)
    at Function.Module._load (internal/modules/cjs/loader.js:790:12)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:76:12)
    at internal/main/run_main_module.js:17:47`
  };

  // Get embeddings for the error message
  const errorEmbedding = await EmbeddingService.getEmbeddings(mockError.message, "Error message");

  // Perform similarity search
  const relevantSnippets = await mongoService.getRelevantSnippets(errorEmbedding);

  // Analyze the error
  const analysis = await mongoService.analyzeError(mockError.message, relevantSnippets);

  console.log("Error Analysis:");
  console.log(analysis);
}

async function startServer() {
  try {
    // Load the repository into MongoDB at startup
    const mockRepoPath = path.join(__dirname, 'mock-repo');
    console.log("Loading repository into MongoDB...");
    await mongoService.loadRepositoryIntoMongo(mockRepoPath);
    console.log("Repository loaded successfully.");

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    // Use a realistic Rollbar webhook URL (commented out for now)
    // app.use('/webhook/rollbar', rollbarRoutes);

    console.log("Simulating Rollbar webhook call...");
    await simulateRollbarWebhook();
  } catch (error) {
    console.error("Error during startup:", error);
    process.exit(1);
  }
}

startServer();
