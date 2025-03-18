const calendarModel = require("../Models/Calendar").calendarModel;
const userModel = require("../Models/User").userModel;
const eventModel = require("../Models/Event").eventModel;

async function getCalendarByID(id) {
  try {
    const calendar = await calendarModel.findOne({ id: id });
    return calendar;
  } catch (err) {
    console.log(err);
  }
}

async function addCalendar(email, notion_database_id) {
  try {
    const newCalendar = new calendarModel({ id: notion_database_id });
    await newCalendar.save();

    const user = await userModel.findOne({ email: email });
    if (!user) return "User not found";

    user.calendar = newCalendar._id;
    await user.save();

    return { state: "success", message: "Calendar added successfully" };
  } catch (err) {
    console.log(err);
    return { state: "error", message: err };
  }
}

async function addEventToCalendar(calendar, event) {
  try {
    const eventDoc = new eventModel(event);
    await eventDoc.save();

    if (!Array.isArray(calendar.events)) {
      calendar.events = [];
    }

    calendar.events.push(eventDoc._id);
    await calendar.save();

    return { state: "success", message: "Event added successfully" };
  } catch (err) {
    console.log(err);
  }
}

async function updateEventInCalendar(event) {
  try {
    const updatedEvent = await eventModel.findOneAndUpdate(
      { id: event.id },
      event,
      { new: true, overwrite: true }
    );

    if (!updatedEvent) {
      console.error("Event not found in database");
      return;
    }

    return { state: "success", message: "Event updated successfully" };
  } catch (err) {
    console.log(err);
  }
}

async function getCalendars() {
  try {
    const calendars = await calendarModel.find();
    return calendars;
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getCalendarByID,
  addCalendar,
  addEventToCalendar,
  updateEventInCalendar,
  getCalendars
};
