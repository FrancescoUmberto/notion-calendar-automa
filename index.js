require("dotenv").config();
const express = require("express");
// const Auth = require("./core/auth");
const { Client } = require("@notionhq/client");
const User = require("./Models/User").userModel;
const NotionUtils = require("./core/notion");
const Calendar = require("./Models/Calendar").Calendar;
const { connectToDatabase } = require("./Database/database");
const { addEventToGoogleCalendar } = require("./core/calendar");
const authRouter = require("./Routes/auth.routes");
const notionRouter = require("./Routes/notion.routes");

// var auth = new Auth(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_SECRET_ID, process.env.REDIRECT_URI);
const app = express();
// use the endpoint defined in the core/calendar.endpoints.js file
app.use(express.json());
app.use("/", authRouter);
app.use("/notion", notionRouter);

const activeScans = new Map();
var state = {};

connectToDatabase(() => {
  app.listen(process.env.PORT, async () => {
    state = {
      server: "running",
      url: `http://${process.env.HOST}:${process.env.PORT}`,
      database: "connected",
    };
    console.log(state);
    try {
      var notion = new Client({ auth: process.env.NOTION_API_KEY });
    } catch (error) {
      state = {
        state: "Notion | Google API error",
        message: error.message,
      };
      console.error(state);
    }
    /** get all the users that are being scanned and start the background scan for each user
    this is done to ensure that the background scan is started even if the server is restarted **/

    const interval = setInterval(() => {
      runScan();
    }, process.env.SCAN_INTERVAL);

    async function runScan() {
      let users = await User.find({ scan: true });
      const calendar = new Calendar();
      for (const user of users) {
        try {
          const calendarData = await calendar.getCalendar(user.calendar);
          const notionUtils = new NotionUtils(notion, calendarData, user.email, user.token, user.google_calendar);
          await notionUtils.notionEventsHandler();
          users = await User.find({ scan: true });
          if (!users.find((u) => u.email === user.email)) {
            activeScans.delete(user.email);
            clearInterval(interval);
          }
        } catch (error) {
          state = {
            state: "error",
            message: error.message,
            email: user.email,
          };
          console.error(state);
        }
        activeScans.set(user.email, interval);
      }
    }
  });
});
