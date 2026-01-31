
import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  console.log('↩️ Received request for /');
  res.send('Bot is alive! 🤖');
});

app.get('/ping', (req, res) => {
  console.log('↩️ Received request for /ping');
  res.json({ status: 'ok', timestamp: Date.now() });
});

export function startKeepAlive() {
  console.log('▶️ Starting keep-alive server...');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Keep-alive server running on port ${PORT}`);
  });
}
