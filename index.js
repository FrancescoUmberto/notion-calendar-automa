require("dotenv").config();
const { Client } = require("@notionhq/client");
const { connectToDatabase } = require("./Database/database");

const authRouter = require("./Routes/auth.routes");
const notionRouter = require("./Routes/notion.routes");
const express = require("express");

const NotionUtils = require("./core/notion");
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const Calendar = require("./Models/Calendar").Calendar;
const User = require("./Models/User").userModel;

const app = express();
// use the endpoint defined in the core/calendar.endpoints.js file
app.use(express.json());
app.use("/", authRouter);
app.use("/notion", notionRouter);

const activeScans = new Map();
let state = {};

connectToDatabase(() => {
  app.listen(process.env.PORT, async () => {
    const status = {
      server: "running",
      url: `http://${process.env.HOST}:${process.env.PORT}`,
      database: "connected",
    };
    console.log(status);

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
          const notionUtils = new NotionUtils(notion, calendarData, user.email);
          await notionUtils.getNotionEvents(calendarData);

          users = await User.find({ scan: true });
          if (!users.find((u) => u.email === user.email)) {
            activeScans.delete(user.email);
            clearInterval(interval);
          }
        } catch (error) {
          console.error(`Error scanning calendar for ${user.email}:`, error);
        }
        activeScans.set(user.email, interval);
      }
    }
  });
});
