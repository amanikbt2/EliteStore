import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import routes from './routes';

// Database Connection
connectDB();

// Routes
app.use('/api', routes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'EliteStore API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
