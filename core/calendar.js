const { google } = require("googleapis");
const Event = require("../Models/Event").Event;
const Auth = require("./auth");
class CalendarUtils {}
const { addEventToCalendar } = require("../Database/calendar.db");

async function addEventToGoogleCalendar(token, calendar_db, eventData, google_calendar_id) {
  const auth = new Auth(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET_ID,
    process.env.REDIRECT_URI
  );

  auth.authorizeGoogleAPI(token).then(async (oauth2Client) => {
    let calendar = google.calendar({ version: "v3", auth: oauth2Client });
    if (!eventData.end) {
      var event = {
        summary: eventData.title,
        start: {
          date: eventData.start.split("T")[0],
          timeZone: "UTC",
        },
        end: {
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
    } else {
      var event = {
        summary: eventData.title,
        start: {
          dateTime: eventData.start,
          timeZone: "UTC",
        },
        end: {
          dateTime: eventData.end,
          timeZone: "UTC",
        },
        colorId: eventData.color.toString(),
      };
    }
    try {
      const calendar_event_id = await calendar.events.insert({
        calendarId: google_calendar_id,
        resource: event,
      });
      console.log({state: "success", message: `Event ${calendar_event_id.data.id} added to Google Calendar`});

      eventData.state = "PUBLISHED";
      eventData.calendar_event_id = calendar_event_id.data.id;
      eventData.google_calendar_id = google_calendar_id;
      state = addEventToCalendar(calendar_db, eventData);

      return calendar_event_id.data.id;
    } catch (error) {
      console.error({
        state: "error",
        message: "Error adding event to Google Calendar",
        error,
      });
      return false;
    }
  });
}

module.exports = { addEventToGoogleCalendar };
