import type { Response } from 'express';
import { ENV } from './env.js';

const SESSION_COOKIE = 'sessionId';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Single place that defines how the session cookie is issued and cleared. */
export class SessionCookie {
    static readonly name = SESSION_COOKIE;

    private static baseOptions() {
        return {
            httpOnly: true,
            secure: ENV.NODE_ENV === 'production',
            sameSite: (ENV.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
            signed: true,
        };
    }

    static set(res: Response, sessionId: string): void {
        res.cookie(SESSION_COOKIE, sessionId, { ...SessionCookie.baseOptions(), maxAge: SEVEN_DAYS_MS });
    }

    static clear(res: Response): void {
        res.clearCookie(SESSION_COOKIE, SessionCookie.baseOptions());
    }
}
