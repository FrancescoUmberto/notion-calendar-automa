require("dotenv").config();
const Event = require("../Models/Event").Event;
const { updateEventInCalendar } = require("../Database/calendar.db");
const { addEvent, updateEvent } = require("../core/calendar");
const scheduledEvents = new Map();
let state = {};
class NotionUtils {
  constructor(notion, calendar, email, token, google_calendar_id) {
    this.notion = notion;
    this.notion_database_id = calendar.id;
    this.google_calendar_id = google_calendar_id;
    this.lastChecked = new Date().toISOString();
    this.eventsList = new Map(
      calendar.events.map((event) => [event.id, event])
    );
    this.calendar = calendar;
    this.email = email;
    this.token = token;
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

  async notionEventsHandler() {
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
              user: this.email,
              message: `Event ${event.id} found in scheduledEvents`,
              action: "reset no_update_counter",
            };
            console.log(state);
            scheduledEvents.set(event.id, {
              ...scheduledEvents.get(event.id),
              no_update_counter: 0,
            });
          } else if (this.eventsList.has(event.id)) {
            state = {
              state: "success",
              user: this.email,
              message: `Event ${event.id} found in eventsList`,
              action: "add to scheduledEvents",
            };
            console.log(state);
            // scheduledEvents.set(event.id, {
            //   event: event,
            //   calendar: this.calendar.id,
            //   no_update_counter: 0,
            //   update: true,
            // });
            let existingEvent = this.eventsList.get(event.id);

            // Apply changes (only update changed values)
            let updatedEvent = Event.applyChanges(existingEvent, event);
            console.log(updatedEvent);  
            // Store the updated event in scheduledEvents
            scheduledEvents.set(event.id, {
              event: updatedEvent,
              calendar: this.calendar.id,
              no_update_counter: 0,
              update: true,
            });
          } else {
            state = {
              state: "success",
              user: this.email,
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
              user: this.email,
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

        scheduledEvents.forEach(async (value, key) => {
          if (value.no_update_counter === 1) {
            if (new Date(value.event.start)) {
              state = {
                state: "success",
                user: this.email,
                message: `Event ${key} has no updates for 1 cycle`,
                action: "publish and remove from scheduledEvents",
              };
              console.log(state);
              value.event.published_time = new Date().toISOString();
              if (value.update === true) {
                // update the event in the database
                value.event.state = "PUBLISHING";
                state = updateEvent(
                  this.token,
                  this.calendar,
                  value.event,
                  this.google_calendar_id
                );
              } else {
                addEvent(
                  this.token,
                  this.calendar,
                  value.event,
                  this.google_calendar_id
                );
              }
            } else {
              state = {
                state: "error",
                user: this.email,
                message: `Event ${key} has no valid date`,
                action: "remove from scheduledEvents",
              };
              console.log(state);
            }
            scheduledEvents.delete(key);
          }
        });
      }
      state = {
        state: "success",
        user: this.email,
        message: "Scheduled events",
        scheduledEvents: newEvents.map((event) => event.title),
      };
      console.log(state);

      this.lastChecked = new Date().toISOString();

      return newEvents;
    } catch (error) {
      state = {
        state: "error",
        message: error,
      };
      console.error(state);
      return [];
    }
  }
}

module.exports = NotionUtils;
