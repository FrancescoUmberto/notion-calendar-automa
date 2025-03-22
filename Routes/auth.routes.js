require("dotenv").config();
const router = require("express").Router();
const { google } = require("googleapis");
const { getUserByEmail, addUser, getUsers } = require("../Database/user.db");
const getCalendars = require("../Database/calendar.db").getCalendars;

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID,
//   process.env.GOOGLE_SECRET_ID,
//   process.env.REDIRECT_URI
// );

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET_ID,
    process.env.REDIRECT_URI
  );
}

async function authenticateUser(req, res, next) {
  const email = req.query.email;
  if (!email) return res.status(400).send("Email is required");

  const user = await getUserByEmail(email);
  if (!user || !user.token)
    return res.status(401).send("User not authenticated");

  const oauth2Client = createOAuthClient();
  const tokens = JSON.parse(user.token);

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  // Refresh token if expired
  if (new Date().getTime() >= tokens.expiry_date) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.token = JSON.stringify(credentials);
      await user.save();
      oauth2Client.setCredentials(credentials);
    } catch (refreshErr) {
      console.error("Token refresh failed:", refreshErr);
      return res.status(401).send("Session expired, please re-authenticate");
    }
  }

  req.oauth2Client = oauth2Client;
  next();
}

router.get("/", (req, res) => {
  const oauth2Client = createOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });
  res.redirect(url);
});

router.get("/redirect", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.status(400).send("Missing authorization code");
  }
  // oauth2Client.getToken(code, (err, access_token) => {
  //   if (err) {
  //     console.error("Error retrieving access token", err);
  //     res.send("Error");
  //     return;
  //   }
  //   oauth2Client.setCredentials(access_token);

  //   // Get the user info after setting credentials
  //   oauth2Client
  //     .getRequestHeaders()
  //     .then(() => {
  //       const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });

  //       oauth2.userinfo.get((err, response) => {
  //         if (err) {
  //           console.error("Error retrieving user info", err);
  //           res.send("Error");
  //           return;
  //         }

  //         const email = response.data.email;

  //         // Create the user object containing both the token and the email
  //         const user = {
  //           token: access_token,
  //           user: email,
  //         };

  //         getUserByEmail(email).then((user) => {
  //           if (!user) {
  //             addUser(email, access_token, null, null, false);
  //           }
  //           // always update the token
  //           if (access_token && user) {
  //             user.token = JSON.stringify(access_token);
  //             user.save();
  //           }
  //         });

  //         // Send the response with both the token and email
  //         JSON.stringify(user, null, 2);
  //         res.send(user);
  //       });
  //     })
  //     .catch((error) => {
  //       console.error("Error getting request headers", error);
  //       res.send("Error");
  //     });
  // });
  try {
    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    const email = data.email;

    if (!email) {
      return res.status(400).send("Could not retrieve user email");
    }

    // Store or update user
    let user = await getUserByEmail(email);
    if (!user) {
      await addUser(
        email,
        tokens.access_token,
        tokens.refresh_token,
        null,
        false
      );
    } else {
      user.token = JSON.stringify(tokens);
      await user.save();
    }

    res.json({ message: "Authenticated successfully", user: email, tokens });
  } catch (err) {
    console.error("OAuth Redirect Error:", err);
    res.status(500).send("Authentication Failed");
  }
});

router.get("/calendars", authenticateUser, async (req, res) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: req.oauth2Client });
    const { data } = await calendar.calendarList.list();
    res.json(data.items);
  } catch (err) {
    console.error("Error fetching calendars:", err);
    res.status(500).send("Failed to retrieve calendars");
  }
});

router.get("/events", authenticateUser, async (req, res) => {
  const calendarID = req.query.calendarId || "primary";

  try {
    const calendar = google.calendar({ version: "v3", auth: req.oauth2Client });
    const { data } = await calendar.events.list({
      calendarId: calendarID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
    res.json(data.items);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Failed to retrieve events");
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error retrieving users", error);
    res.send("Error");
  }
});

router.get("/all_calendars", async (req, res) => {
  try {
    const calendars = await getCalendars();
    // populate the events
    for (let calendar of calendars) {
      await calendar.populate("events");
    }
    res.json(calendars);
  } catch (error) {
    console.error("Error retrieving calendars", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
