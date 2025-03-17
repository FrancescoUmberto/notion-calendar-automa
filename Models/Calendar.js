const mongoose = require("mongoose");
const eventSchema = require("./Event").eventSchema;

class Calendar {
  constructor(id) {
    this.id = id;
    this.events = new Map();
  }
  async getCalendar(databaseId) {
    try {
      let calendar = await calendarModel.findOne({ databaseId });
      if (calendar) {
        // Convert plain objects back to proper types
        calendar.events = new Map(
          Object.entries(calendar.events).map(([key, value]) => [
            key,
            new Event(value),
          ])
        );
        return calendar;
      } else {
        const newCalendar = new calendarModel({ databaseId });
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
  events: { type: Map, of: eventSchema, default: new Map() },
});

const calendarModel = mongoose.model("Calendar", calendarSchema);

module.exports = {
  Calendar,
  calendarModel,
  calendarSchema,
};
