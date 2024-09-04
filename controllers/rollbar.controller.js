const { getEmbeddings, analyzeWithChatGPT4 } = require('../services/embedding.service');
const { getRelevantSnippets } = require('../services/pgvector.service');

class RollbarController {
  async handleWebhook(req, res) {
    try {
      const payload = req.body;
      const errorMessage = payload.data.body.trace.exception.message;

      // Get the embedding of the error message
      const errorEmbedding = await getEmbeddings(errorMessage);

      // Perform a semantic search using pgvector
      const relevantSnippets = await getRelevantSnippets(errorEmbedding);

      // Analyze the error and relevant snippets with GPT-4
      const gptResponse = await analyzeWithChatGPT4(errorMessage, relevantSnippets);

      res.status(200).json({
        message: 'Webhook processed successfully',
        gptResponse,
        relevantSnippets,
      });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = new RollbarController();
