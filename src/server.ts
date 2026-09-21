import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Configure CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow in development
      }
    },
    credentials: true
  })
);

// Product images uploaded from the admin panel may be sent as base64 data URLs.
app.use(express.json({ limit: '10mb' }));

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'Master E-Commerce Web Backend API',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promos', promoRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`[Express Server Running] Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  console.log(`[Health Check] http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`[Server] Received ${signal}. Gracefully closing HTTP server...`);
  server.close(() => {
    console.log('[Server] HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

