// OAuthProvider.js

class OAuthProvider {
    async getAuthorizationUrl() {
        throw new Error('Not implemented');
    }

    async exchangeCodeForToken(code) {
        throw new Error('Not implemented');
    }

    async getProfile(accessToken) {
        throw new Error('Not implemented');
    }

    normalize(profile) {
        throw new Error('Not implemented');
    }
}

module.exports = BaseOAuthProvider;
