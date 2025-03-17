const mongoose = require("mongoose");
const eventSchema = require("./Event").eventSchema;

class Calendar {
  constructor(id) {
    this.id = id;
    this.events = new Map();
  }
  async getCalendar(databaseId) {
    try {
      let calendar = await calendarModel
        .findOne({ databaseId })
        .populate("events");
      if (calendar) {
        return calendar;
      } else {
        const newCalendar = new calendarModel({ databaseId, events: [] });
        await newCalendar.save();
        return newCalendar;
      }
    } catch (error) {
      console.error("Error in getCalendar:", error);
    }
  }

  async saveEvent(calendar, event) {
    try {
      calendar.events.set(event.id, event);
      await calendar.save();
    } catch (error) {
      console.error("Error in saveEvent:", error);
    }
  }
}

const calendarSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
});

const calendarModel = mongoose.model("Calendar", calendarSchema);

module.exports = {
  Calendar,
  calendarModel,
  calendarSchema,
};
