import express from 'express';
import cors from 'cors';

import customerRoutes from './routes/customerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Meal order backend is running' });
});

app.use('/api', customerRoutes);
app.use('/api', adminRoutes);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
