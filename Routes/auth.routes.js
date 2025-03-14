require("dotenv").config();
const router = require("express").Router();
const fs = require("fs");
const { google } = require("googleapis");
const { getUserByEmail, addUser } = require("../Database/user.db");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET_ID,
  process.env.REDIRECT_URI
);

router.get("/", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
});

router.get("/redirect", (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, (err, token) => {
    if (err) {
      console.error("Error retrieving access token", err);
      res.send("Error");
      return;
    }

    oauth2Client.setCredentials(token);

    // Get the user info after setting credentials
    oauth2Client
      .getRequestHeaders()
      .then(() => {
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });

        oauth2.userinfo.get((err, response) => {
          if (err) {
            console.error("Error retrieving user info", err);
            res.send("Error");
            return;
          }

          const email = response.data.email;

          // Create the user object containing both the token and the email
          const user = {
            token: token,
            user: email,
          };

          getUserByEmail(email).then((user) => {
            if (!user) {
              addUser(email, token);
            }
          });

          // Send the response with both the token and email
          JSON.stringify(user, null, 2);
          res.send(user);

          // Save the token inside a JSON file
          fs.writeFile("tokens/token.json", JSON.stringify(token), (err) => {
            if (err) {
              console.error("Error saving token", err);
              res.send("Error");
              return;
            }
            console.log("Token saved");
          });
        });
      })
      .catch((error) => {
        console.error("Error getting request headers", error);
        res.send("Error");
      });
  });
});

router.get("/calendars", (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  calendar.calendarList.list({}, (err, calendarList) => {
    if (err) {
      console.error("Error retrieving calendar list", err);
      res.send("Error");
      return;
    }
    const calendars = calendarList.data.items;
    res.json(calendars);
  });
});

router.get("/events", (req, res) => {
  const calendarID = req.query.calendarId ?? "primary";
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  calendar.events.list(
    {
      calendarId: calendarID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    },
    (err, events) => {
      if (err) {
        console.error("Error retrieving events", err);
        res.send("Error");
        return;
      }
      const eventsList = events.data.items;
      res.json(eventsList);
    }
  );
});

module.exports = router;
