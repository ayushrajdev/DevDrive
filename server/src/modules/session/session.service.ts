import type { ISessionRepository } from './session.repository.js';

export interface ISessionService {
    createSession(userId: string): Promise<string>;
    verifySession(sessionId: string): Promise<string | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    deleteAllUserSessions(userId: string): Promise<void>;
}

export class SessionService implements ISessionService {
    constructor(private readonly sessionRepository: ISessionRepository) {}

    createSession(userId: string): Promise<string> {
        return this.sessionRepository.createSession(userId);
    }

    verifySession(sessionId: string): Promise<string | null> {
        return this.sessionRepository.verifySession(sessionId);
    }

    deleteSession(sessionId: string): Promise<boolean> {
        return this.sessionRepository.deleteSession(sessionId);
    }

    deleteAllUserSessions(userId: string): Promise<void> {
        return this.sessionRepository.deleteAllUserSessions(userId);
    }
}
