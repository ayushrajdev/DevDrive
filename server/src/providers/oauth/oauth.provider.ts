/**
 * Abstract base class for all OAuth providers.
 * Each provider must implement: getAuthorizationUrl, exchangeCodeForToken,
 * getProfile, and normalize.
 */
export interface NormalizedProfile {
    providerId: string;
    email: string;
    name: string;
    avatar: string;
    provider: string;
}

export abstract class OAuthProvider {
    abstract getAuthorizationUrl(): string;
    abstract exchangeCodeForToken(code: string): Promise<string>;
    abstract getProfile(accessToken: string): Promise<unknown>;
    abstract normalize(profile: unknown): NormalizedProfile;
}
