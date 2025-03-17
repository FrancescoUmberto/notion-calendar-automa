const mongoose = require("mongoose");

class Event {
  constructor(
    id,
    calendar_id,
    calendar_event_id,
    state,
    title,
    type,
    color,
    start,
    end,
    last_edited_time,
    published_time
  ) {
    if (!Object.values(EventState).includes(state)) {
      throw new Error(`Invalid state: ${state}`);
    }
    color = EventColor[color.toLowerCase()];
    if (!Object.values(EventColor).includes(color)) {
      throw new Error(`Invalid color: ${color}`);
    }
    this.id = id;
    this.calendar_id = calendar_id;
    this.calendar_event_id = calendar_event_id;
    this.state = state;
    this.title = title;
    this.type = type;
    this.color = color;
    this.start = start;
    this.end = end;
    this.last_edited_time = last_edited_time;
    this.published_time = published_time;
  }
}
const EventState = Object.freeze({
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  INCOMPLETE: "INCOMPLETE",
});

const EventColor = Object.freeze({
  gray: 8,
  brown: 1,
  orange: 6,
  yellow: 5,
  green: 10,
  blue: 9,
  purple: 3,
  pink: 2,
  red: 4,
});

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true },
  google_calendar_id: { type: String, required: false },
  state: { type: String, required: true },
  title: { type: String, required: true },
  start: { type: Date, required: false },
  end: { type: Date, required: false },
  last_edited_time: { type: Date, required: true },
  published_time: { type: Date, required: false },
});

const eventModel = mongoose.model("Event", eventSchema);

module.exports = {
  Event,
  eventModel,
  eventSchema,
};
