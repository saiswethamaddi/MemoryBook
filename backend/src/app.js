import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import memoryRoutes from './routes/memoryRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(here, '../uploads');

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadDirectory));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/memories', memoryRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
