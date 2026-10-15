export const clientId = process.env.GITHUB_CLIENT_ID;
export const clientSecret = process.env.GITHUB_CLIENT_SECRET;

const redirectUri =
    process.env.GITHUB_REDIRECT_URI ??
    'http://localhost:4000/api/v2/auth/github/callback';

export const githubAuthUrl = new URL(
    'https://github.com/login/oauth/authorize',
);
githubAuthUrl.searchParams.set('client_id', clientId ?? '');
githubAuthUrl.searchParams.set('scope', 'user:email');
githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
