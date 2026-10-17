import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../../shared/utils/env.js';
import { OAuthProvider, type NormalizedProfile } from './oauth.provider.js';

interface GoogleTokenPayload {
    sub: string;
    email: string;
    name: string;
    picture: string;
    email_verified?: boolean;
}

export class GoogleOAuthProvider extends OAuthProvider {
    private readonly client: OAuth2Client;

    constructor() {
        super();
        this.client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
    }

    /** Not used for Google — the client sends the ID token directly */
    getAuthorizationUrl(): string {
        throw new Error('Use Google Sign-In button on the client side');
    }

    /** Not used for Google — tokens come from the client's Google Sign-In */
    async exchangeCodeForToken(_code: string): Promise<string> {
        throw new Error('Not implemented for Google — use verifyIdToken instead');
    }

    /** Verify the Google ID token sent by the client */
    async verifyIdToken(idToken: string): Promise<GoogleTokenPayload> {
        const ticket = await this.client.verifyIdToken({
            idToken,
            audience: ENV.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) throw new Error('Invalid Google ID token');
        return payload as unknown as GoogleTokenPayload;
    }

    async getProfile(accessToken: string): Promise<GoogleTokenPayload> {
        return this.verifyIdToken(accessToken);
    }

    normalize(profile: unknown): NormalizedProfile {
        const p = profile as GoogleTokenPayload;
        return {
            providerId: p.sub,
            email: p.email,
            name: p.name,
            avatar: p.picture,
            provider: 'google',
        };
    }
}
