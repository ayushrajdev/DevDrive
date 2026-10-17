/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Restore prototype chain (required for ES5 target with extends)
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }
}

// ── HTTP Error Subclasses ────────────────────────────────────────────────────

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found') {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, 409);
    }
}

export class UnprocessableEntityError extends AppError {
    constructor(message: string = 'Unprocessable Entity') {
        super(message, 422);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500, false);
    }
}
