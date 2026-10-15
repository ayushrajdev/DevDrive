class OAuthProviderFactory {
  static providers = {
    google: GoogleOAuthProvider,
    github: GithubOAuthProvider,
    facebook: FacebookOAuthProvider,
  };

  static create(provider) {
    const Provider = this.providers[provider];

    if (!Provider)
      throw new Error("Invalid provider");

    return new Provider();
  }
}