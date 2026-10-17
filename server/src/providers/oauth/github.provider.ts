import { ENV } from '../../shared/utils/env.js';
import { OAuthProvider, type NormalizedProfile } from './oauth.provider.js';

interface GithubTokenResponse {
    access_token: string;
    token_type: string;
    scope: string;
}

interface GithubProfile {
    id: number;
    email: string | null;
    name: string | null;
    avatar_url: string;
    login: string;
}

interface GithubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
}

export class GithubOAuthProvider extends OAuthProvider {
    getAuthorizationUrl(): string {
        const params = new URLSearchParams({
            client_id: ENV.GITHUB_CLIENT_ID,
            scope: 'user:email',
            redirect_uri: ENV.GITHUB_CALLBACK_URL,
        });
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    async exchangeCodeForToken(code: string): Promise<string> {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: ENV.GITHUB_CLIENT_ID,
                client_secret: ENV.GITHUB_CLIENT_SECRET,
                code,
            }),
        });
        const data = (await response.json()) as GithubTokenResponse;
        if (!data.access_token) throw new Error('Failed to get GitHub access token');
        return data.access_token;
    }

    async getProfile(accessToken: string): Promise<GithubProfile> {
        const [profileRes, emailsRes] = await Promise.all([
            fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
            fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        ]);

        const profile = (await profileRes.json()) as GithubProfile;

        // Get the primary verified email if public email is not available
        if (!profile.email) {
            const emails = (await emailsRes.json()) as GithubEmail[];
            const primary = emails.find((e) => e.primary && e.verified);
            profile.email = primary?.email ?? null;
        }

        return profile;
    }

    normalize(profile: unknown): NormalizedProfile {
        const p = profile as GithubProfile;
        return {
            providerId: String(p.id),
            email: p.email ?? `${p.login}@github.noemail`,
            name: p.name ?? p.login,
            avatar: p.avatar_url,
            provider: 'github',
        };
    }
}
