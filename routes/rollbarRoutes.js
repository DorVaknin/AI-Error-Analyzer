import express from 'express';
import RollbarController from '../controllers/rollbar.controller.js';

const router = express.Router();

router.post('/webhook/rollbar', RollbarController.handleWebhook);

export default router;
