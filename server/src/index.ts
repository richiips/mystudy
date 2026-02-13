import express from 'express';
import cors from 'cors';
import coursesRouter from './routes/courses';
import generationRouter from './routes/generation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/courses', coursesRouter);
app.use('/api/generation', generationRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
