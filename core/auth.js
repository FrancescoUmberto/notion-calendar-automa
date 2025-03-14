const fs = require("fs");
const { google } = require("googleapis");
const readline = require("readline");
class auth {
  constructor(GOOGLE_CLIENT_ID, GOOGLE_SECRET_ID, REDIRECT_URI) {
    // Google API configuration
    this.SCOPES = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
    ];
    this.TOKEN_PATH = "./tokens/token.json";
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_SECRET_ID,
      REDIRECT_URI
    );
  }

  // Function to authenticate with Google Calendar API
  authorizeGoogleAPI() {
    return new Promise((resolve, reject) => {
      // Check if there's a saved token
      fs.readFile(this.TOKEN_PATH, (err, token) => {
        if (err) {
          console.log(err);
        } else {
          this.oauth2Client.setCredentials(JSON.parse(token));
          resolve(this.oauth2Client);
        }
      });
    });
  }
  // Function to get the access token from the authorization code
  getAuthURL() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.SCOPES,
    });
    console.log(
      "📅 Google authentication required, open the following URL and enter the code: ",
      authUrl
    );
    return authUrl;
  }
}

module.exports = auth;
