require("dotenv").config();
const router = require("express").Router();
const getUserByEmail = require("../Database/user.db").getUserByEmail;
const addCalendar = require("../Database/calendar.db").addCalendar;
const Auth = require("../core/auth");
const NotionUtils = require("../core/notion");
const Calendar = require("../Models/Calendar").Calendar;

const auth = new Auth();
const activeScans = new Map();

router.get("/scan", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).send("Missing email parameter");
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send("User not found");
    await auth.authorizeGoogleAPI(user.token);

    // If the user is already being scanned, return an error
    if (activeScans.has(email)) {
      return res.send("User already being scanned in background.");
    }

    // Start the background scan
    console.log(`Starting background scan for user: ${email}`);
    const notion_database_id = user.calendarId;

    const calendar = new Calendar();

    const interval = setInterval(async () => {
      try {
        const calendarData = await calendar.getCalendar(notion_database_id);
        // console.log(calendarData);
        const notionUtils = new NotionUtils(calendarData);
        await notionUtils.getNotionEvents(calendarData);
        console.log(`Scanning calendar for user: ${email}`);
      } catch (error) {
        console.error(`Error scanning calendar for ${email}:`, error);
      }
    }, process.env.SCAN_INTERVAL);

    activeScans.set(email, interval);

    res.send("User found, authorized, and scanning started.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/add_calendar", async (req, res) => {
  try {
    const email = req.body.email;
    const notion_database_id = req.body.notion_database_id;

    if (!email || !notion_database_id) {
      return res.status(400).send("Missing email or notion_database_id");
    }

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).send("User not found");
    const state = await addCalendar(email, notion_database_id);
    return res.send(state);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
