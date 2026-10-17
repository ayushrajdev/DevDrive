import type { Response } from 'express';
import type { ApiResponse } from '../types/index.js';

export function successResponse<T>(
    res: Response,
    data?: T,
    message: string = 'Success',
    status: number = 200,
): Response {
    const body: ApiResponse<T> = { success: true, message, data };
    return res.status(status).json(body);
}

export function errorResponse(
    res: Response,
    message: string = 'Server error',
    status: number = 400,
): Response {
    const body: ApiResponse = { success: false, message };
    return res.status(status).json(body);
}
