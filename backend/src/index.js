import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectProducer } from './config/kafka.js';
import routes from './api/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  await connectProducer();
  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start backend', err);
  process.exit(1);
});
