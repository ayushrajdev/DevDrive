import { Server } from 'http';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/database.config.js';
import { connectRedis, getRedisClient } from './config/redis.config.js';
import { ENV } from './shared/utils/env.js';

let server: Server | null = null;
let isShuttingDown = false;

async function startServer(): Promise<void> {
    try {
        console.info('Initializing DevDrive Server...');

        // Connect Database
        await connectDb();

        // Connect Redis cache
        await connectRedis();

        // Create Express Application
        const app = createApp();

        server = app.listen(ENV.PORT, () => {
            console.info(`DevDrive API running in [${ENV.NODE_ENV}] mode on port ${ENV.PORT}`);
            console.info(`Health check available at http://localhost:${ENV.PORT}/health`);
        });
    } catch (error: any) {
        console.error('Fatal error during server startup:', error?.message || error);
        process.exit(1);
    }
}

async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(`\n${signal} signal received. Starting graceful shutdown...`);

    if (server) {
        await new Promise<void>((resolve) => {
            server!.close(() => {
                console.info('HTTP server closed');
                resolve();
            });
        });
    }

    try {
        await disconnectDb();
    } catch (error: any) {
        console.error('Error disconnecting from MongoDB:', error?.message);
    }

    try {
        const redisClient = getRedisClient();
        if (redisClient.isOpen) {
            await redisClient.disconnect();
            console.info('Redis client disconnected');
        }
    } catch (error: any) {
        console.error('Error disconnecting from Redis:', error?.message);
    }

    console.info('Graceful shutdown completed');
    process.exit(0);
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

startServer();
