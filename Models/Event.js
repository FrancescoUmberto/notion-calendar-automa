const mongoose = require("mongoose");

class Event {
  constructor(
    id,
    notion_database_id,
    google_calendar_id,
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
    this.notion_database_id = notion_database_id;
    this.google_calendar_id = google_calendar_id;
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
  static fromNotionPage(notion_database_id, page) {
    if (
      page.properties.Date?.date?.start &&
      !page.properties.Date?.date?.start.includes("T") &&
      !page.properties.Date?.date?.end
    ) {
      page.properties.Date.date.start += "T00:00:00.000Z";
    }
    // console.log(new Date(page.last_edited_time));
    const newEvent = new Event(
      page.id,
      notion_database_id,
      null,
      null,
      EventState.PENDING,
      page.properties.Name?.title?.[0]?.plain_text,
      page.properties["Event Type"]?.select?.name,
      page.properties["Event Type"]?.select?.color,
      page.properties.Date?.date?.start,
      page.properties.Date?.date?.end,
      new Date(page.last_edited_time),
      null
    );
    return newEvent;
  }

  static truncateToMinutes(date) {
    return new Date(date.setSeconds(0, 0));
  }

  static checkEventCompleteness(event) {
    if (event.title && event.type && event.color && event.start && event.end) {
      event.state = EventState.PUBLISHED;
    } else {
      event.state = EventState.INCOMPLETE;
    }
  }

  static applyChanges(event, changes) {
    for (const [key, value] of Object.entries(changes)) {
      // Only update if the new value is not null and different from the existing one
      if (value !== null && value !== undefined && event[key] !== value) {
        event[key] = value;
      }
    }
    Event.checkEventCompleteness(event);
    return event;
  }
}
const EventState = Object.freeze({
  PENDING: "PENDING",
  PUBLISHING: "PUBLISHING",
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
  notion_database_id: { type: String, required: true },
  google_calendar_id: { type: String, required: false },
  calendar_event_id: { type: String, required: false },
  state: { type: String, required: true },
  title: { type: String, required: true },
  start: { type: Date, required: false },
  end: { type: Date, required: false },
  color: { type: Number, required: true },
  last_edited_time: { type: Date, required: true },
  published_time: { type: Date, required: false },
});

const eventModel = mongoose.model("Event", eventSchema);

module.exports = {
  Event,
  eventModel,
  eventSchema,
};
