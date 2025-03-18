require("dotenv").config();
const router = require("express").Router();
const getUserByEmail = require("../Database/user.db").getUserByEmail;
const addCalendar = require("../Database/calendar.db").addCalendar;
const Auth = require("../core/auth");
const NotionUtils = require("../core/notion");
const Calendar = require("../Models/Calendar").Calendar;

const auth = new Auth();

router.post("/scan", async (req, res) => {
  try {
    const email = req.body.email;
    const scan_state = req.body.scan_state;
    if (!email)
      return res.status(400).send({
        state: "error",
        message: "Missing email parameter",
      });
    if (!scan_state == null)
      return res.status(400).send({
        state: "error",
        message: "Missing scan_state parameter",
      });
    const user = await getUserByEmail(email);
    if (!user)
      return res.status(404).send({
        state: "error",
        message: "User not found",
        email: email,
      });
    if (!user.calendar)
      return res.status(400).send({
        state: "error",
        message: "User has not added a calendar yet",
        email: email,
      });
    user.scan = scan_state;
    user.save();
    await auth.authorizeGoogleAPI(user.token);

    // Start the background scan
    console.log(`Starting background scan for user: ${email}`);

    res.status(200).send({
      state: "success",
      message: scan_state
        ? "Scan has started successfully"
        : "Scan has stopped successfully",
      email: email,
      scan_interval: process.env.SCAN_INTERVAL / 1000 + " seconds",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/add_calendar", async (req, res) => {
  try {
    const email = req.body.email;
    const notion_database_id = req.body.notion_database_id;
    const google_calendar_id = req.body.google_calendar_id;

    if (!email || !notion_database_id || !google_calendar_id) {
      return res.status(400).send({
        state: "error",
        message: "Missing parameters",
        email: email || "missing",
        notion_database_id: notion_database_id || "missing",
        google_calendar_id: google_calendar_id || "missing",
      });
    }

    const user = await getUserByEmail(email);
    if (!user)
      return res.status(404).send({
        state: "error",
        message: "User not found",
        email: email,
      });

    if (!user.calendar) {
      user.notion_database = notion_database_id;
      user.google_calendar = google_calendar_id;
      user.save();
      const state = await addCalendar(
        email,
        notion_database_id,
        google_calendar_id
      );
      return res.send(state);
    } else {
      return res.status(400).send({
        state: "error",
        message: "User already has a calendar",
        email: email,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      state: "error",
      message: "Internal Server Error",
    });
  }
});

router.get("/events", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).send("Missing email parameter");
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send("User not found");

    const calendar = new Calendar();
    const calendarData = await calendar.getCalendar(user.calendarId);
    const notionUtils = new NotionUtils(calendarData);
    const events = await notionUtils.fetchEvents();
    res.send(events);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
