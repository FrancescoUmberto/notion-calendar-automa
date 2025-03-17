require("dotenv").config();
const { Client } = require("@notionhq/client");
const Event = require("../Models/Event").Event;
const addEventToCalendar =
  require("../Database/calendar.db").addEventToCalendar;
const updateEventInCalendar =
  require("../Database/calendar.db").updateEventInCalendar;

const scheduledEvents = new Map();
let state = {};
class NotionUtils {
  constructor(calendar) {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY });
    this.notion_database_id = calendar.id;
    this.lastChecked = new Date().toISOString();
    this.eventsList = new Map(
      calendar.events.map((event) => [event.id, event])
    );
    this.calendar = calendar;
  }

  async fetchEvents() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.notion_database_id,
      });
      if (!response.results) {
        state = {
          state: "error",
          message: "No events found in the database",
        };
        console.log(state);
        return [];
      }
      const events = response.results.map((page) => {
        state = {
          state: "success",
          message: "Events fetched successfully",
        };
        // console.log(state);
        return Event.fromNotionPage(this.notion_database_id, page);
      });
      return events;
    } catch (error) {
      state = {
        state: "error",
        message: "Error fetching events from Notion",
      };
      return [];
    }
  }

  eventFilter(events, lastCheckedTruncated) {
    let newEvents = events.filter((event) => {
      // console.log(`${event.last_edited_time} >= ${lastCheckedTruncated}`)
      return event.last_edited_time >= lastCheckedTruncated;
    });

    newEvents.forEach((event) => {
      // set the state to pending
      event.state = "PENDING";
    });

    return newEvents;
  }

  async getNotionEvents() {
    try {
      const events = await this.fetchEvents();
      const lastCheckedTruncated = Event.truncateToMinutes(
        new Date(this.lastChecked)
      );
      let newEvents = [];
      newEvents = await this.eventFilter(events, lastCheckedTruncated);
      if (newEvents.length > 0) {
        newEvents.forEach((event) => {
          if (scheduledEvents.has(event.id)) {
            state = {
              state: "success",
              message: `Event ${event.id} found in scheduledEvents`,
              action: "reset",
            };
            console.log(state);
            scheduledEvents.set(event.id, {
              ...scheduledEvents.get(event.id),
              no_update_counter: 0,
            });
          } else if (this.eventsList.has(event.id)) {
            state = {
              state: "success",
              message: `Event ${event.id} found in eventsList`,
              action: "update",
            };
            console.log(state);
            scheduledEvents.set(event.id, {
              event: event,
              calendar: this.calendar.id,
              no_update_counter: 0,
              update: true,
            });
          } else {
            state = {
              state: "success",
              message: `Event ${event.id} not found in eventsList`,
              action: "add to scheduledEvents",
            };
            console.log(state);
            scheduledEvents.set(event.id, {
              event: event,
              calendar: this.calendar.id,
              no_update_counter: 0,
              update: false,
            });
          }
        });
      } else {
        scheduledEvents.forEach((value, key) => {
          if (!newEvents.some((event) => event.id === key)) {
            state = {
              state: "success",
              message: `Event ${key} not found in newEvents`,
              action: "increment no_update_counter",
            };
            console.log(state);
            scheduledEvents.set(key, {
              ...value,
              no_update_counter: value.no_update_counter + 1,
            });
          }
        });

        scheduledEvents.forEach((value, key) => {
          if (value.no_update_counter === 1) {
            state = {
              state: "success",
              message: `Event ${key} has no updates for 1 cycle`,
              action: "publish and remove from scheduledEvents",
            };
            console.log(state);
            value.event.published_time = new Date().toISOString();
            if (value.update === true) {
              // update the event in the database
              value.event.state = "PUBLISHED";
              state = updateEventInCalendar(value.event);
              console.log(state);
            } else {
              value.event.state = "PUBLISHED";
              state = addEventToCalendar(this.calendar, value.event);
              console.log(state);
            }
            scheduledEvents.delete(key);
          }
        });
      }
      state = {
        state: "success",
        message: "Scheduled events after update",
        scheduledEvents: scheduledEvents,
      };
      console.log(state);

      this.lastChecked = new Date().toISOString();

      return newEvents;
    } catch (error) {
      state = {
        state: "error",
        message: error,
      }
      console.error(state);
      return [];
    }
  }
}

module.exports = NotionUtils;
