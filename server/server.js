import app from './app.js';
import { connectDb, disConnectDb } from './config/mongodb/db.config.js';
import { ENV } from './utils/env.js';

let server;
let isShuttingDown = false;

async function startServer() {
    try {
        await connectDb();
        server = app.listen(ENV.PORT, () => {
            console.info(`DevDrive API listening on port ${ENV.PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to MongoDB:', error.message);
        process.exitCode = 1;
    }
}

async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info(`${signal} received; shutting down`);

    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }

    try {
        await disConnectDb();
    } catch (error) {
        console.error('Error while disconnecting MongoDB:', error.message);
        process.exitCode = 1;
    }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await startServer();
