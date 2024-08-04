const axios = require('axios');

async function getEmbeddings(text) {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const instanceName = process.env.AZURE_OPENAI_API_INSTANCE_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const endpoint = `https://${instanceName}.openai.azure.com/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`;

    try {
        const response = await axios.post(endpoint, 
            {
                input: text,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey,
                },
            }
        );

        return response.data.data[0].embedding;
    } catch (error) {
        console.error('Error getting embeddings:', error);
        throw error;
    }
}

module.exports = getEmbeddings;