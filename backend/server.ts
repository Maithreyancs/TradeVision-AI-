import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initializeDatabase } from './database/dbInit.js';
import { initWebSocketServer } from './websocket/marketSocket.js';
import { errorHandler } from './middleware/authMiddleware.js';

import marketRoutes from './routes/marketRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import currencyRoutes from './routes/currencyRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/markets', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/drawings', chartRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TradeVision AI Backend',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket server
initWebSocketServer(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`🚀 TradeVision AI Server running on http://localhost:${PORT}`);
  await initializeDatabase();
});

export { app, server, io };
