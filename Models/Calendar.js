const mongoose = require("mongoose");
const eventSchema = require("./Event").eventSchema;

class Calendar {
  constructor(id) {
    this.id = id;
    this.events = new Map();
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
