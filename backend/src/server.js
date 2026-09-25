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

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));

app.use(express.json());
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
  console.log(`📡 Connected client allowed from: ${CLIENT_URL}`);
});

export default app;
