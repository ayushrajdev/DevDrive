const BaseOAuthProvider = require("./BaseOAuthProvider");

class GoogleOAuthProvider extends BaseOAuthProvider {
  async getAuthorizationUrl() {
    // build google url
  }

  async exchangeCodeForToken(code) {
    // google token api
  }

  async getProfile(token) {
    // google user api
  }

  normalize(profile) {
    return {
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatar: profile.picture,
      provider: "google",
    };
  }
}

module.exports = GoogleOAuthProvider;