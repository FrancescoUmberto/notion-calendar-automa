const { google } = require("googleapis");
const Event = require("../Models/Event").Event;
const Auth = require("./auth");
const { addEventToCalendar } = require("../Database/calendar.db");

async function addEvent(token, calendar_db, eventData, google_calendar_id) {
  try {
    const auth = new Auth(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_SECRET_ID,
      process.env.REDIRECT_URI
    );

    // Authenticate with stored token and refresh if needed
    const updatedTokens = await auth.authenticateWithToken(token);
    const oauth2Client = auth.getOAuthClient();

    let calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create event object based on eventData
    const event = {
      summary: eventData.title,
      start: eventData.end
        ? { dateTime: eventData.start, timeZone: "UTC" }
        : { date: eventData.start.split("T")[0], timeZone: "UTC" },
      end: eventData.end
        ? { dateTime: eventData.end, timeZone: "UTC" }
        : {
            date: new Date(
              new Date(eventData.start).setDate(
                new Date(eventData.start).getDate() + 1
              )
            )
              .toISOString()
              .split("T")[0],
            timeZone: "UTC",
          },
      colorId: eventData.color.toString(),
    };

    // Insert event into Google Calendar
    const calendar_event_id = await calendar.events.insert({
      calendarId: google_calendar_id,
      resource: event,
    });

    console.log({
      state: "success",
      message: `Event ${calendar_event_id.data.id} added to Google Calendar`,
    });

    // Update eventData with event details
    eventData.state = "PUBLISHED";
    eventData.calendar_event_id = calendar_event_id.data.id;
    eventData.google_calendar_id = google_calendar_id;

    // Save event to database
    await addEventToCalendar(calendar_db, eventData);

    return calendar_event_id.data.id;
  } catch (error) {
    console.error({
      state: "error",
      message: "Error adding event to Google Calendar",
      error,
    });
    return false;
  }
}

async function updateEvent(token, calendar_db, eventData, google_calendar_id) {
  try {
    const auth = new Auth(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_SECRET_ID,
      process.env.REDIRECT_URI
    );

    // Authenticate with stored token and refresh if needed
    const updatedTokens = await auth.authenticateWithToken(token);
    const oauth2Client = auth.getOAuthClient();

    let calendar = google.calendar({ version: "v3", auth: oauth2Client });

    if (!eventData.calendar_event_id) {
      console.error("Error: Calendar Event ID is missing.");
      return false;
    }

    // Create updated event object
    const event = {
      summary: eventData.title,
      start: eventData.end
        ? { dateTime: eventData.start, timeZone: "UTC" }
        : { date: eventData.start.split("T")[0], timeZone: "UTC" },
      end: eventData.end
        ? { dateTime: eventData.end, timeZone: "UTC" }
        : {
            date: new Date(
              new Date(eventData.start).setDate(
                new Date(eventData.start).getDate() + 1
              )
            )
              .toISOString()
              .split("T")[0],
            timeZone: "UTC",
          },
      colorId: eventData.color.toString(),
    };

    // Update event in Google Calendar
    const calendar_event_id = await calendar.events.update({
      calendarId: google_calendar_id,
      eventId: eventData.calendar_event_id,
      resource: event,
    });

    console.log({
      state: "success",
      message: `Event ${calendar_event_id.data.id} updated in Google Calendar`,
    });

    // Update event state and save it to database
    eventData.state = "PUBLISHED";
    await addEventToCalendar(calendar_db, eventData);

    return calendar_event_id.data.id;
  } catch (error) {
    console.error({
      state: "error",
      message: "Error updating event in Google Calendar",
      error,
    });
    return false;
  }
}

module.exports = { addEvent, updateEvent };
