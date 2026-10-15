import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import { ENV } from './utils/env.js';
import cookieParser from 'cookie-parser';
import v2Router from './routers/v2/index.js';

const app = express();

app.use(helmet());
app.use(cookieParser(ENV.SECRET_KEY));
app.use(
    cors({
        origin: ENV.CORS_ORIGINS,
        credentials: true,
    }),
);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', environment: ENV.NODE_ENV });
});

app.use('/api/v2', v2Router);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
    res.status(status).json({
        success: false,
        message: status === 500 ? 'Internal server error' : err.message,
    });
});

export default app;
