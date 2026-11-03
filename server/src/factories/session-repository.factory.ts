import {
    InMemorySessionRepository,
    RedisSessionRepository,
    type ISessionRepository,
} from '../modules/session/session.repository.js';

export type SessionStoreType = 'redis' | 'memory';

/** Factory selecting the session storage strategy. */
export class SessionRepositoryFactory {
    static create(type: SessionStoreType): ISessionRepository {
        switch (type) {
            case 'redis':
                return new RedisSessionRepository();
            case 'memory':
                return new InMemorySessionRepository();
            default:
                throw new Error(`Unsupported session store: ${type as string}`);
        }
    }
}
