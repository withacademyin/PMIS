import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import itiRoutes from './routes/itiRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import officerRoutes from './routes/officerRoutes.js';
import workRequirementRoutes from './routes/workRequirementRoutes.js';
import shortlistRoutes from './routes/shortlistRoutes.js';
import radarRoutes from './routes/radarRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;
const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/v1/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/itis', itiRoutes);
app.use('/api/itis', itiRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/v1/officers', officerRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/v1/requirements', workRequirementRoutes);
app.use('/api/requirements', workRequirementRoutes);
app.use('/api/v1/shortlists', shortlistRoutes);
app.use('/api/shortlists', shortlistRoutes);
app.use('/api/v1/radar', radarRoutes);
app.use('/api/radar', radarRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Hiring Portal Backend running on http://localhost:${PORT}`);
  console.log(`📡 Connected client allowed from: ${allowedOrigins.join(', ')}`);
});

export default app;
