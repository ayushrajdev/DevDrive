import type { IUserRepository } from '../user/user.repository.js';
import type { ISessionService } from '../session/session.service.js';
import type { IDirectoryService } from '../directory/directory.service.js';
import type { OAuthProvider } from '../../providers/oauth/oauth.provider.js';
import type { IUser } from '../../shared/types/index.js';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../../shared/errors/AppError.js';

export interface OAuthAuthResult {
    user: Omit<IUser, 'password'>;
    sessionId: string;
}

export type OAuthProviderName = 'google' | 'github';
export type OAuthProviderResolver = (name: OAuthProviderName) => OAuthProvider;

export interface IAuthService {
    loginWithGoogle(idToken: string): Promise<OAuthAuthResult>;
    getGithubAuthUrl(): string;
    handleGithubCallback(code: string): Promise<OAuthAuthResult>;
}

export class AuthService implements IAuthService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionService: ISessionService,
        private readonly directoryService: IDirectoryService,
        private readonly resolveProvider: OAuthProviderResolver,
    ) {}

    loginWithGoogle(idToken: string): Promise<OAuthAuthResult> {
        return this.loginWithProvider('google', idToken);
    }

    getGithubAuthUrl(): string {
        return this.resolveProvider('github').getAuthorizationUrl();
    }

    handleGithubCallback(code: string): Promise<OAuthAuthResult> {
        return this.loginWithProvider('github', code);
    }

    private async loginWithProvider(name: OAuthProviderName, credential: string): Promise<OAuthAuthResult> {
        let profile;
        try {
            profile = await this.resolveProvider(name).authenticate(credential);
        } catch (error) {
            const reason = error instanceof Error ? error.message : 'unknown error';
            throw new UnauthorizedError(`${name} authentication failed: ${reason}`);
        }

        if (!profile.email) {
            throw new BadRequestError(`${name} account did not provide an email address`);
        }

        let user = await this.userRepository.findUserByEmail(profile.email);
        if (user?.deleted) {
            throw new ForbiddenError('Your account has been deactivated. Please contact support.');
        }

        if (!user) {
            user = await this.userRepository.upsertOAuthUser({
                email: profile.email,
                name: profile.name,
                picture: profile.avatar,
                authProvider: name,
            });
            await this.directoryService.getOrCreateRootDirectory(String(user._id), user.email);
        } else if (!user.picture && profile.avatar) {
            await this.userRepository.updateUser(String(user._id), { picture: profile.avatar });
        }

        const sessionId = await this.sessionService.createSession(String(user._id));
        const { password: _password, ...safeUser } = user;
        return { user: safeUser as Omit<IUser, 'password'>, sessionId };
    }
}
