import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './shared/utils/env.js';
import { AppContainer } from './container.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUserRouter } from './modules/user/user.routes.js';
import { createOtpRouter } from './modules/otp/otp.routes.js';
import { createPaymentRouter } from './modules/payment/payment.routes.js';
import { createDirectoryRouter } from './modules/directory/directory.routes.js';
import { createFileRouter } from './modules/file/file.routes.js';
import { createWebhookRouter } from './modules/webhook/webhook.routes.js';
import { ErrorMiddleware } from './middlewares/error.middleware.js';

export function createApp(container: AppContainer = new AppContainer()): Express {
    const app = express();

    // ── Global Security & Parser Middlewares ─────────────────────────────────
    app.use(helmet());
    app.use(cookieParser(ENV.SECRET_KEY));
    app.use(
        cors({
            origin: ENV.CORS_ORIGINS,
            credentials: true,
        }),
    );

    // ── Health Check ─────────────────────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            environment: ENV.NODE_ENV,
            timestamp: new Date().toISOString(),
        });
    });

    // ── API v2 Router ────────────────────────────────────────────────────────
    const v2Router = Router();

    // 1. Webhooks MUST be registered before express.json() to preserve raw body buffers
    const webhookRouter = createWebhookRouter(
        container.razorpayWebhookHandler,
        container.stripeWebhookHandler,
    );
    v2Router.use('/webhooks', webhookRouter);

    // 2. Standard JSON body parsers
    v2Router.use(express.json({ limit: '10mb' }));
    v2Router.use(express.urlencoded({ extended: true }));

    // 3. Module Routers
    v2Router.use('/auth', createAuthRouter(container.authController));
    v2Router.use('/users', createUserRouter(container.userController, container.sessionMiddleware, container.authMiddleware));
    v2Router.use('/otp', createOtpRouter(container.otpController));
    v2Router.use('/payments', createPaymentRouter(container.paymentController, container.sessionMiddleware, container.authMiddleware));
    v2Router.use('/directory', createDirectoryRouter(container.directoryController, container.sessionMiddleware, container.authMiddleware));
    v2Router.use('/files', createFileRouter(container.fileController, container.sessionMiddleware, container.authMiddleware));

    app.use('/api/v2', v2Router);

    // ── 404 Route Not Found Handler ──────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found',
        });
    });

    // ── Global Error Handling Middleware ─────────────────────────────────────
    app.use(ErrorMiddleware.handle);

    return app;
}

export default createApp;
