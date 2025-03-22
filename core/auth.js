const { google } = require("googleapis");

class Auth {
  constructor(GOOGLE_CLIENT_ID, GOOGLE_SECRET_ID, REDIRECT_URI) {
    // Google API configuration
    this.SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
    ];
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_SECRET_ID,
      REDIRECT_URI
    );
  }

  // Function to generate Google authentication URL
  getAuthURL() {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.SCOPES,
      prompt: "consent", // Ensures a refresh token is always provided
    });
  }

  // Function to exchange authorization code for tokens and user email
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user email from Google API
      const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      const email = data.email;

      if (!email) throw new Error("Could not retrieve user email");

      return { tokens, email };
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      throw error;
    }
  }

  // Function to authenticate with stored tokens
  async authenticateWithToken(tokenData) {
    try {
      const tokens = JSON.parse(tokenData);
      this.oauth2Client.setCredentials(tokens);

      // Refresh token if needed
      if (new Date().getTime() >= tokens.expiry_date) {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials;
      }

      return tokens;
    } catch (error) {
      console.error("Error authenticating with token:", error);
      throw error;
    }
  }

  // Get OAuth2 client instance
  getOAuthClient() {
    return this.oauth2Client;
  }
}

module.exports = Auth;
