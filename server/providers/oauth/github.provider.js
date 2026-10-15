class GithubOAuthProvider extends BaseOAuthProvider {
  async getAuthorizationUrl() {}

  async exchangeCodeForToken(code) {}

  async getProfile(token) {}

  normalize(profile) {
    return {
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar_url,
      provider: "github",
    };
  }
}