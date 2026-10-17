import { OAuthProvider } from '../providers/oauth/oauth.provider.js';
import { GoogleOAuthProvider } from '../providers/oauth/google.provider.js';
import { GithubOAuthProvider } from '../providers/oauth/github.provider.js';

type SupportedOAuthProvider = 'google' | 'github';

/**
 * Factory for creating OAuth provider instances.
 */
export class OAuthProviderFactory {
    private static readonly registry: Record<SupportedOAuthProvider, new () => OAuthProvider> = {
        google: GoogleOAuthProvider,
        github: GithubOAuthProvider,
    };

    static create(provider: string): OAuthProvider {
        const Provider = this.registry[provider as SupportedOAuthProvider];
        if (!Provider) {
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }
        return new Provider();
    }
}
