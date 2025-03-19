require("dotenv").config();
const router = require("express").Router();
const { google } = require("googleapis");
const { getUserByEmail, addUser, getUsers } = require("../Database/user.db");
const getCalendars = require("../Database/calendar.db").getCalendars;

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
  oauth2Client.getToken(code, (err, access_token) => {
    if (err) {
      console.error("Error retrieving access token", err);
      res.send("Error");
      return;
    }
    oauth2Client.setCredentials(access_token);

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
            token: access_token,
            user: email,
          };

          getUserByEmail(email).then((user) => {
            if (!user) {
              addUser(email, access_token, null, null, false);
            }
            // always update the token
            if (access_token && user) {
              user.token = JSON.stringify(access_token);
              user.save();
            }
          });

          // Send the response with both the token and email
          JSON.stringify(user, null, 2);
          res.send(user);
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

router.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error("Error retrieving users", error);
    res.send("Error");
  }
});

router.get("/all_calendars", async(req, res) => {
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
})

module.exports = router;
