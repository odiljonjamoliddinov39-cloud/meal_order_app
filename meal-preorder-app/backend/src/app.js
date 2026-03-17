import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/healthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ message: 'Telegram Meal Preorder API' });
});

app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', customerRoutes);

app.use(errorHandler);
