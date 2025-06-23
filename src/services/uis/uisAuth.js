const logger = require('../../utils/logger');

class UISAuth {
  constructor() {
    this.token = process.env.UIS_API_TOKEN;
    this.tokenExpiry = null;
  }

  async getToken() {
    // For now, using static token from environment
    // In production, implement token refresh logic if needed
    if (!this.token) {
      throw new Error('UIS API token not configured');
    }

    return this.token;
  }

  async refreshToken() {
    // Implement token refresh logic if UIS requires it
    logger.info('Refreshing UIS API token');
    // This is a placeholder - implement based on UIS documentation
    return this.token;
  }
}

module.exports = new UISAuth();
