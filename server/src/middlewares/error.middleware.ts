import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError.js';
import { ENV } from '../shared/utils/env.js';

export class ErrorMiddleware {
    static handle(err: any, _req: Request, res: Response, _next: NextFunction): void {
        // Operational AppError
        if (err instanceof AppError) {
            res.status(err.statusCode).json({
                success: false,
                message: err.message,
            });
            return;
        }

        // Mongoose duplicate key error (11000)
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue || {})[0] || 'field';
            res.status(409).json({
                success: false,
                message: `Duplicate value entered for ${field}. Please use another value.`,
            });
            return;
        }

        // Mongoose validation error
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors || {}).map((val: any) => val.message);
            res.status(400).json({
                success: false,
                message: messages.join(', ') || 'Validation error',
            });
            return;
        }

        // JSON parsing error (e.g. from body-parser)
        if (err.type === 'entity.parse.failed') {
            res.status(400).json({
                success: false,
                message: 'Malformed JSON payload received',
            });
            return;
        }

        // Log unexpected error
        console.error('Unhandled Error:', err);

        const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
        const message = status === 500 && ENV.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error';

        res.status(status).json({
            success: false,
            message,
        });
    }
}
