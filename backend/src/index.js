import express from 'express';
import cors from 'cors';
import { router as spotsRouter } from './routes/spots.js';
import './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/spots', spotsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

app.listen(PORT, () => {
  console.log(`freistehen-backend laeuft auf http://localhost:${PORT}`);
});
