
const express = require('express');
const router = express.Router();
const RollbarController = require('./controllers/rollbar.controller');

router.post('/webhook/rollbar', RollbarController.handleWebhook);

module.exports = router;
