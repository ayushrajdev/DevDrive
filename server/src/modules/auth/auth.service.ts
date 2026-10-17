import type { IUserRepository } from '../user/user.repository.js';
import type { ISessionService } from '../session/session.service.js';
import type { IDirectoryService } from '../directory/directory.service.js';
import { GoogleOAuthProvider } from '../../providers/oauth/google.provider.js';
import { GithubOAuthProvider } from '../../providers/oauth/github.provider.js';
import type { IUser } from '../../shared/types/index.js';
import { ForbiddenError } from '../../shared/errors/AppError.js';

export interface OAuthAuthResult {
    user: Omit<IUser, 'password'>;
    sessionId: string;
}

export interface IAuthService {
    loginWithGoogle(idToken: string): Promise<OAuthAuthResult>;
    getGithubAuthUrl(): string;
    handleGithubCallback(code: string): Promise<OAuthAuthResult>;
}

export class AuthService implements IAuthService {
    private readonly googleProvider: GoogleOAuthProvider;
    private readonly githubProvider: GithubOAuthProvider;

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionService: ISessionService,
        private readonly directoryService: IDirectoryService,
    ) {
        this.googleProvider = new GoogleOAuthProvider();
        this.githubProvider = new GithubOAuthProvider();
    }

    async loginWithGoogle(idToken: string): Promise<OAuthAuthResult> {
        const payload = await this.googleProvider.verifyIdToken(idToken);
        const normalized = this.googleProvider.normalize(payload);

        let user = await this.userRepository.findUserByEmail(normalized.email);
        if (user && user.deleted) {
            throw new ForbiddenError('Your account has been deactivated. Please contact support.');
        }

        if (!user) {
            user = await this.userRepository.upsertOAuthUser({
                email: normalized.email,
                name: normalized.name,
                picture: normalized.avatar,
                authProvider: 'google',
            });
            // Ensure root directory exists for new user
            await this.directoryService.getOrCreateRootDirectory(String(user._id), user.email);
        } else if (!user.picture && normalized.avatar) {
            await this.userRepository.updateUser(String(user._id), { picture: normalized.avatar });
        }

        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _p, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }

    getGithubAuthUrl(): string {
        return this.githubProvider.getAuthorizationUrl();
    }

    async handleGithubCallback(code: string): Promise<OAuthAuthResult> {
        const accessToken = await this.githubProvider.exchangeCodeForToken(code);
        const profile = await this.githubProvider.getProfile(accessToken);
        const normalized = this.githubProvider.normalize(profile);

        let user = await this.userRepository.findUserByEmail(normalized.email);
        if (user && user.deleted) {
            throw new ForbiddenError('Your account has been deactivated. Please contact support.');
        }

        if (!user) {
            user = await this.userRepository.upsertOAuthUser({
                email: normalized.email,
                name: normalized.name,
                picture: normalized.avatar,
                authProvider: 'github',
            });
            await this.directoryService.getOrCreateRootDirectory(String(user._id), user.email);
        } else if (!user.picture && normalized.avatar) {
            await this.userRepository.updateUser(String(user._id), { picture: normalized.avatar });
        }

        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _p, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }
}
