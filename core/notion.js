require("dotenv").config();
const { Client } = require("@notionhq/client");
const Event = require("../Models/Event").Event;

const scheduledEvents = new Map();
class NotionUtils {
  constructor(calendar) {
    this.notion = new Client({ auth: process.env.NOTION_API_KEY }); // doesn't change
    this.notion_database_id = calendar.id;
    this.lastChecked = new Date().toISOString();
    this.eventsList =
      calendar.events instanceof Map
        ? calendar.events
        : new Map(calendar.events);
    this.calendar = calendar;
  }

  async fetchEvents() {
    try {
      const response = await this.notion.databases.query({
        database_id: this.notion_database_id,
      });
      if (!response.results) {
        console.error("❌ No events found in Notion database");
        return [];
      }
      const events = response.results.map((page) => {
        return Event.fromNotionPage(this.notion_database_id, page);
      });
      return events;
    } catch (error) {
      console.error("❌ Error fetching events from Notion:", error);
      return [];
    }
  }

  eventFilter(events, lastCheckedTruncated) {
    let newEvents = events.filter((event) => {
      return (
        event.last_edited_time >= lastCheckedTruncated &&
        !this.eventsList.has(event.id)
      );
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
      const newEvents = await this.eventFilter(events, lastCheckedTruncated);
      if (newEvents.length > 0) {
        newEvents.forEach((event) => {
          if (scheduledEvents.has(event.id)) {
            console.log(
              `✅ Event ${event.id} found in scheduledEvents, resetting counter`
            );
            scheduledEvents.set(event.id, {
              ...scheduledEvents.get(event.id),
              no_update_counter: 0,
            });
          } else {
            console.log(`➕ Adding new event ${event.id} to scheduledEvents`);
            scheduledEvents.set(event.id, {
              event: event,
              calendar: this.calendar.id,
              no_update_counter: 0,
            });
          }
        });
      }

      scheduledEvents.forEach((value, key) => {
        if (!newEvents.some((event) => event.id === key)) {
          console.log(
            `🔼 Event ${key} not found in newEvents, increasing counter`
          );
          scheduledEvents.set(key, {
            ...value,
            no_update_counter: value.no_update_counter + 1,
          });
        }
      });

      scheduledEvents.forEach((value, key) => {
        if (value.no_update_counter === 3) {
          console.log(
            `🚀 Event ${key} published and removed from scheduledEvents`
          );
          value.event.state = "PUBLISHED";
          scheduledEvents.delete(key);
        }
      });

      console.log("📌 Scheduled events after update:", scheduledEvents);

      this.lastChecked = new Date().toISOString();

      return newEvents;
    } catch (error) {
      console.error("❌ Error retrieving events from Notion:", error);
      return [];
    }
  }
}

module.exports = NotionUtils;
