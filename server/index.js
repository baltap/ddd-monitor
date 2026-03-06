import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { runScrapers, getContracts } from './scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Main endpoint to get all tracked contracts
app.get('/api/contracts', (req, res) => {
  const contracts = getContracts();
  res.json(contracts);
});

// Endpoint to manually trigger a scrape
app.post('/api/scrape', async (req, res) => {
  try {
    const results = await runScrapers();
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static files from the React app dist folder
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('/:path*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend Server beží na portu: ${PORT}`);
  console.log('Spúšťam prvotný mock scraping...');
  runScrapers(); // Run initially
});
