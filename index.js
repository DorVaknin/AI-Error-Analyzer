require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const Pinecone = require('pinecone-client');
const Rollbar = require('rollbar');
const axios = require('axios');
const filterFiles = require('./utils/filterFiles');
const splitJavaScript = require('./utils/splitJavaScript');
const getEmbeddings = require('./utils/getEmbeddings');

// Pinecone configuration
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
});

// Initialize Pinecone index
const pineconeIndex = pinecone.Index('my-code-index');

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

// Semantic search in Pinecone
async function semanticSearch(query) {
    const embedding = await getEmbeddings(query);
    const queryResponse = await pineconeIndex.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
    });
    return queryResponse.matches.map(match => match.metadata);
}

// Use RAG to analyze the error
async function analyzeErrorWithRAG(errorContext, codeSnippets) {
    const input = {
        error: errorContext,
        code: codeSnippets,
    };
    const response = await axios.post('https://api.openai.com/v1/engines/gpt-4/completions', {
        prompt: `Given the following error context and code snippets, analyze what went wrong:\nError: ${input.error}\nCode Snippets: ${JSON.stringify(input.code, null, 2)}`,
        max_tokens: 200,
        temperature: 0.5,
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data.choices[0].text;
}

async function processRepository(repoPath) {
    try {
        const jsFiles = await filterFiles(repoPath, 'js');
        for (const file of jsFiles) {
            const functions = splitJavaScript(file);
            for (const func of functions) {
                const embedding = await getEmbeddings(func);
                const descriptor = {
                    filename: path.basename(file),
                    content: func,
                    embedding: embedding,
                };
                // Upsert to Pinecone
                await pineconeIndex.upsert([{
                    id: `${path.basename(file)}-${functions.indexOf(func)}`,
                    values: embedding,
                    metadata: descriptor,
                }]);
                console.log(`Processed and stored function from ${file}`);
            }
        }

        // Simulate Rollbar error
        const errorContext = simulateError();

        // Perform semantic search with the error context
        const relevantCodeSnippets = await semanticSearch(errorContext);

        // Analyze the error with RAG
        const analysis = await analyzeErrorWithRAG(errorContext, relevantCodeSnippets);

        console.log('Analysis:', analysis);

    } catch (error) {
        console.error('Error processing repository:', error);
    }
}

processRepository(path.join(__dirname, 'mock-repo'));
