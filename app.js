require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const rollbarRoutes = require('./routes/rollbarRoutes.js');
const { loadRepositoryIntoPgVector } = require('./services/pgvector.service');

const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(bodyParser.json());

// Load the repository into pgvector at startup
loadRepositoryIntoPgVector('/path/to/your/repo');

// Use a realistic Rollbar webhook URL
app.use('/webhook/rollbar', rollbarRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
