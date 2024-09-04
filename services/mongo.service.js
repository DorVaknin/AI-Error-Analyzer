const mongoose = require('mongoose');
const cosineSimilarity = require('compute-cosine-similarity');
const fs = require('fs');
const path = require('path');
const { embeddingService } = require('./embedding.service.js');

const CodeSnippetSchema = new mongoose.Schema({
  content: { type: String, required: true },
  description: { type: String, required: true },
  embedding: { type: [Number], required: true, index: '2dsphere' }
});

const CodeSnippet = mongoose.model('CodeSnippet', CodeSnippetSchema);

class MongoService {
  constructor() {
    this.connect();
  }

  async connect() {
    const connectionString = `${process.env.MONGO_DIALECT}://${process.env.MONGO_HOST}/${process.env.MONGO_DB}`;
    
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB');
  }

  async storeEmbedding({ content, description, embedding }) {
    const snippet = new CodeSnippet({ content, description, embedding });
    await snippet.save();
  }

  async getRelevantSnippets(queryEmbedding) {
    const results = await CodeSnippet.aggregate([
      {
        $search: {
          index: "default",
          knnBeta: {
            vector: queryEmbedding,
            path: "embedding",
            k: 10
          }
        }
      },
      {
        $project: {
          content: 1,
          description: 1,
          embedding: 1,
          score: { $meta: "searchScore" }
        }
      }
    ]);
    
    return this.reRankSnippets(results, queryEmbedding);
  }

  reRankSnippets(snippets, queryEmbedding) {
    return snippets
      .map(snippet => ({
        ...snippet,
        similarityScore: cosineSimilarity(queryEmbedding, snippet.embedding)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);
  }

  async loadRepositoryIntoMongo(repoPath) {
    const jsFiles = this.getJsFiles(repoPath);
    for (const file of jsFiles) {
      const functions = this.splitJavaScript(file);
      for (const func of functions) {
        const description = await embeddingService.generateDescription(func);
        const embedding = await embeddingService.getEmbeddings(func, description);
        await this.storeEmbedding({ content: func, description, embedding });
      }
    }
    console.log('Repository loaded into MongoDB.');
  }

  getJsFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getJsFiles(fullPath, files);
      } else if (fullPath.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  splitJavaScript(fileContent) {
    // Implement chunking logic directly here
    // Return chunks
    return [fileContent];
  }

  async analyzeError(errorMessage, relevantSnippets) {
    return embeddingService.analyzeWithChatGPT4(errorMessage, relevantSnippets);
  }

  async close() {
    await mongoose.connection.close();
  }
}

module.exports = new MongoService();