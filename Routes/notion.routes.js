require("dotenv").config();
const router = require("express").Router();
const getUserByEmail = require("../Database/user.db").getUserByEmail;
const Auth = require("../core/auth");
const NotionUtils = require("../core/notion");
const Calendar = require("../Models/Calendar").Calendar;

const auth = new Auth();
const activeScans = new Map(); // Mappa per tenere traccia dei processi attivi

// create a route to start the listening process over the notion database
router.get("/scan", async (req, res) => {
  try {
    // take the query parameter (that should be an email)
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
    const databaseId = user.calendarId;

    const calendar = new Calendar();

    const interval = setInterval(async () => {
      try {
        const calendarData = await calendar.getCalendar(databaseId);
        const notionUtils = new NotionUtils(calendarData);
        await notionUtils.getNotionEvents(calendarData);
        console.log(`Scanning calendar for user: ${email}`);
      } catch (error) {
        console.error(`Error scanning calendar for ${email}:`, error);
      }
    }, process.env.SCAN_INTERVAL); // Default a 10 sec se SCAN_INTERVAL non è definito

    activeScans.set(email, interval);

    res.send("User found, authorized, and scanning started.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
// check if the email (and so the user) exists in the db
// getUserByEmail(email).then((user) => {
//     if (user) {
//       auth.authorizeGoogleAPI(user.token).then(() => {
//         res.send("User found and authorized");
//       });
//     } else {
//       res.send("User not found");
//     }
//   });
