// OAuthService.js

const OAuthFactory = require("./OAuthFactory");
const config = require("./config");

class OAuthService {
  static getProvider(providerName) {
    return OAuthFactory.create(
      providerName,
      config[providerName]
    );
  }

  static async login(providerName) {
    const provider = this.getProvider(providerName);

    return provider.getAuthUrl();
  }

  static async callback(providerName, code) {
    const provider = this.getProvider(providerName);

    const token = await provider.getAccessToken(code);

    const profile =
      await provider.getUserProfile(token);

    return profile;
  }
}

module.exports = OAuthService;