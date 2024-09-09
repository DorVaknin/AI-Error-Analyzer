import EmbeddingService from '../services/EmbeddingService.js';
import mongoService from '../services/database/mongoService.js';

class RollbarController {
  async handleWebhook(req, res) {
    try {
      const payload = req.body;
      const errorMessage = payload.data.body.trace.exception.message;

      // Get the embedding of the error message
      const errorEmbedding = await EmbeddingService.getEmbeddings(errorMessage);

      // Perform a semantic search using MongoDB
      const relevantSnippets = await mongoService.getRelevantSnippets(errorEmbedding);

      // Analyze the error and relevant snippets with GPT-4
      const gptResponse = await mongoService.analyzeError(errorMessage, relevantSnippets);

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

export default new RollbarController();
