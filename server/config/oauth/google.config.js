import { OAuth2Client } from 'google-auth-library';

const clientId =
    '49496056122-gtvbtjankhnq56ei05dmv01v7nsgjvvq.apps.googleusercontent.com';

const clientSecret = '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';
const redirectUrl = 'http://localhost:3000';

export const googleAuthClient = new OAuth2Client({
    client_id: clientId,
    // client_secret: clientSecret,
    // redirect_uris: redirectUrl,
});


